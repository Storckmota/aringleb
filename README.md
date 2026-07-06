# Alexander Ringleb — Redesign do site oficial

Redesign premium/editorial de **aringleb.com** com fidelidade total de
conteúdo: mesmas seções, mesma ordem, mesma copy, mesmos links, mesmas
imagens e mesmo menu do site oficial — sob a direção de arte aprovada na
hero (papel-osso, verde-pinho, dourado, Gamay, hairlines).

**Como abrir:** duplo clique em `index.html` (ou qualquer servidor estático
na pasta). Sem build; a única dependência externa é o widget oficial de
Instagram (Behold) que o próprio site atual já usa.

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
