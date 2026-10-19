package br.com.rancing;

import java.util.List;

/** Catálogo e preços oficiais do projeto, em centavos para evitar arredondamentos. */
public record Carro(String id, String nome, int precoHoraCentavos, int potencia,
                    String zeroACem, String cambio, String motor) {
    public static final List<Carro> FROTA = List.of(
        new Carro("golf-gti", "Golf GTI", 69000, 220, "6,5", "DSG · 6 marchas", "2.0 TSI turbo"),
        new Carro("porsche-gt4-rs", "Porsche GT4 RS", 249000, 500, "3,4", "PDK · 7 marchas", "4.0 boxer aspirado"),
        new Carro("sandero-rs", "Sandero RS", 39000, 150, "8,0", "Manual · 6 marchas", "2.0 aspirado flex"),
        new Carro("gr-yaris", "GR Yaris", 119000, 261, "5,5", "Manual · 6 marchas", "1.6 turbo · GR-FOUR")
    );

    public static Carro buscar(String id) {
        return FROTA.stream().filter(c -> c.id.equals(id)).findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Carro inválido."));
    }
}
