package br.com.rancing;

import java.time.LocalDateTime;

public record Reserva(String id, String token, String carroId, String nome,
                      LocalDateTime inicio, int horas, long totalCentavos, boolean cancelada) {
    public LocalDateTime fim() {
        return inicio.plusHours(horas);
    }

    public Reserva cancelar() {
        return new Reserva(id, token, carroId, nome, inicio, horas, totalCentavos, true);
    }
}
