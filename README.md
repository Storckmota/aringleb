# Alexander Ringleb — Redesign do site oficial

Redesign premium/editorial de **aringleb.com** com fidelidade total de
conteúdo: mesmas seções, mesma ordem, mesma copy, mesmos links, mesmas
imagens e mesmo menu do site oficial — sob a direção de arte aprovada na
hero (papel-osso, verde-pinho, dourado, Gamay, hairlines).

**Como abrir:** use o servidor local do Vite para desenvolvimento e QA:
`npm run dev`. Para validar a versão de produção: `npm run build` e
`npm run preview`. A única dependência externa de runtime é o widget oficial
de Instagram (Behold) que o próprio site atual já usa.

## Desenvolvimento local

```bash
npm install
npm run dev
npm run build
npm run preview
```

O projeto continua sendo HTML/CSS/JS puro: `index.html` permanece na raiz,
sem React, sem framework de UI e sem pasta `src/`.

## Estrutura de arquivos

```
index.html            página única (hero aprovada + site oficial redesenhado)
css/hero.css          hero aprovada + tokens do design system (:root)
css/site.css          nav real, seções do site oficial, footer, reveals
js/hero.js            entrada da hero, parallax, CTA magnético, nav sólida
                      no scroll, reveals, variantes fotográficas
assets/fonts/         Gamay (mesma família do site oficial)
assets/img/           recortes da hero + fotos reais do site otimizadas
PHOTO-DIRECTION.md    decisão fotográfica da hero + briefing da foto futura
README.md             este arquivo
```

## Mapa de fidelidade (site oficial → redesign)

Ordem idêntica ao site oficial:

| Seção oficial | id | Conteúdo preservado | Reinterpretação visual |
|---|---|---|---|
| Nav | — | Logo; About (dropdown: Alexander Ringleb / Burgermeister / The Office); Press; Social Media; Opportunities; Contact | Barra fixa transparente sobre a hero, papel translúcido após o scroll; dropdown hairline |
| Hero | `#top` | **Hero aprovada** (Editorial default) | — |
| Marquee | — | Os 8 itens oficiais, mesma ordem | Faixa de créditos entre hairlines, separação por espaço |
| Pain strip | `#pain` | Headline, sub e as 3 colunas (Problem/Risk/Solution) verbatim | Argumento editorial: display + 3 colunas hairline, sem caixas |
| About | `#about` | 4 parágrafos verbatim (com os strong), foto alex-portrait, 4 credenciais, CTA p/ opportunities | Spread com foto sticky emoldurada, strip de credenciais em hairline |
| Burgermeister | `#burgermeister` | 3 parágrafos, CTA, foto alex-operator, stats 2/10+/4.7★, 7 tags de Recognition | Capítulo pinho; stats como ledger de numerais dourados; recognition em linha de caps |
| The Office | `#the-office` | 2 parágrafos + 5 linhas de detalhe verbatim | Ghost "17" monumental + ledger de detalhes |
| Quote | `#quote` | Citação e atribuição verbatim | Pull-quote em Narrow Italic sobre pinho |
| Press | `#press` | 6 veículos, descrições e links reais (VoyageMIA, SOBEWFF, Haute Living, Miami New Times, Burger Beast/Spotify, Biscayne Times) | Índice de clippings: thumb/placa tipográfica + badge + descrição + link |
| Social Media | `#social` | Copy verbatim, follow real, **widget Behold oficial** (feed-id original) + 4 topic cards verbatim | Capítulo pinho; feed real; topics como colunas hairline |
| Opportunities | `#opportunities` | Intro + cards E-2 e EB-5 completos (5 bullets cada) + nota "Important" verbatim | Duas placas hairline com régua dourada; nota com filete lateral |
| Contact | `#contact` | Copy, canais reais (alex@aringleb.com, Miami, @iamalexander.r) e **formulário oficial** (mesmos campos, name, honeypot) | Ledger de canais + formulário de linhas com botão pill |
| Footer | — | 3 colunas oficiais (brand / Navigate 7 links / Opportunities 4 links) + copyright e social verbatim | Pinho profundo, grid hairline |

## Regras vigentes (decisões do cliente)

- Hero aprovada: **não desmontar**; foto Editorial é o padrão
  (`?photo=refined` comparação; `?photo=slot` referência interna).
- Copy do site oficial é fonte da verdade — mudanças de texto só com
  aprovação.
- Sem scroll cues; sem separadores chamativos em texto em movimento; sem
  cards SaaS/ícones/clichês de Miami.

### Decisões da auditoria de conteúdo (2026-07-06)

- **Headline da hero** ("Built in hospitality. Proven in Miami.") e kicker
  ("For investors & partners in South Florida") são **decisões aprovadas de
  redesign** — divergem de propósito da headline oficial e não devem ser
  "corrigidos" de volta.
- **Monograma A—R** mantido no header como decisão de identidade; a
  fidelidade semântica fica no `aria-label="Alexander Ringleb"` +
  `title="Alexander Ringleb"` do link (o nome completo segue no marquee da
  hero e no footer).
- **"Founder"** (stamp da hero): corrigido de "Co-founder" por fidelidade
  factual — o site oficial credita "Founder" para o Burgermeister.
- **"Explore my work →"** restaurado como **CTA secundário** da hero
  (`.cta-ghost` → `#burgermeister`), por fidelidade ao site oficial;
  "Start a conversation" permanece como CTA principal.
- **Loader/loading screen** (palavras + A—R expandindo): adiado de
  propósito — será tratado na etapa de motion/direção visual.

### Etapa 2 — refinamento visual, motion e loader (2026-07-06)

Conteúdo congelado (auditado na Etapa 1); apenas a forma mudou.

- **Paleta**: paper mais osso (`#ede8db`), pine mais profundo (`#0d2a1b`)
  e novo `--pine-deep` (`#081911`) para as cenas de fechamento (Quote,
  Contact, Footer). Dourado mais escasso: kickers, hairlines e numerais.
- **Tipografia**: Gamay mantida por decisão de direção (família da marca
  oficial); o refino foi de escala (displays até ~5rem), tracking das
  microcaps reduzido e Narrow Italic como contraponto.
- **Composição por seção**: Pain como tese em ledger (label · claim ·
  evidência); About como perfil de revista (lede + placa fotográfica
  offset + índice de credenciais numerado); Burgermeister com stats
  monumentais e Recognition como registro numerado; The Office com o
  "17" em contorno monumental; Quote como pausa quase-preta; Press como
  índice editorial numerado (hover sweep); Social com o feed Behold
  emoldurado (observatório) e topics como notas; Opportunities como
  dossiê (documentos com watermark E-2/EB-5 e CTA linha-de-assinatura);
  Contact como fechamento escuro cinematográfico; Footer como assinatura.
  Numerações de Press/credenciais/recognition são CSS counters
  (decorativas, nada de copy nova).
- **Loader A—R**: palavras multilíngues → A—R → o traço estende
  full-width → painéis abrem sobre a hero. Só na primeira visita da
  sessão (`sessionStorage: ar-intro`); `[hidden]` sem JS; killswitch de
  4,5s; `?static=1` pula; reduced-motion vê A—R estático breve.
- **Motion**: sem GSAP (decisão: zero dependências; IO + CSS cobre o
  necessário). Variantes `.rv` (texto), `.rv-mask` (imagens por crop),
  `.rv-ghost` (numerais em cauda longa), hairlines que desenham,
  capítulos pine mais lentos. Estados ocultos só sob `html.anim` —
  no-JS e reduced-motion veem o estado final.

### Etapa 3 — recalibração para seriedade/credibilidade (2026-07-06)

Feedback de designer sênior: a Etapa 2 ficou pesada e "experimental"
demais. Conteúdo permanece congelado; só a forma foi recalibrada.

Revertido/removido da Etapa 2:
- **Numerais gigantes**: o "17" em contorno (The Office) e os watermarks
  "E-2"/"EB-5" (Opportunities) foram **removidos**. Números agora só como
  dado sóbrio (stats, fact-sheet ledger).
- **Escala tipográfica**: `.sec-display` de ~4,4rem → ~2,75rem; Pain de
  5rem → ~3,3rem; stats de 3,6rem → 2,4rem; footer-name de 2,5rem →
  1,25rem; quote de 3rem → 2,2rem. "Institucional premium", não pôster.
- **Itálico dourado nos títulos**: o `em` das seções deixou de ser
  Gamay Narrow dourado e passou a **pinho, igual ao `em` da hero** —
  dourado agora só como fio fino (kickers/hairlines).
- **Blocos escuros**: Burgermeister e Social voltaram a **papel**;
  Quote e Contact passaram de quase-preto (`sec-deep`) para pinho.
  Escuro agora é intencional: Quote (pausa), Contact e Footer (fecho).
  Papel/paper-deep alternam e dominam.
- **Loader**: sequência de palavras + traço + painéis **substituída** por
  um A—R mínimo em papel (fade in ~0,5s, hold, fade out; ~1,7s total),
  sem flash escuro. Reduced-motion ~0,8s. Killswitch 3s.
- **Motion**: `.rv-ghost` removido; `.rv` reduzido (16px, .7s);
  crop de imagem mais leve; sem stagger longo nem entrada teatral.

Recomposições: Pain como memo/briefing (label · claim · evidência em
hairlines); The Office como fact-sheet; Opportunities como investment
brief de duas colunas (letterhead pinho, bullets em régua, CTA
linha-de-assinatura, sem card/massa); Social com feed contido em
moldura discreta (max 900px) e topics como notas.

## Como editar

- **Textos**: `index.html` (comentários marcam cada seção oficial). Manter
  fidelidade — a copy espelha o site oficial.
- **Fotos**: originais do site em WebP em `assets/img/` (portrait 760,
  operator 1000, thumbs 420). Para trocar: mesmo nome/formato.
- **Feed do Instagram**: `behold-widget` com o feed-id oficial; gerenciado
  em behold.so (conta do cliente).
- **Formulário**: markup no padrão Netlify do site oficial (name="contact",
  form-name, honeypot). Em produção Netlify, conferir se o atributo
  `data-netlify="true"` é exigido pela conta.

## Verificação

Screenshots em 1440 (full + 6 closes) e 390 (full), estados de scroll,
reduced-motion e no-JS pelo sistema `html.anim`. Fontes locais com preload;
imagens WebP; sem dependências além do widget oficial.
