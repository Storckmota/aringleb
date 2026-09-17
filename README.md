# Alexander Ringleb — site oficial

Site editorial multipágina de Alexander Ringleb, construído com HTML, CSS,
JavaScript e Vite. O projeto mantém a identidade visual aprovada, apresenta o
histórico profissional, os Cases, Press/Blog, Insights, Opportunities e Contact.

## Desenvolvimento local

Requisitos: Node.js 20+ e npm.

```bash
npm ci
npm run dev
```

Validação completa antes de publicar:

```bash
npm test
npm run build
npm run check:site
```

Para revisar o build localmente:

```bash
npm run preview
```

## Rotas

| Rota | Conteúdo |
|---|---|
| `/` | Hero, trajetória, About, Cases e destaques de Insights |
| `/press/` | Cobertura externa e artigos editoriais publicados |
| `/insights/` | Conteúdo de social media |
| `/opportunities/` | Diagnóstico, E-2, EB-5 e aviso importante |
| `/contact/` | Formulário e canais de contato |
| `/cases/` | Compatibilidade: encaminha para `/#cases` |

## Estrutura

```text
index.html                 Home
press/index.html           Press e Blog
insights/index.html        Social Media
opportunities/index.html   Investment Opportunities
contact/index.html         Contato
cases/index.html           Encaminhamento legado
css/                       Estilos compartilhados e de artigos
js/                        Interações, motion, Cases e Social
assets/fonts/              Fontes locais Gamay
assets/img/                Imagens otimizadas usadas pelo site
scripts/insights/           Integração de artigos publicados no Sanity
scripts/site-check.mjs      Verificação do build estático
vite.config.js              Entradas multipágina e geração editorial
```

Materiais brutos, documentos da cliente, capturas de auditoria e arquivos de
trabalho não pertencem ao repositório de produção. O diretório `assets/`
contém somente arquivos carregados pelo site.

## Press e Blog com Sanity

Durante o build, o site consulta apenas artigos publicados no Sanity. Não há
token de escrita no frontend ou no processo público de leitura. Os artigos são
inseridos abaixo da cobertura externa em `/press/` e cada artigo recebe uma
rota em `/press/<slug>/`.

Variáveis públicas aceitas no build:

```text
SANITY_PROJECT_ID
SANITY_DATASET
SANITY_API_VERSION
SITE_ORIGIN
```

Consulte `.env.example`. Segredos como `SANITY_WRITE_TOKEN`, chaves da OpenAI,
tokens do Instagram e Deploy Hooks pertencem ao backend do CMS, nunca a este
repositório ou ao bundle do navegador.

Se o Sanity estiver indisponível ou retornar um artigo inválido, o build falha
em vez de publicar uma listagem vazia.

## Deploy na Vercel

Configuração esperada:

- Framework preset: Vite;
- Install command: `npm ci`;
- Build command: `npm run build`;
- Output directory: `dist`;
- Node.js: 20 ou superior;
- variáveis públicas conforme `.env.example`.

Após a publicação de um artigo no CMS, a Function server-side do CMS pode
acionar o Deploy Hook deste projeto. O hook e as credenciais não são expostos
ao site.

## Regras de manutenção

- Não adicionar PDFs, fotografias originais pesadas ou screenshots de QA em
  `assets/`.
- Gerar versões WebP/JPEG adequadas e referenciá-las explicitamente no HTML.
- Não adicionar conteúdo fictício para Cases, links sociais ou matérias.
- Preservar `prefers-reduced-motion`, navegação por teclado e fallbacks sem JS.
- Rodar testes, build e `check:site` antes de qualquer deploy.

Pendências que dependem da cliente estão documentadas em `PENDING.md`.
