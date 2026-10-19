package br.com.rancing;

/** Respostas JSON pequenas, sem biblioteca externa. Não interpreta JSON recebido. */
final class Json {
    private Json() {}

    static String texto(String valor) {
        StringBuilder saida = new StringBuilder("\"");
        for (char c : valor.toCharArray()) {
            switch (c) {
                case '"' -> saida.append("\\\"");
                case '\\' -> saida.append("\\\\");
                case '\n' -> saida.append("\\n");
                case '\r' -> saida.append("\\r");
                case '\t' -> saida.append("\\t");
                default -> {
                    if (c < 32) saida.append(String.format("\\u%04x", (int) c));
                    else saida.append(c);
                }
            }
        }
        return saida.append('"').toString();
    }

    static String carro(Carro c) {
        return "{\"id\":" + texto(c.id()) + ",\"name\":" + texto(c.nome())
            + ",\"price\":" + c.precoHoraCentavos() / 100 + ",\"power\":" + c.potencia()
            + ",\"zero\":" + texto(c.zeroACem()) + ",\"gear\":" + texto(c.cambio())
            + ",\"engine\":" + texto(c.motor()) + "}";
    }

    static String reserva(Reserva r, boolean incluirToken) {
        return "{\"id\":" + texto(r.id()) + ",\"car\":" + texto(r.carroId())
            + ",\"name\":" + texto(r.nome()) + ",\"date\":" + texto(r.inicio().toLocalDate().toString())
            + ",\"time\":" + texto(r.inicio().toLocalTime().toString()) + ",\"hours\":" + r.horas()
            + ",\"total\":" + java.math.BigDecimal.valueOf(r.totalCentavos(), 2).toPlainString()
            + ",\"cancelled\":" + r.cancelada()
            + (incluirToken ? ",\"token\":" + texto(r.token()) : "") + "}";
    }
}
