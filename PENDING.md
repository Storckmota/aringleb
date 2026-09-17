# Pendências — decisões que dependem de material externo

Itens que o briefing marca como "não inventar". Nada aqui virou link falso,
copy inventada ou aviso visível de material faltando no site.

## 0a. Original exato da nova fotografia da hero

A imagem solicitada foi identificada visualmente em
`assets/img/alex-story-04.webp`: Alexander sentado, camisa preta, mãos unidas,
diante das prateleiras de discos. Ela foi comparada com o pacote original da
cliente pelos critérios de roupa, pose, cenário e enquadramento; nenhum dos
originais corresponde a esse frame. Os arquivos brutos foram arquivados fora
do repositório de produção após a conversão dos assets utilizados.

A melhor fonte disponível continua sendo o WebP de **1100×1650 px**. Os
derivados `hero-story-1000.webp` (1000×1500) e `hero-story-720.webp`
(720×1080) foram reduzidos a partir dela; nenhum arquivo foi ampliado ou
sharpened artificialmente. Para ganhar qualidade real em telas grandes é
necessário receber o original desse mesmo frame, idealmente com pelo menos
2000 px no lado curto.

## 0b. Vídeos permanentes dos três posts selecionados na Home

O schema `socialPost` do CMS armazena o permalink do Instagram e uma capa
permanente, mas declara explicitamente que o vídeo não é copiado. A consulta e
os assets atuais também não oferecem MP4/WebM permanente. Por isso os três
itens abaixo usam seus posters reais e **não exibem controles falsos**:

1. Miami Marine Stadium — `social-1.jpg`;
2. The ‘luxury’ condo problem — `social-2.jpg`;
3. Miami’s dining squeeze — `social-3.jpg`.

O componente já aceita uma URL controlada pelo projeto em `data-video-src` e
aplica autoplay muted, pausa fora da viewport, áudio exclusivo, fallback e
reduced motion. Para ativá-lo, fornecer um MP4/WebM permanente para cada item
ou adicionar ao documento `socialPost` um campo permanente de arquivo Sanity
(não uma página do Instagram nem uma URL assinada temporária).

## 1. URLs sociais

| Rede | URL | Situação |
|---|---|---|
| Instagram | `https://instagram.com/iamalexander.r` | Confirmada, em uso |
| Twitter | — | **Pendente** |
| Facebook | — | **Pendente** |
| YouTube | — | **Pendente** |

Onde mexer: o sprite `<svg class="svg-sprite">` no topo de cada página define
os quatro símbolos uma única vez; as linhas que os usam ficam no header, em
`#contact` e no footer. Os três sem destino renderizam como `<span
class="social-pending" aria-hidden>`, nunca como link: a linha de quatro
marcas aparece como o PDF pede, sem fingir um clique que não leva a lugar
nenhum. Quando a URL chegar, basta trocar o `<span>` pelo mesmo `<a>` que o
Instagram já usa, nos três lugares.

Símbolo do Twitter: o PDF desenha o **pássaro**, e é o pássaro que está no
site. Uma orientação visual da cliente não vira atualização de marca sem que
ela decida.

## 2. Link do perfil SOBEWFF

`https://sobewff.org/personality/alexander-ringleb/` responde **404** hoje
(o site está no ar e `/personality/` também; o festival trocou os slugs ao
virar de edição). O item continua na página `/press/` com a matéria e a
descrição intactas, mas **sem link** — como Haute Living e Biscayne Times —
em vez de publicar um link morto ou adivinhar um slug novo.

Ação: pedir à cliente a URL atual do perfil e repor o `cta` do item em
`press/index.html`.

## 3. Europa Deli e Vice Lounge (no índice de Cases, sem Case próprio)

As duas casas **estão no índice da seção Cases**, na home: a página 4 do
PDF desenha quatro círculos e são os quatro que a linha mostra —
Burgermeister, The Office Delray, Europa Deli, Vice Lounge.

O que falta não é o lugar delas na composição, é o Case. Burgermeister e
The Office abrem os dois drawers editoriais completos; Europa Deli e Vice
Lounge não abrem painel vazio. Elas são marcadas `.cm-still` no HTML: mesmo
disco, mesmo nome em Gamay Editorial, mesma localização, sem `<a>`, sem
preenchimento no hover, sem ponteiro e sem parada de foco. O estado indisponível
também tem texto para tecnologia assistiva. A linha aparece como o PDF pede,
sem fingir um clique que não leva a lugar nenhum.

A localização de cada uma vem da career strip sob a hero, que já as
publica ("Vice Lounge, Miami", "Europa Deli, Miami Beach", p.1 do PDF).
Nenhum dado foi inventado para preencher o círculo.

Para cada uma virar um Case é preciso receber da cliente/Rick:

1. **logo** em vetor ou PNG de fundo transparente (entra no círculo do
   índice, `.cm-disc`, no lugar do `<span class="cm-word">`);
2. **2 a 3 fotografias** comprovadamente da casa;
3. **texto curto aprovado**, no nível do Burgermeister (3 parágrafos) ou do
   The Office (2);
4. **confirmação da localização** (hoje é a da career strip);
5. **confirmação do papel atual de Alexander** na casa — o site a nomeia
   como parte do histórico, sem afirmar situação atual.

Com esse material, cada uma vira um novo `[data-case-panel]` no mesmo
`[data-case-layer]`; o `<span class="cm-still">` do índice passa a ser um
`<a data-case-open="europa-deli" href="#case=europa-deli">`. O controlador
existente descobre esse par pelos dados e não exige uma cópia de JavaScript.
Os materiais brutos permanecem no arquivo externo do projeto, não no bundle
de produção.

## 3b. Os logos da página 4 do PDF

A página 4 desenha os Cases como círculos de logo ("Posso separar as Logo
dos negócios"). **Não existe nenhum arquivo de logo no repositório nem no
material original arquivado**, para nenhuma das quatro casas.

O índice traz os **quatro** círculos que a página pede. Como não há logo,
cada círculo carrega **o próprio nome do negócio** em Gamay Editorial: um
wordmark que o site pode sustentar. Não há a palavra "LOGO" na interface,
nem símbolo inventado, nem monograma falso, nem círculo vermelho (o
vermelho do PDF é a cor das anotações da cliente, não da marca).

Quando um logo real chegar, a troca é de uma linha por círculo:

```html
<span class="cm-disc"><img src="assets/img/logo-burgermeister.svg" alt="Burgermeister"></span>
```

`.cm-disc img` já está no CSS (`width: 100%`, altura automática), então a
proporção do arquivo é preservada e nada mais precisa mudar.

## 3c. Grafia de "Balthazar" na career strip

A anotação manuscrita da página 1 lista a casa como **"Baltazar, New York"**.
O mockup impresso na mesma página — a peça que a anotação comenta — escreve
**"BALTHAZAR, NEW YORK"**, e o parágrafo 2 do About, aprovado, também. A
casa de Keith McNally em SoHo se escreve *Balthazar*.

O site mantém **Balthazar** nos dois lugares. Um nome próprio não é trocado
em silêncio por causa de uma grafia de anotação; se a cliente confirmar que
quer *Baltazar*, são duas ocorrências em `index.html` (career strip e
segundo parágrafo do About).

## 4. Fotografia de Miami (página `/opportunities/`)

O PDF (p.2) pede uma imagem para ilustrar a abertura, "pode ser uma imagem de
Miami". Não há nenhuma nos assets do projeto nem no pacote do Rick. Não usei
stock sem autorização, não gerei imagem por IA e não usei `MIC_8581` nem
`MIC_8727` como se fossem fotos de Miami. A composição foi fechada sem
fotografia; o lugar dela é acima de `#diagnosis`.

## 5. Atribuição das fotos por Case

Catálogo do que sustenta cada associação, para conferência da cliente.
Nenhuma foto entrou num Case por "combinar visualmente".

| Arquivo | Onde está | O que sustenta |
|---|---|---|
| `alex-burgermeister.webp` | Burgermeister, foto de abertura | É a fotografia que a **página 4 do PDF** usa no bloco Burgermeister |
| `case-bm-room-*.webp` (`DSC_4054`) | Burgermeister | Cozinha de hambúrguer, prateleiras de pão brioche, o hambúrguer na mesa. **Não confirmado por escrito** |
| `case-bm-work-*.webp` (`DSC_4117`) | Burgermeister | Mesma sala, mesmo neon, mesma sessão de `DSC_4054`. **Não confirmado por escrito** |
| `office-team-*.webp` (`MIC_8727`) | The Office, foto de fechamento | As camisas da equipe dizem **"The Office Delray · Atlantic Ave, FL"**. Confirmado pela própria imagem |
| `alex-service-*.webp` (`MIC_8581`) | The Office, retrato | Mesma série de arquivo (`MIC_`), mesmo tratamento em preto e branco e mesmo figurino de `MIC_8727`; rua noturna com palmeira e fachada de neon, compatível com a Atlantic Ave. **Inferência de sessão, não confirmação escrita** |

Os dois itens não confirmados a pedir para a cliente:

1. `DSC_4054` / `DSC_4117` são mesmo de Burgermeister (e de qual unidade)?
2. `MIC_8581` é da mesma noite de `MIC_8727`, no The Office?

Se qualquer resposta for negativa, é só trocar o `src` na seção; nenhum
texto do site nomeia a casa dentro do `alt`, então nada mais precisa mudar.

Correção feita nesta etapa: o `alt` de `case-bm-work` afirmava "Alexander
Ringleb working over the table". A pessoa curvada sobre a mesa em
`DSC_4117` não é identificável como Alexander (rosto oculto, roupa
diferente da de `DSC_4054`), então o `alt` passou a descrever a cena.

As outras do pacote ficaram fora: `DSC_4056` e `DSC_4065` repetem o
enquadramento de `DSC_4054`, e os dois `1FX37392…Still` não mostram
Alexander de forma identificável. Os originais e placeholders sem uso foram
retirados do repositório de produção e preservados no arquivo externo.

## 6. Backend do formulário de contato

O formulário não tem handler. Campos, labels, select, honeypot e a estrutura
de submissão foram preservados; nada no site afirma que o envio funciona em
produção. Ele agora mora em `/contact/`. Definir o destino (serviço de
formulário, endpoint próprio ou `mailto:`) antes do lançamento.

## 7. A rota `/cases/`

Os Cases passaram a viver na home, entre a quote e o footer. A URL antiga
`/cases/` foi mantida para não quebrar links já publicados, mas deixou de
ter conteúdo: encaminha para `/#cases` (canonical + meta refresh +
`location.replace`, com um link real para quem chegar sem nenhum dos dois).
Não existe segunda cópia dos Cases para sair de sincronia.

Não há configuração de host neste deploy (build estático de Vite, sem
`vercel.json` / `netlify.toml` / `_redirects`), por isso o encaminhamento é
feito na própria página. **Se um host com redirect de servidor for
definido**, trocar por um `301 /cases/ → /#cases` e apagar `cases/` do
`vite.config.js` e do repositório.

## 8. Os três itens de Press sem URL

Os seis itens de `/press/` não são iguais: três têm URL comprovada e três
não. Desde esta etapa a diferença é visível sem ser explicada.

| Item | Destino | Como aparece |
|---|---|---|
| VoyageMIA | `voyagemia.com/interview/…` | Pill verde "Read the feature" |
| Miami New Times | `miaminewtimes.com/restaurants/…` | Pill verde "Read the article" |
| Burger Beast Podcast | `open.spotify.com/episode/…` | Pill verde "Listen on Spotify" |
| SOBEWFF | — (§2: o perfil responde 404) | Rótulo "Festival profile" |
| Haute Living | — (matéria impressa) | Rótulo "Print feature" |
| Biscayne Times | — (matéria impressa) | Rótulo "Print coverage" |

Os três pills reusam `.btn-solid`, o botão preenchido do resto do site, com
`.press-cta` dizendo só onde ele fica; não há um terceiro sistema de
botões. Os três rótulos são `.press-static`: sem pill, sem sublinhado e sem
controle desabilitado que pareça clicável e não seja. A altura do rótulo
acompanha a do pill para os seis itens fecharem na mesma linha.

Quando uma URL chegar (a do SOBEWFF é a pendência de §2, as duas impressas
podem nunca ter uma), a troca é de uma linha: o `<p class="press-static">`
vira o mesmo `<a class="btn-solid press-cta" target="_blank" rel="noopener">`
que os outros três já usam.

## 9. O trilho de Insights — decisão de rolagem

O briefing autorizava um trecho *pinned* curto para o trilho horizontal.
Não há nenhum, e é deliberado.

Um pin compra o deslocamento horizontal segurando a viewport e inflando o
documento pela distância do pin — exatamente onde um trilho começa a
parecer rolagem quebrada: a página para, o leitor força, e a soltura no fim
é um salto. O trilho é ligado à rolagem da própria página: conforme a seção
atravessa a viewport, `js/motion.js` mapeia o progresso dela em
`scrollLeft`. A altura do documento não muda (medido: 2153px com e sem a
ligação), a rolagem vertical nunca é capturada e o leitor sai da seção em
qualquer momento, nos dois sentidos.

A ligação é o estado inicial, não um modo. O primeiro gesto do leitor sobre
o trilho — swipe de trackpad, arraste, um dos controles, ou um card
recebendo foco de teclado — entrega o controle em definitivo e devolve o
scroll snap. Nunca há dois donos do mesmo scroller.

Abaixo de 861px, sob `prefers-reduced-motion` e sem JavaScript a ligação
nem é armada: o trilho é um scroller nativo com snap, que swipe, trackpad,
arraste e a tecla Tab já percorrem inteiro. Os controles ficam com o
atributo `hidden` no HTML e só o `js/motion.js` os revela — sem script eles
não fariam nada, e um controle que não pode agir não deve estar na página
se oferecendo.
