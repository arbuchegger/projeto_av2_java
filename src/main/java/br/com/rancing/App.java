package br.com.rancing;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.BindException;
import java.awt.Desktop;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/** Servidor HTTP do próprio JDK: site e API executados pelo Java. */
public final class App {
    private static final Map<String, String> TIPOS = Map.of(
        "html", "text/html; charset=utf-8", "js", "text/javascript; charset=utf-8",
        "css", "text/css; charset=utf-8", "svg", "image/svg+xml", "png", "image/png",
        "ttf", "font/ttf", "txt", "text/plain; charset=utf-8");

    public static void main(String[] args) throws Exception {
        Path origem = Path.of(App.class.getProtectionDomain().getCodeSource().getLocation().toURI());
        boolean empacotado = Files.isRegularFile(origem) && origem.toString().endsWith(".jar");
        Path raiz = empacotado ? origem.getParent() : Path.of("").toAbsolutePath();
        Path dados = Path.of(System.getenv().getOrDefault("DATA_DIR", raiz.resolve("data").toString()));
        int porta = Integer.parseInt(System.getenv().getOrDefault("PORT", "3000"));
        boolean abrir = (empacotado || Arrays.asList(args).contains("--abrir"))
            && !Arrays.asList(args).contains("--sem-navegador");
        if (abrir && porta != 0 && jaEstaExecutando(porta)) {
            abrirNavegador(porta);
            return;
        }
        try {
            HttpServer servidor = iniciar(raiz, dados, porta, Clock.system(ReservaService.FUSO), empacotado);
            int portaReal = servidor.getAddress().getPort();
            System.out.println("RANCING EXPERIENCE em Java: http://localhost:" + portaReal);
            System.out.println("Mantenha esta janela aberta enquanto usa o site. Ctrl+C encerra.");
            if (abrir) abrirNavegador(portaReal);
        } catch (BindException e) {
            System.err.println("A porta " + porta + " está ocupada. Encerre a versão antiga do site e tente novamente.");
            throw e;
        }
    }

    private static boolean jaEstaExecutando(int porta) {
        try {
            var conexao = URI.create("http://127.0.0.1:" + porta + "/api/status").toURL().openConnection();
            conexao.setConnectTimeout(700);
            conexao.setReadTimeout(700);
            try (var entrada = conexao.getInputStream()) {
                return new String(entrada.readNBytes(1024), StandardCharsets.UTF_8)
                    .equals("{\"application\":\"rancing-experience\"}");
            }
        } catch (IOException e) { return false; }
    }

    private static void abrirNavegador(int porta) {
        System.out.println("Abra no navegador: http://localhost:" + porta);
        try {
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(URI.create("http://localhost:" + porta));
            }
        } catch (Exception e) {
            System.out.println("Não foi possível abrir o navegador automaticamente. Use o endereço acima.");
        }
    }

    static HttpServer iniciar(Path raiz, Path dados, int porta, Clock relogio) throws IOException {
        return iniciar(raiz, dados, porta, relogio, false);
    }

    private static HttpServer iniciar(Path raiz, Path dados, int porta, Clock relogio, boolean empacotado) throws IOException {
        ReservaService reservas = new ReservaService(dados.resolve("reservas.properties"), relogio);
        HttpServer servidor = HttpServer.create(new InetSocketAddress("0.0.0.0", porta), 0);
        servidor.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        servidor.createContext("/", troca -> {
            try {
                troca.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
                String caminho = troca.getRequestURI().getPath();
                if (caminho.startsWith("/api/")) api(troca, caminho, reservas);
                else estatico(troca, raiz.toAbsolutePath().normalize(), caminho, empacotado);
            } catch (ReservaService.ConflitoException e) {
                erro(troca, 409, e.getMessage());
            } catch (ReservaService.NaoEncontradaException e) {
                erro(troca, 404, e.getMessage());
            } catch (IllegalArgumentException | DateTimeException e) {
                erro(troca, 400, "Dados inválidos. " + e.getMessage());
            } catch (IOException e) {
                System.err.println("Falha de entrada/saída: " + e.getClass().getSimpleName());
                erro(troca, 500, "Não foi possível concluir a operação. Tente novamente.");
            } finally {
                troca.close();
            }
        });
        servidor.start();
        return servidor;
    }

    private static void api(HttpExchange troca, String caminho, ReservaService reservas) throws IOException {
        troca.getResponseHeaders().set("Cache-Control", "no-store");
        String metodo = troca.getRequestMethod();
        if (caminho.equals("/api/status")) {
            if (!metodo.equals("GET")) { metodoInvalido(troca, "GET"); return; }
            json(troca, 200, "{\"application\":\"rancing-experience\"}");
        } else if (caminho.equals("/api/carros")) {
            if (!metodo.equals("GET")) { metodoInvalido(troca, "GET"); return; }
            json(troca, 200, Carro.FROTA.stream().map(Json::carro).collect(Collectors.joining(",", "[", "]")));
        } else if (caminho.equals("/api/disponibilidade")) {
            if (!metodo.equals("GET")) { metodoInvalido(troca, "GET"); return; }
            Map<String, String> campos = campos(troca.getRequestURI().getRawQuery());
            LocalDateTime inicio = inicio(campos);
            int horas = inteiro(campos, "hours");
            Carro carro = Carro.buscar(campos.get("car"));
            boolean livre = reservas.consultarDisponibilidade(carro.id(), inicio, horas);
            json(troca, 200, "{\"available\":" + livre + ",\"total\":"
                + java.math.BigDecimal.valueOf((long) carro.precoHoraCentavos() * horas, 2) + "}");
        } else if (caminho.equals("/api/reservas")) {
            if (!metodo.equals("POST")) { metodoInvalido(troca, "POST"); return; }
            String tipo = troca.getRequestHeaders().getFirst("Content-Type");
            if (tipo == null || !tipo.split(";", 2)[0].strip().equals("application/x-www-form-urlencoded")) {
                erro(troca, 415, "Envie os campos como application/x-www-form-urlencoded."); return;
            }
            byte[] corpo = troca.getRequestBody().readNBytes(8193);
            if (corpo.length > 8192) { erro(troca, 413, "Formulário muito grande."); return; }
            Map<String, String> campos = campos(new String(corpo, StandardCharsets.UTF_8));
            if (!"true".equals(campos.get("accepted"))) {
                throw new IllegalArgumentException("Confirme que compreendeu as condições do projeto.");
            }
            Reserva reserva = reservas.criar(campos.get("car"), campos.get("name"), inicio(campos), inteiro(campos, "hours"));
            json(troca, 201, Json.reserva(reserva, true));
        } else if (caminho.matches("/api/reservas/[a-f0-9-]{36}")) {
            String id = caminho.substring("/api/reservas/".length());
            String autorizacao = troca.getRequestHeaders().getFirst("Authorization");
            String token = autorizacao != null && autorizacao.startsWith("Bearer ") ? autorizacao.substring(7) : null;
            if (metodo.equals("GET")) json(troca, 200, Json.reserva(reservas.consultar(id, token), false));
            else if (metodo.equals("DELETE")) json(troca, 200, Json.reserva(reservas.cancelar(id, token), false));
            else metodoInvalido(troca, "GET, DELETE");
        } else erro(troca, 404, "Endereço de API não encontrado.");
    }

    private static LocalDateTime inicio(Map<String, String> campos) {
        String data = campos.get("date"), hora = campos.get("time");
        if (data == null || hora == null) throw new IllegalArgumentException("Informe data e horário.");
        return LocalDateTime.of(LocalDate.parse(data), LocalTime.parse(hora));
    }

    private static int inteiro(Map<String, String> campos, String nome) {
        try { return Integer.parseInt(campos.get(nome)); }
        catch (NumberFormatException e) { throw new IllegalArgumentException("Duração inválida."); }
    }

    private static Map<String, String> campos(String texto) {
        Map<String, String> valores = new HashMap<>();
        if (texto == null || texto.isBlank()) return valores;
        for (String parte : texto.split("&")) {
            String[] par = parte.split("=", 2);
            String chave = URLDecoder.decode(par[0], StandardCharsets.UTF_8);
            String valor = par.length == 2 ? URLDecoder.decode(par[1], StandardCharsets.UTF_8) : "";
            if (valores.put(chave, valor) != null) throw new IllegalArgumentException("Campo repetido.");
        }
        return valores;
    }

    private static void estatico(HttpExchange troca, Path raiz, String caminho, boolean empacotado) throws IOException {
        if (!troca.getRequestMethod().equals("GET")) { metodoInvalido(troca, "GET"); return; }
        String rota = caminho.equals("/") ? "/index.html" : caminho;
        Path arquivo = raiz.resolve("." + rota).normalize();
        boolean publico = List.of("/index.html", "/app.js", "/style.css").contains(rota)
            || (rota.startsWith("/assets/") && arquivo.startsWith(raiz.resolve("assets")))
            || rota.matches("/carros/[a-z0-9-]+\\.html");
        if (publico && arquivo.startsWith(raiz) && !Arrays.asList(rota.split("/")).contains("..")) {
            String nome = arquivo.getFileName().toString();
            String extensao = nome.substring(nome.lastIndexOf('.') + 1);
            String tipo = TIPOS.getOrDefault(extensao, "application/octet-stream");
            if (empacotado) {
                // Todas as páginas, imagens e fontes estão dentro do JAR.
                try (var entrada = App.class.getResourceAsStream(rota)) {
                    if (entrada != null) { responder(troca, 200, tipo, entrada.readAllBytes()); return; }
                }
            } else if (Files.isRegularFile(arquivo) && arquivo.toRealPath().startsWith(raiz.toRealPath())) {
                responder(troca, 200, tipo, Files.readAllBytes(arquivo));
                return;
            }
        }
        responder(troca, 404, "text/html; charset=utf-8",
            "<!doctype html><html lang=\"pt-BR\"><meta charset=\"UTF-8\"><title>Página não encontrada</title><h1>Página não encontrada</h1><p>Abra o site pelo RancingExperience.jar para carregar todas as páginas.</p><a href=\"/\">Voltar ao início</a></html>".getBytes(StandardCharsets.UTF_8));
    }

    private static void metodoInvalido(HttpExchange troca, String permitidos) throws IOException {
        troca.getResponseHeaders().set("Allow", permitidos);
        erro(troca, 405, "Método não permitido.");
    }
    private static void erro(HttpExchange troca, int status, String mensagem) throws IOException {
        json(troca, status, "{\"error\":" + Json.texto(mensagem) + "}");
    }
    private static void json(HttpExchange troca, int status, String corpo) throws IOException {
        responder(troca, status, "application/json; charset=utf-8", corpo.getBytes(StandardCharsets.UTF_8));
    }
    private static void responder(HttpExchange troca, int status, String tipo, byte[] corpo) throws IOException {
        troca.getResponseHeaders().set("Content-Type", tipo);
        troca.sendResponseHeaders(status, corpo.length);
        troca.getResponseBody().write(corpo);
    }
}
