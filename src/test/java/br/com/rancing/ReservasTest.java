package br.com.rancing;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Pattern;

/** Testes executáveis com o próprio JDK, sem JUnit ou dependências. */
public final class ReservasTest {
    private static int verificacoes;
    private static final Clock RELOGIO = Clock.fixed(Instant.parse("2030-01-01T12:00:00Z"), ReservaService.FUSO);
    private static final LocalDateTime INICIO = LocalDateTime.of(2030, 1, 2, 9, 0);

    public static void main(String[] args) throws Exception {
        Path temporario = Files.createTempDirectory("rancing-test-");
        try {
            regrasEPersistencia(temporario);
            concorrencia(temporario);
            falhaDeGravacao(temporario);
            apiEArquivos(temporario);
            System.out.println("APROVADO: " + verificacoes + " verificações Java (regras, persistência, concorrência e HTTP).");
        } finally {
            try (var arquivos = Files.walk(temporario)) {
                for (Path arquivo : arquivos.sorted(Comparator.reverseOrder()).toList()) Files.delete(arquivo);
            }
        }
    }

    private static void regrasEPersistencia(Path temporario) throws Exception {
        Path arquivo = temporario.resolve("regras/reservas.properties");
        ReservaService servico = new ReservaService(arquivo, RELOGIO);
        Reserva original = servico.criar("golf-gti", "Piloto João", INICIO, 2);
        verificar(original.totalCentavos() == 138000, "Preço calculado pelo catálogo Java");
        verificar(Files.exists(arquivo), "Gravação em arquivo");
        falha(ReservaService.ConflitoException.class, () -> servico.criar("golf-gti", "Outro piloto", INICIO.plusHours(1), 2));
        falha(ReservaService.ConflitoException.class, () -> servico.criar("golf-gti", "Outro piloto", INICIO, 1));
        falha(ReservaService.ConflitoException.class, () -> servico.criar("golf-gti", "Outro piloto", INICIO.minusHours(1), 4));
        verificar(!servico.consultarDisponibilidade("golf-gti", INICIO, 2), "Consulta identifica conflito");
        Reserva vizinha = servico.criar("golf-gti", "Segundo piloto", INICIO.plusHours(2), 1);
        verificar(vizinha.inicio().equals(original.fim()), "Reservas consecutivas são permitidas");
        servico.criar("sandero-rs", "Outro carro", INICIO, 2);
        falha(ReservaService.NaoEncontradaException.class, () -> servico.consultar(original.id(), "errado"));
        falha(ReservaService.NaoEncontradaException.class, () -> servico.cancelar(original.id(), null));
        ReservaService reiniciado = new ReservaService(arquivo, RELOGIO);
        verificar(reiniciado.consultar(original.id(), original.token()).nome().equals("Piloto João"), "Nome Unicode e reserva sobrevivem ao reinício");
        falha(ReservaService.ConflitoException.class, () -> reiniciado.criar("golf-gti", "Outro", INICIO, 2));
        verificar(reiniciado.cancelar(original.id(), original.token()).cancelada(), "Cancelamento persistido");
        verificar(reiniciado.cancelar(original.id(), original.token()).cancelada(), "Cancelamento idempotente");
        ReservaService novamente = new ReservaService(arquivo, RELOGIO);
        verificar(novamente.consultar(original.id(), original.token()).cancelada(), "Cancelamento sobrevive ao reinício");
        verificar(novamente.consultarDisponibilidade("golf-gti", INICIO, 2), "Cancelamento libera horário");
        novamente.criar("golf-gti", "Novo piloto", INICIO, 2);
        falha(IllegalArgumentException.class, () -> servico.criar("desconhecido", "Piloto", INICIO, 1));
        falha(IllegalArgumentException.class, () -> servico.criar("golf-gti", "A", INICIO, 1));
        falha(IllegalArgumentException.class, () -> servico.criar("golf-gti", "Nome\ninválido", INICIO, 1));
        falha(IllegalArgumentException.class, () -> servico.criar("golf-gti", "Piloto", INICIO, 0));
        falha(IllegalArgumentException.class, () -> servico.criar("golf-gti", "Piloto", INICIO, 5));
        falha(IllegalArgumentException.class, () -> servico.criar("golf-gti", "Piloto", INICIO.minusDays(2), 1));
        falha(IllegalArgumentException.class, () -> servico.criar("golf-gti", "Piloto", INICIO.withHour(17), 2));
        falha(IllegalArgumentException.class, () -> servico.criar("golf-gti", "Piloto", INICIO.withMinute(30), 1));
        Path corrompido = temporario.resolve("corrompido.properties");
        Files.writeString(corrompido, "quantidade=1\n");
        falha(IOException.class, () -> new ReservaService(corrompido, RELOGIO));
        verificar(Files.readString(corrompido).equals("quantidade=1\n"), "Arquivo inválido não é sobrescrito");
        verificar(Json.texto("\"\\\n").equals("\"\\\"\\\\\\n\""), "Escape de caracteres JSON");
        System.out.println("PASSOU: regras, cancelamento e persistência após reinício.");
    }

    private static void concorrencia(Path temporario) throws Exception {
        ReservaService servico = new ReservaService(temporario.resolve("concorrencia/reservas.properties"), RELOGIO);
        CountDownLatch largada = new CountDownLatch(1);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            Callable<Boolean> tentativa = () -> {
                largada.await();
                try { servico.criar("gr-yaris", "Piloto", INICIO, 2); return true; }
                catch (ReservaService.ConflitoException e) { return false; }
            };
            Future<Boolean> a = executor.submit(tentativa), b = executor.submit(tentativa);
            largada.countDown();
            verificar(a.get() != b.get(), "Exatamente uma reserva simultânea é aceita");
        }
        System.out.println("PASSOU: prevenção de reserva duplicada concorrente.");
    }

    private static void falhaDeGravacao(Path temporario) throws Exception {
        Path diretorio = temporario.resolve("falha");
        Files.writeString(diretorio, "impede a criação do diretório");
        ReservaService servico = new ReservaService(diretorio.resolve("reservas.properties"), RELOGIO);
        falha(IOException.class, () -> servico.criar("gr-yaris", "Piloto", INICIO, 1));
        verificar(servico.consultarDisponibilidade("gr-yaris", INICIO, 1), "Falha ao gravar não ocupa o horário em memória");
        Files.delete(diretorio);
        servico.criar("gr-yaris", "Piloto", INICIO, 1);
        verificar(Files.exists(diretorio.resolve("reservas.properties")), "Grava após recuperar o armazenamento");
    }

    private static void apiEArquivos(Path temporario) throws Exception {
        Path dados = temporario.resolve("http");
        HttpServer servidor = App.iniciar(Path.of(""), dados, 0, RELOGIO);
        try {
            String base = "http://127.0.0.1:" + servidor.getAddress().getPort();
            HttpClient cliente = HttpClient.newHttpClient();
            for (String caminho : List.of("/", "/carros/golf-gti.html", "/carros/porsche-gt4-rs.html", "/carros/sandero-rs.html", "/carros/gr-yaris.html", "/app.js", "/style.css", "/assets/logo.svg", "/assets/gr-yaris.png", "/assets/fonts/DMSans.ttf")) {
                verificar(requisicao(cliente, base, caminho, "GET", null, null).statusCode() == 200, "Arquivo público " + caminho);
            }
            for (String caminho : List.of("/.git/config", "/README.md", "/src/main/java/br/com/rancing/App.java", "/data/reservas.properties", "/assets/..%2fREADME.md", "/ausente")) {
                verificar(requisicao(cliente, base, caminho, "GET", null, null).statusCode() == 404, "Arquivo privado bloqueado " + caminho);
            }
            var carros = requisicao(cliente, base, "/api/carros", "GET", null, null);
            verificar(carros.statusCode() == 200 && carros.body().contains("\"price\":690"), "Catálogo Java na API");
            String form = "car=golf-gti&name=" + URLEncoder.encode("Piloto João", StandardCharsets.UTF_8)
                + "&date=2030-01-02&time=09%3A00&hours=2&accepted=true&total=1";
            var criada = requisicao(cliente, base, "/api/reservas", "POST", form, null);
            verificar(criada.statusCode() == 201 && criada.body().contains("\"total\":1380.00"), "HTTP cria reserva e ignora total adulterado");
            String id = campoJson(criada.body(), "id"), token = campoJson(criada.body(), "token");
            verificar(requisicao(cliente, base, "/api/reservas", "POST", form, null).statusCode() == 409, "HTTP rejeita conflito");
            verificar(requisicao(cliente, base, "/api/reservas/" + id, "GET", null, null).statusCode() == 404, "HTTP exige chave para consultar");
            verificar(requisicao(cliente, base, "/api/reservas/" + id, "DELETE", null, "errada").statusCode() == 404, "HTTP exige chave para cancelar");
            var consultada = requisicao(cliente, base, "/api/reservas/" + id, "GET", null, token);
            verificar(consultada.statusCode() == 200 && !consultada.body().contains("token"), "Consulta autorizada sem divulgar chave");
            var ocupado = requisicao(cliente, base, "/api/disponibilidade?car=golf-gti&date=2030-01-02&time=10%3A00&hours=1", "GET", null, null);
            verificar(ocupado.body().contains("\"available\":false"), "HTTP consulta disponibilidade");
            verificar(requisicao(cliente, base, "/api/reservas/" + id, "DELETE", null, token).body().contains("\"cancelled\":true"), "HTTP cancela reserva");
            verificar(requisicao(cliente, base, "/api/reservas", "POST", form, null).statusCode() == 201, "HTTP permite reservar após cancelamento");
            verificar(requisicao(cliente, base, "/api/reservas", "POST", form.replace("accepted=true", "accepted=false"), null).statusCode() == 400, "HTTP valida ciência das condições");
            verificar(requisicao(cliente, base, "/api/reservas", "POST", form.replace("hours=2", "hours=99"), null).statusCode() == 400, "HTTP valida duração");
            verificar(requisicao(cliente, base, "/api/reservas", "POST", form.replace("2030-01-02", "2000-01-01"), null).statusCode() == 400, "HTTP rejeita passado");
            verificar(requisicao(cliente, base, "/api/reservas", "POST", form + "&hours=1", null).statusCode() == 400, "HTTP rejeita campos duplicados");
            verificar(requisicao(cliente, base, "/api/reservas", "GET", null, null).statusCode() == 405, "Não lista dados de todos os clientes");
            verificar(requisicao(cliente, base, "/api/carros", "POST", "", null).statusCode() == 405, "HTTP restringe métodos");
            var invalida = cliente.send(HttpRequest.newBuilder(URI.create(base + "/api/reservas")).header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString("{}")).build(), HttpResponse.BodyHandlers.ofString());
            verificar(invalida.statusCode() == 415, "HTTP rejeita formato incorreto");
            var grande = requisicao(cliente, base, "/api/reservas", "POST", "name=" + "a".repeat(9000), null);
            verificar(grande.statusCode() == 413, "HTTP limita o tamanho do formulário");
            System.out.println("PASSOU: API HTTP, preço no servidor, acesso e arquivos públicos.");
        } finally { servidor.stop(0); }
    }

    private static HttpResponse<String> requisicao(HttpClient cliente, String base, String caminho,
            String metodo, String corpo, String token) throws Exception {
        var pedido = HttpRequest.newBuilder(URI.create(base + caminho));
        if (token != null) pedido.header("Authorization", "Bearer " + token);
        if (corpo != null) pedido.header("Content-Type", "application/x-www-form-urlencoded");
        pedido.method(metodo, corpo == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(corpo));
        return cliente.send(pedido.build(), HttpResponse.BodyHandlers.ofString());
    }

    private static String campoJson(String texto, String campo) {
        var resultado = Pattern.compile("\"" + campo + "\":\"([^\"]+)\"").matcher(texto);
        if (!resultado.find()) throw new AssertionError("Campo JSON ausente: " + campo);
        return resultado.group(1);
    }
    private static void verificar(boolean condicao, String mensagem) {
        if (!condicao) throw new AssertionError(mensagem);
        verificacoes++;
    }
    private static void falha(Class<? extends Exception> tipo, Operacao operacao) throws Exception {
        try { operacao.executar(); }
        catch (Exception e) { verificar(tipo.isInstance(e), "Esperado " + tipo.getSimpleName() + ", recebido " + e); return; }
        throw new AssertionError("Esperava falha: " + tipo.getSimpleName());
    }
    @FunctionalInterface private interface Operacao { void executar() throws Exception; }
}
