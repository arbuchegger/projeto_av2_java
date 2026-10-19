# RANCING EXPERIENCE — Java

Site de aluguel de carros de pista idealizado para o Autódromo Internacional da Paraíba. O visual esportivo original foi mantido, e agora **o Java serve o site, disponibiliza o catálogo e registra as reservas**.

A implementação usa apenas **Java 21**, sem Spring, Maven, banco de dados separado ou bibliotecas externas no servidor. É uma versão simples para estudar e apresentar: os dados são gravados em arquivo, e as regras ficam em classes Java pequenas.

## Como abrir

Instale o **JDK 21 ou superior** (o JRE sozinho não inclui o compilador). Abra um terminal na pasta do projeto.

**Windows (PowerShell):**

```powershell
.\run.bat
```

**Linux ou macOS:**

```sh
bash run.sh
```

Depois, digite `http://localhost:3000` no navegador. Mantenha o terminal aberto; `Ctrl+C` encerra o servidor.

Se já tiver Node.js, o comando anterior continua disponível em qualquer sistema:

```sh
npm start
```

Ele apenas compila e inicia o Java. **Node.js não é necessário ao usar run.sh ou run.bat.** Os scripts compilam os fontes com `javac` para `build/classes` e executam `br.com.rancing.App`. No ambiente da nuvem, `run.sh` também reconhece o JDK já instalado em `/workspace/.cloud-java/jdk`.

Para executar sem scripts, a partir da pasta raiz:

```sh
mkdir -p build/classes
javac --release 21 -encoding UTF-8 -d build/classes src/main/java/br/com/rancing/*.java
java -cp build/classes br.com.rancing.App
```

A porta padrão é `3000`. É possível configurar `PORT` e `DATA_DIR` antes de iniciar. Exemplo no Linux/macOS: `PORT=8080 DATA_DIR=meus-dados bash run.sh`. No PowerShell: `$env:PORT="8080"; .\run.bat`.

Se aparecer “Address already in use”, encerre a versão antiga que ocupa a porta ou escolha outra porta.

## O que funciona

1. O visitante consulta os quatro carros, suas descrições, preço por hora e aceleração.
2. Escolhe carro, nome, data, hora de início e duração.
3. Pode consultar a disponibilidade antes de enviar.
4. O Java valida os dados, verifica conflitos, calcula o total pelo catálogo e grava a reserva.
5. O site exibe o código da reserva e o valor calculado pelo servidor.
6. Em **Minhas reservas**, o visitante consulta seus registros e pode cancelá-los. O cancelamento libera o horário.

O horário do projeto é **08h às 18h, no fuso America/Sao_Paulo (Brasília)**, com início em horas inteiras e duração de **1 a 4 horas**. Inícios no passado e períodos que ultrapassam 18h são rejeitados também pela API.

O mesmo carro não pode ter reservas sobrepostas. Reservas consecutivas (por exemplo, 09h–10h e 10h–11h) e carros diferentes no mesmo horário são permitidos. A verificação e a gravação são sincronizadas, para impedir que duas solicitações simultâneas ocupem o mesmo período na mesma instância.

O formulário não tem edição de reservas nesta versão: basta cancelar e criar uma nova.

## Persistência e acesso

As reservas e os nomes são gravados em `data/reservas.properties`, fora dos arquivos públicos. Valores monetários são armazenados em **centavos**. A gravação usa um arquivo temporário e substituição atômica; a memória só é atualizada após salvar. Se um arquivo existente estiver inválido, o servidor interrompe a inicialização em vez de apagá-lo silenciosamente.

As reservas sobrevivem ao reinício do Java. **Não apague a pasta data/**; faça backup dela com o servidor parado. `DATA_DIR` permite usar outro diretório persistente. Execute **uma única instância por diretório de dados**: esta solução em arquivo não coordena vários servidores. Para uma operação maior, substituir a persistência por banco de dados é o próximo passo.

Cada reserva recebe um identificador e uma chave aleatória. O navegador guarda apenas essas referências em `localStorage`; nome, período, status e total são consultados no Java. Consultas e cancelamentos exigem a chave em `Authorization: Bearer ...`. Não existe uma API pública que liste as reservas de todos os clientes.

Sem cadastro/login nesta versão, **limpar o armazenamento ou mudar de navegador remove o acesso às reservas daquele navegador**, mas não apaga os registros do servidor. Não compartilhe as chaves. As simulações antigas, que ficavam apenas no navegador, não são convertidas automaticamente em reservas.

## Organização Java

Todos os fontes ficam em `src/main/java/br/com/rancing/`:

| Classe | Responsabilidade |
|---|---|
| `App` | Inicia o servidor HTTP do JDK, serve páginas e atende as rotas da API. |
| `Carro` | Define a frota, especificações e preços. É a fonte dos dados técnicos e preços exibidos pelo site. |
| `Reserva` | Representa uma reserva, com cliente, período, valor e situação. |
| `ReservaService` | Valida horários, impede sobreposição, consulta, cancela e persiste os registros. |
| `Json` | Gera as respostas JSON com escape de caracteres, sem dependências. |

O nome do cliente fica diretamente em `Reserva`, sem uma classe de cadastro separada, para manter o escopo pequeno. `Carro` e `Reserva` usam `record`, recurso de Java para representar dados imutáveis. O serviço recebe um `Clock`, permitindo testar datas sem depender do horário real.

O frontend continua em `index.html`, `carros/*.html`, `app.js`, `style.css` e `assets/`. Ele carrega o catálogo de `/api/carros` antes de montar as páginas. O antigo servidor `server.js` foi removido.

## API

| Método e rota | Finalidade |
|---|---|
| `GET /api/carros` | Consultar frota e preços. |
| `GET /api/disponibilidade?car=golf-gti&date=2030-01-02&time=09:00&hours=2` | Verificar período e calcular total. Use uma data futura. |
| `POST /api/reservas` | Criar reserva. |
| `GET /api/reservas/{id}` | Consultar reserva com chave de acesso. |
| `DELETE /api/reservas/{id}` | Cancelar reserva com chave de acesso. |

A criação recebe `application/x-www-form-urlencoded`, que o formulário envia usando `URLSearchParams`:

```text
car=golf-gti&name=Piloto&date=2030-01-02&time=09%3A00&hours=2&accepted=true
```

A resposta de criação inclui `id`, `token`, `car`, `name`, `date`, `time`, `hours`, `total` e `cancelled`. Guarde `id` e `token`; as respostas de consulta não repetem a chave. Campos de preço enviados pelo cliente são ignorados: o servidor usa o preço de `Carro`.

Principais códigos HTTP: `201` criada, `200` consulta/cancelamento, `400` dados inválidos, `404` reserva/chave ou endereço inválido, `409` conflito, `405` método indevido, `413` formulário muito grande, `415` formato indevido e `500` falha de armazenamento. A disponibilidade consultada é informativa: a criação sempre verifica novamente o período.

## Testes

Os testes Java não precisam instalar nenhuma biblioteca:

```sh
bash test.sh
```

No Windows: `.\test.bat`. Com Node instalado, também é possível usar `npm test`.

`ReservasTest.java` faz **63 verificações** de preço calculado no servidor, horários, sobreposições, limites consecutivos, cancelamento, autorização, persistência após reabrir o arquivo, erro de gravação, corrupção de dados, concorrência e requisições HTTP reais. Os dados são temporários, sem alterar `data/`.

Os testes de navegador são opcionais, com Node.js e Playwright:

```sh
npm ci
# Quando não houver Chromium em /usr/bin/chromium:
npx playwright install chromium
npm run test:e2e
```

São **6 testes de navegador**: catálogo e páginas; criação/consulta/cancelamento; conflito entre dois visitantes; validação do formulário; celular e foco por teclado; e erro de conexão sem falsa confirmação. O Playwright inicia seu próprio servidor **Java** na porta `3108`, com dados isolados em `.e2e-data/`. Essa pasta é apagada antes da suíte; nunca coloque reservas reais nela.

Os scripts `.bat` são fornecidos para Windows; nesta implementação, a execução foi validada no Linux com JDK 21 e Chromium.

## Frota e identidade

| Carro | Versão de referência | Potência | 0–100 km/h | Preço/hora do projeto |
|---|---|---|---|---|
| Golf GTI | Mk7 2.0 TSI, DSG 6 marchas | 220 cv | 6,5 s | R$ 690 |
| Porsche GT4 RS | 718 Cayman GT4 RS, PDK 7 marchas | 500 cv | 3,4 s | R$ 2.490 |
| Sandero RS | 2.0 flex, manual 6 marchas | 150 cv com etanol | 8,0 s | R$ 390 |
| GR Yaris | Versão original, manual 6 marchas, GR-FOUR | 261 cv | 5,5 s | R$ 1.190 |

Para alterar preços ou especificações, edite `Carro.java` e reinicie o servidor. O valor de uma reserva já registrada permanece o valor contratado no projeto, mesmo que o catálogo mude depois.

A marca **RANCING EXPERIENCE** mantém a grafia solicitada, logo original e identidade preta, branca e laranja. O site preserva filtros, seção de vantagens, FAQ e layout responsivo. Imagens dos carros e da capa são ilustrativas, geradas por IA; não são fotos de uma frota ou do autódromo. Logo, favicon, imagens e fontes são locais. As fontes Barlow Condensed e DM Sans incluem licenças SIL em `assets/fonts/`.

## Limites do projeto

O sistema **registra reservas funcionais dentro do projeto**, sem pagamento, emissão de contrato ou contratação de uma experiência real. Os preços são demonstrativos; não há vínculo oficial com marcas ou autódromo. Uma operação comercial exigiria autorização do local, condições de segurança e seguro, atendimento, autenticação com recuperação de conta, infraestrutura HTTPS e pagamento.

Agora o site depende do servidor Java: **GitHub Pages ou abrir index.html diretamente não executa o backend**. O GitHub armazena o código; uma publicação online precisa de hospedagem com suporte ao Java e armazenamento persistente para `data/`.
