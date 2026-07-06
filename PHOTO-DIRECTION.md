# Direção fotográfica — Hero Alexander Ringleb

## Decisão de direção — OFICIAL (jul/2026)

**Adotada: Editorial.** É a versão padrão do `index.html` e a apresentação
oficial do site — a que melhor integra a foto ao sistema visual (papel-osso,
pine, dourado) e sustenta o posicionamento mais sofisticado da marca.

| Hierarquia | Versão | Como ver | Status |
|---|---|---|---|
| **Principal** | **Editorial** | `index.html` (padrão) | **Adotada — apresentação oficial** |
| Secundária | Atual refinada | `index.html?photo=refined` | Mantida apenas para comparação |
| Interna | Placa reservada | `index.html?photo=slot` | Referência para o shooting futuro; **não é versão de lançamento** |

Qualquer build, review ou apresentação do site deve partir do `index.html`
sem parâmetros — ou seja, da Editorial.

## O que define a versão Editorial

Asset regradado em pós (`assets/img/alex-cut-ed-*.webp`), não filtro CSS:
camisa dessaturada ~20% (salmão → rosa-empoeirado, parente do dourado da
paleta), pretos levemente levantados (fade de filme), temperatura puxada ao
papel (5900K), pele natural. O rosto e a mensagem lideram; a camisa vira
suporte cromático. CSS quase neutro + sombra curta e decidida.

Pipeline (para regerar): recorte ML de `alex-headshot.jpg` → grade ffmpeg
com alpha preservado (alphaextract/alphamerge) → crop `880:1788:300:260` →
WebP 1100/700.

## Briefing da foto ideal (para o shooting futuro)

**Conceito:** o operador no seu território — autoridade em contexto real de
hospitality, não retrato de estúdio.

- **Locação:** dentro de um dos espaços dele (Burgermeister Miami ou The
  Office Delray) — balcão, bar ou salão com profundidade real ao fundo.
- **Luz:** cinematográfica quente (tungstênio dos lustres/golden hour pelas
  janelas), key lateral suave. **Sem flash direto.**
- **Enquadramento:** vertical 3:4, câmera à altura do peito, 50–85 mm,
  f/2.8–4 (fundo desfocado sutil), corte na meia-coxa, headroom generoso
  (o topo da cabeça precisa de folga para o crop da hero).
- **Pose:** em pé, peso relaxado, braços cruzados soltos ou mão no bolso,
  olhar direto para a câmera. A postura de "dono da sala", sem rigidez.
- **Wardrobe:** linho escuro — navy ou verde-profundo (dialoga com o sistema
  pine + gold do site sem competir com o rosto).
- **Técnico:** RAW, mínimo 2400 px de altura, sujeito separável do fundo
  (contraste tonal nas bordas — facilita o recorte limpo).
- **Entrega:** cor neutra; o grade final é aplicado no pipeline do site.

Com a foto nova aprovada, o caminho é: recortar no mesmo pipeline, exportar
como `alex-cut-ed-*.webp` nos dois tamanhos e nada mais muda no código.
