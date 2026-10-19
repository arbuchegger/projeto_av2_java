# RANCING EXPERIENCE

Site de experiências de pilotagem com carros esportivos, idealizado para o Autódromo Internacional da Paraíba (PB). A comunicação convida o visitante a sair da arquibancada e imaginar sua própria história na pista.

## Executar

Requer Node.js 18 ou superior. Não há dependências de produção, banco de dados, credenciais ou instalação obrigatória para iniciar o site. Playwright é uma dependência de desenvolvimento para testes opcionais de navegador.

```sh
cd /workspace/projeto_av2_java
npm start
```

O servidor usa a porta `3000` e aceita `PORT` para sobrescrevê-la. Para verificar as rotas e os arquivos públicos:

```sh
npm test
```

Os testes de navegador são opcionais e usam Playwright. Para executá-los:

```sh
npm ci
# Se Chromium não estiver instalado em /usr/bin/chromium:
npx playwright install chromium
npm run test:e2e
```

A suíte cobre filtros, quatro páginas, carregamento de imagens, preços, salvar/reabrir/editar/excluir a simulação, rejeição de data passada, consentimento, menu móvel, FAQ e navegação de foco no modal.

As páginas também podem ser servidas em qualquer hospedagem estática na raiz de um domínio. Os caminhos de arquivos e navegação são absolutos a partir dessa raiz. O servidor incluído expõe apenas os arquivos públicos necessários.

## Experiência e identidade

Nome solicitado: **RANCING EXPERIENCE**. A grafia foi mantida conforme o briefing. A logo original combina traços de velocidade com uma assinatura tipográfica; está em `assets/logo.svg`, acompanhada por um favicon. A identidade usa preto, branco quente e laranja, com títulos condensados e composição inspirada em automobilismo.

A página inicial reúne apresentação emocional, catálogo com filtros, vantagens, etapas da experiência, perguntas frequentes e chamadas para simular. O desenho é responsivo, com menu móvel, navegação por teclado, estados de foco, modal com contenção de foco e suporte a movimento reduzido.

## Frota proposta

| Carro / página | Versão de referência | Potência | 0–100 km/h | Valor demonstrativo por hora |
|---|---|---|---|---|
| [Golf GTI](carros/golf-gti.html) | Mk7 2.0 TSI, DSG de 6 marchas | 220 cv | 6,5 s | R$ 690 |
| [Porsche GT4 RS](carros/porsche-gt4-rs.html) | 718 Cayman GT4 RS, PDK de 7 marchas | 500 cv | 3,4 s | R$ 2.490 |
| [Sandero RS](carros/sandero-rs.html) | 2.0 flex, manual de 6 marchas | 150 cv com etanol | 8,0 s | R$ 390 |
| [GR Yaris](carros/gr-yaris.html) | Versão original, manual de 6 marchas, GR-FOUR | 261 cv | 5,5 s | R$ 1.190 |

Os números descrevem versões de referência, sem comprovar a existência de frota ou a configuração de um veículo disponível. Mercado, ano, combustível e condições alteram os resultados. Antes da operação comercial, validar os dados com a ficha do veículo específico e as informações das fabricantes Volkswagen, Porsche, Renault Sport e Toyota Gazoo Racing. Os preços foram criados para demonstrar o produto e precisam de aprovação comercial.

## Funcionalidades

- Catálogo filtrável por câmbio manual, hot hatch e superesportivo.
- Página exclusiva para cada veículo, com descrição, motor, transmissão, aceleração e preço.
- Controle de duração de 1 a 4 horas, com total atualizado em tempo real.
- Modal para escolher carro, data e duração. Bloqueia datas passadas e exige ciência de que se trata de uma simulação.
- Simulação persistida em `localStorage`, com consulta em “Minha simulação”, edição e exclusão.
- Resumo calculado a partir do veículo e duração selecionados, inclusive depois de reabrir o navegador.
- FAQ expansível e menu móvel.

A simulação é local: **não confirma reserva, não envia dados, não consulta disponibilidade e não cobra valores**. Nenhum dado pessoal é solicitado. O site deixa essas condições visíveis. Para uma operação real, implementar backend de disponibilidade, atendimento, contratos, pagamento e regras de elegibilidade, além de formalizar autorização de uso da pista e condições de segurança, seguro, briefing e acompanhamento. Nada disso é apresentado como uma oferta confirmada neste projeto.

## Arquivos

- `index.html`: entrada da página inicial.
- `carros/*.html`: quatro endereços individuais com títulos próprios.
- `app.js`: conteúdo, catálogo, interações e persistência local.
- `style.css`: identidade, componentes e adaptações para celular.
- `assets/`: logo, favicon, ilustrações locais e imagem principal.
- `server.js`: servidor HTTP sem dependências.
- `tests/site.test.js`: verificações HTTP e proteção de arquivos privados.

As imagens dos quatro carros e a imagem principal foram geradas por IA para ilustrar a proposta. Não são fotografias do autódromo ou de carros disponíveis de uma frota. As ilustrações vetoriais iniciais também estão em `assets/`, como material de identidade alternativo. Os arquivos visuais são locais. As fontes Barlow Condensed e DM Sans são distribuídas localmente, com suas licenças SIL Open Font License em `assets/fonts/`. O site não precisa acessar serviços externos para carregar fontes ou imagens.

## Critérios de aceite

A página inicial e as quatro páginas de carros devem abrir; filtros devem exibir os grupos corretos; duração e troca de carro devem recalcular o preço; uma simulação válida deve poder ser salva, reaberta, editada e excluída; datas passadas devem ser rejeitadas; o menu deve funcionar em celular e o modal deve fechar com Escape. Não deve haver rolagem horizontal em telas de celular.

Projeto demonstrativo independente, sem vínculo oficial com marcas ou autódromo. O repositório começou apenas com `LICENSE`; esta implementação usa HTML, CSS e JavaScript, sem introduzir uma aplicação Java sem necessidade.

## Validação realizada

- `npm test`: 3 testes HTTP aprovados.
- `npm run test:e2e`: 4 testes de navegador aprovados em Chromium.
- Layout inspecionado em 1440 px e 390 px, com imagens e fontes locais.
- A validação cobre o site demonstrativo; não comprova contratação, disponibilidade ou pagamento reais.
