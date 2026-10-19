package br.com.rancing;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.*;
import java.time.*;
import java.util.*;

/** Regras de negócio e persistência para uma única instância do servidor. */
public final class ReservaService {
    public static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
    private final Path arquivo;
    private final Clock relogio;
    private Map<String, Reserva> reservas;

    public ReservaService(Path arquivo, Clock relogio) throws IOException {
        this.arquivo = arquivo.toAbsolutePath();
        this.relogio = relogio.withZone(FUSO);
        this.reservas = carregar();
    }

    public synchronized Reserva criar(String carroId, String nome, LocalDateTime inicio, int horas)
            throws IOException {
        Carro carro = Carro.buscar(carroId);
        if (nome == null || nome.strip().length() < 2 || nome.strip().length() > 80
                || nome.chars().anyMatch(Character::isISOControl)) {
            throw new IllegalArgumentException("Informe um nome entre 2 e 80 caracteres.");
        }
        validarHorario(inicio, horas);
        if (!disponivel(carroId, inicio, horas)) {
            throw new ConflitoException("Este carro já está reservado nesse período. Escolha outro horário.");
        }
        Reserva reserva = new Reserva(UUID.randomUUID().toString(), UUID.randomUUID().toString(),
            carroId, nome.strip(), inicio, horas, (long) carro.precoHoraCentavos() * horas, false);
        Map<String, Reserva> novas = new LinkedHashMap<>(reservas);
        novas.put(reserva.id(), reserva);
        salvar(novas); // Só altera a memória depois de persistir com sucesso.
        reservas = novas;
        return reserva;
    }

    public synchronized boolean consultarDisponibilidade(String carroId, LocalDateTime inicio, int horas) {
        Carro.buscar(carroId);
        validarHorario(inicio, horas);
        return disponivel(carroId, inicio, horas);
    }

    private boolean disponivel(String carroId, LocalDateTime inicio, int horas) {
        LocalDateTime fim = inicio.plusHours(horas);
        return reservas.values().stream().noneMatch(r -> !r.cancelada() && r.carroId().equals(carroId)
            && inicio.isBefore(r.fim()) && r.inicio().isBefore(fim));
    }

    private void validarHorario(LocalDateTime inicio, int horas) {
        if (horas < 1 || horas > 4) throw new IllegalArgumentException("Escolha de 1 a 4 horas.");
        if (inicio == null || !inicio.isAfter(LocalDateTime.now(relogio))) {
            throw new IllegalArgumentException("Escolha uma data e um horário futuros (horário de Brasília).");
        }
        if (inicio.getMinute() != 0 || inicio.getSecond() != 0 || inicio.getNano() != 0
                || inicio.getHour() < 8 || inicio.getHour() + horas > 18) {
            throw new IllegalArgumentException("As reservas são em horas inteiras, entre 08h e 18h.");
        }
    }

    public synchronized Reserva consultar(String id, String token) {
        Reserva reserva = reservas.get(id);
        // A chave de acesso evita que outros visitantes consultem ou cancelem a reserva.
        if (reserva == null || token == null || !reserva.token().equals(token)) {
            throw new NaoEncontradaException("Reserva não encontrada ou chave de acesso inválida.");
        }
        return reserva;
    }

    public synchronized Reserva cancelar(String id, String token) throws IOException {
        Reserva atual = consultar(id, token);
        if (atual.cancelada()) return atual;
        Reserva cancelada = atual.cancelar();
        Map<String, Reserva> novas = new LinkedHashMap<>(reservas);
        novas.put(id, cancelada);
        salvar(novas);
        reservas = novas;
        return cancelada;
    }

    private Map<String, Reserva> carregar() throws IOException {
        Map<String, Reserva> resultado = new LinkedHashMap<>();
        if (!Files.exists(arquivo)) return resultado;
        Properties dados = new Properties();
        try (InputStream entrada = Files.newInputStream(arquivo)) { dados.load(entrada); }
        try {
            int quantidade = Integer.parseInt(Objects.requireNonNull(dados.getProperty("quantidade")));
            if (quantidade < 0) throw new IllegalArgumentException("Quantidade inválida");
            for (int i = 0; i < quantidade; i++) {
                String prefixo = "reserva." + i + ".";
                Reserva r = new Reserva(obrigatorio(dados, prefixo + "id"), obrigatorio(dados, prefixo + "token"),
                    obrigatorio(dados, prefixo + "carro"), obrigatorio(dados, prefixo + "nome"),
                    LocalDateTime.parse(obrigatorio(dados, prefixo + "inicio")),
                    Integer.parseInt(obrigatorio(dados, prefixo + "horas")),
                    Long.parseLong(obrigatorio(dados, prefixo + "totalCentavos")),
                    Boolean.parseBoolean(obrigatorio(dados, prefixo + "cancelada")));
                Carro.buscar(r.carroId());
                if (resultado.put(r.id(), r) != null) throw new IllegalArgumentException("ID repetido");
            }
        } catch (RuntimeException e) {
            throw new IOException("Arquivo de reservas inválido. Restaure um backup; o arquivo não foi sobrescrito.", e);
        }
        return resultado;
    }

    private static String obrigatorio(Properties p, String chave) {
        return Objects.requireNonNull(p.getProperty(chave), "Campo ausente: " + chave);
    }

    private void salvar(Map<String, Reserva> novas) throws IOException {
        Properties dados = new Properties();
        dados.setProperty("quantidade", Integer.toString(novas.size()));
        int i = 0;
        for (Reserva r : novas.values()) {
            String prefixo = "reserva." + i++ + ".";
            dados.setProperty(prefixo + "id", r.id());
            dados.setProperty(prefixo + "token", r.token());
            dados.setProperty(prefixo + "carro", r.carroId());
            dados.setProperty(prefixo + "nome", r.nome());
            dados.setProperty(prefixo + "inicio", r.inicio().toString());
            dados.setProperty(prefixo + "horas", Integer.toString(r.horas()));
            dados.setProperty(prefixo + "totalCentavos", Long.toString(r.totalCentavos()));
            dados.setProperty(prefixo + "cancelada", Boolean.toString(r.cancelada()));
        }
        Files.createDirectories(arquivo.getParent());
        Path temporario = Files.createTempFile(arquivo.getParent(), "reservas-", ".tmp");
        try {
            try (OutputStream saida = Files.newOutputStream(temporario)) {
                dados.store(saida, "RANCING EXPERIENCE - nao editar enquanto o servidor estiver executando");
            }
            Files.move(temporario, arquivo, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } finally {
            Files.deleteIfExists(temporario);
        }
    }

    public static final class ConflitoException extends RuntimeException {
        public ConflitoException(String mensagem) { super(mensagem); }
    }
    public static final class NaoEncontradaException extends RuntimeException {
        public NaoEncontradaException(String mensagem) { super(mensagem); }
    }
}
