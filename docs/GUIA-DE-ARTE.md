# Geografia Irada — Guia de direção de arte (definitivo)

> Versão 1.0 · 02/10/2026 · Diretor(a) de arte. **Este guia manda na aparência do jogo.** Toda frente o segue à risca;
> se algo aqui conflitar com um relatório de pesquisa (`arte/*.md`, `ativos/*.md`), **vale o guia**. Contratos de código,
> donos de arquivo e camadas continuam na `docs/ARQUITETURA.md`.
>
> **Unidade de medida.** `u` = 1% da altura do palco 16:9 → `--u: min(1vh, .5625vw)`. Em 1920×1080, **1u = 10,8 px**;
> em 1366×768, **1u = 7,68 px** (o layout é o mesmo, só escalado). No mundo 3D, **1 módulo = 1 pino** (8 mm de peça real).
>
> **Maquetes e capturas que provam as decisões:** `arte/maquetes/` (mapa: `mapa-guia.js`; HUD: `hud.html`; objetos 3D:
> `objetos.html`; logotipo: `logo.html`) e `arte/maquetes/capturas/`. Paleta conferida por `arte/guia/conferir.py`.

---

## Índice
1. Conceito visual
2. Paleta completa
3. Tipografia
4. Linguagem de ilustração (o kit)
5. Componentes de interface e layout do HUD
6. O mundo 3D
7. Bonecos
8. Mascote "Globo Irado" e logotipo
9. Animação e suco
10. Som e música por momento
11. O Teste do Estúdio e a lista "NUNCA FAÇA"
12. Quem usa o quê (atalho por frente)

---

## 1. Conceito visual

**Em três frases.**
1. **O planeta é um brinquedo de verdade:** um mapa-múndi de peças de montar sobre uma mesa anil, fotografado como
   numa bancada de estúdio de miniaturas — luz quente de cima, preenchimento frio, plástico que brilha, sombra de contato.
2. **Tudo o que se toca também é peça:** botões são tijolos com pinos, painéis são placas com moldura, medidores são
   fileiras de tijolinhos, o jornal, a urna e o martelo são objetos de montar; tudo com o mesmo contorno índigo e o mesmo
   brilho de plástico, e bonecos de blocos de cabeça grande que reagem a cada decisão.
3. **Cada decisão constrói algo no mundo, peça por peça,** e cada consequência aparece onde aconteceu — o objeto se monta,
   a cor corre pelo território, o número salta no HUD e a manchete diz o porquê.

**O que diferencia o jogo (e o separa do Carreira em Jogo).**
- **A geopolítica vira objeto:** decisão → construção no mapa → número → manchete. Nada de carta que vira; nada de confete
  de papel. A comemoração é **chuva de tijolinhos**, o resultado é **carimbo de peça**, a notícia é **telejornal de brinquedo**.
- **Uma linguagem só, do 3D ao último ícone:** plástico ABS de brinquedo (MeshStandard, rugosidade .30, sem metal), contorno
  índigo `#1A1433` tingido (nunca preto), letra-bolha branca, amarelo `#FFD21F` como cor de "sua ação".
- **Feito para o telão:** legível a 8 m (texto mínimo 18 px em 1366×768, contorno grosso, cor + forma), um foco por vez,
  tudo pulável, movimento reduzido de verdade.
- **Sério no conteúdo, lúdico na forma:** conflito é emergência humanitária, nunca espetáculo; ninguém é humilhado; nenhum
  povo é caricaturado.

**Palavras-guia** (use para decidir em caso de dúvida): *brinquedo de coleção · bancada de estúdio · peça que encaixa ·
telejornal de brinquedo · mapa que guarda memória.*

**Referências de nível** (só estilo; nunca escrever esses nomes no jogo): o acabamento de plástico e a montagem peça a peça
dos jogos de peças da TT Games e de *Builder's Journey*/*Bricktales*; a leitura de silhueta, o contorno tingido e o ritmo de
reunião/revelação de jogos de dedução social; o botão gordo e a letra com traço de plataformas de jogos de blocos; a clareza
de mapa-tabuleiro de *Polytopia*, *Mini Metro* e *Daybreak*; o "mundo que reage" de *Civilization VI* e *Plague Inc.*

---

## 2. Paleta completa

Fonte única das cores no código: os tokens CSS de §5.1 (`css/base.css`, Fundação) e, no 3D, uma cópia de `EQUIPES`,
`CONTINENTES`, `OCEANO` em `js/mapa3d.js` (Mundo 3D) — **os valores são estes, não os de `conteudo/*.js`**. As cores de
`conteudo/potencias.js` (`cor`) e `conteudo/politicas.js` (`CATEGORIAS.cor`) são antigas: a interface lê as cores deste guia
pelo id (`brasil`, `diplomacia`…), via `corDe(pid)`/`formaDe(pid)` de `js/ui.js`.

**Regra-mãe: quem = cor saturada; o quê = pastel; tudo = contorno índigo.** As 6 potências são as únicas cores saturadas
do jogo. Ações, categorias, territórios neutros e indicadores usam tons claros. Texto e contorno são índigo; nada é preto puro.

### 2.1 Fundos

| Token | Hex | Uso |
|---|---|---|
| `--mesa-topo` / `--mesa-meio` / `--mesa-base` | `#3550C8` / `#22339A` / `#141F66` | **Fundo do jogo: a mesa anil** (degradê vertical 0 / 55 / 100%) + luz radial `rgba(255,255,255,.16)` centrada em 50% 52%, raio 60%. No 3D, vira textura de `cena.background` (o pós-processamento tira a transparência do canvas). **Decisão: anil, e não o azul da marca antiga** — ver capturas `maquetes/capturas/mapa-anil2.png` × `mapa-marca2.png`: no azul-claro o oceano se dissolve no fundo; no anil o mapa vira um objeto sobre a mesa, e o creme e a letra-bolha ganham contraste (ladrilho × anil 6,4–14,1:1). |
| `--mesa-crise-*` | `#4A3FB0` / `#2E2380` / `#1B1250` | Tensão ≥ 80: a mesa puxa para o violeta em 2 s (`sine.inOut`) e a música vai para `tensao`. Volta em 2 s. |
| `--mesa-colapso-*` | `#4A4F7A` / `#2E3150` / `#1B1D33` | Tela de colapso (dessaturada, sem vermelho de pânico). |
| `--noite-centro` / `--noite-borda` | `#2A3C9A` / `#070A24` | Telas de segredo (revelação, voto escondido): radial do holofote a partir de 50% 88%. Nunca preto puro (o projetor lava). |
| `--veu` | `rgba(14,20,64,.45)` | Escurece o mapa sob painéis grandes. Máximo `.55`. **Sem `backdrop-filter`** (custa GPU sobre o WebGL). |
| `--padrao-pinos` | `rgba(255,255,255,.06)` | Padrão de pinos sobre a mesa nas telas de página (início, lobby, ajustes, fim) — §4.6. |

### 2.2 Interface (plástico da interface)

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `--tinta` | `#1A1433` | Contorno de tudo, texto escuro, miolo das sombras | índigo × ladrilho 16,8:1 |
| `--tinta-suave` | `#4A4570` | Texto secundário, legendas | × ladrilho 8,4:1 |
| `--ladrilho` | `#FFF9EC` | Face dos painéis, etiquetas de texto, cartões | — |
| `--ladrilho-2` | `#F3EAD6` | Área interna rebaixada clara (listas, linhas alternadas, "Você sabia?") | tinta 14,7:1 |
| `--placa-escura` | `#2E2752` | Trilho das barras, encaixe vazio, fundo do letreiro | branco 13,7:1 |
| `--encaixe` | `#4B4475` | Célula vazia das barras de tijolinhos | — |
| `--amarelo` (lado `#B98A00`) | `#FFD21F` | **Sua ação:** botão principal, seleção, foco, Capital Político (CP), "VEZ" | tinta 12,2:1 |
| `--verde-ok` (lado `#1F9A47`) | `#3CD46A` | Confirmar ✓ dentro de diálogos, ganho, "APROVADA" | tinta 9,1:1; letra-bolha |
| `--vermelho-alerta` (lado `#A3141F`) | `#F0303A` | Perigo, veto, "REJEITADA", alerta crítico | letra-bolha |
| `--cinza-peca` (lado `#98A6C2`) | `#E3E9F4` | Peça inativa, aba não selecionada, bloqueado | tinta 14,5:1 |
| `--ganho` / `--perda` | `#5BE37D` / `#FF6B6B` | Números flutuantes e setas (+/−), sempre em letra-bolha com contorno índigo e **com sinal** | — |
| `--branco` | `#FFFFFF` | Miolo da letra-bolha, brilhos | — |

**Lateral (relevo) de qualquer peça:** `color-mix(in oklab, <face> 64%, var(--tinta))` — sombra tingida de índigo, automática
para qualquer cor (a regra das sombras coloridas). Brilho do topo: `color-mix(in oklab, <face>, #fff 24%)`.

### 2.3 As 13 potências (as 6 primeiras validadas por ΔE2000 em visão normal, protanopia, deuteranopia, tritanopia e projetor lavado; as 7 novas seguem a mesma regra: cor + forma)

Cada potência é **cor + nome da cor + forma**. A forma substitui os antigos emblemas de animal (águia, dragão, urso,
elefante: clichês de charge) e aparece em tudo o que identifica a potência: bandeira, tampa das torres, broche do boneco,
selo do placar, ponta das linhas dos gráficos, tijolos de voto.

| Potência | Nome da cor | Cor | Sombra (lado, calça) | Clara (xadrez do parceiro) | Contorno 3D | **Forma** |
|---|---|---|---|---|---|---|
| Brasil | **Verde** | `#27B263` | `#0D6E4E` | `#73CD9A` | `#011C13` | **círculo** ● |
| Estados Unidos | **Azul** | `#0A32B4` | `#0B2384` | `#3657C2` | `#00041C` | **quadrado** ■ (cantos 14/100) |
| China | **Vermelha** | `#D0180E` | `#81001C` | `#DB4F48` | `#1C0006` | **triângulo** ▲ (cantos 9/100) |
| União Europeia | **Roxa** | `#9645EE` | `#651C94` | `#AD6EF2` | `#12031C` | **estrela** ★ de 5 pontas arredondadas |
| Índia | **Laranja** | `#FF9C0A` | `#9E3400` | `#FFC267` | `#1C0900` | **losango** ◆ |
| Rússia | **Rosa** | `#F2248F` | `#960773` | `#F66EB5` | `#1C0015` | **hexágono** ⬢ |
| Reino Unido | **Turquesa** | `#00B3A4` | `#00666B` | `#46E5D7` | `#011917` | **cruz** ✚ |
| Japão | **Grafite** | `#6C7A96` | `#414B5A` | `#A4ABB8` | `#0E1118` | **anel** ◎ (círculo vazado: o furo é lido a 20 px) |
| Austrália | **Lima** | `#9CCB1F` | `#507A13` | `#BDD776` | `#121705` | **gota** (ponta para cima) |
| Nova Zelândia | **Bordô** | `#8E1B3A` | `#551027` | `#CA5A78` | `#150509` | **pentágono** ⬟ |
| África do Sul | **Marrom** | `#9A5B2E` | `#5C321C` | `#C49574` | `#140C07` | **octógono** (lados retos: não confundir com o círculo) |
| Nigéria | **Coral** | `#FF7A66` | `#B53A2B` | `#FFB0A3` | `#2B0803` | **escudo** (topo reto, base em ponta) |
| Egito | **Celeste** | `#4DB6FF` | `#0B69A8` | `#9BCEF1` | `#01111C` | **trapézio** (base larga embaixo) |

- **As 7 novas formas** (`FORMAS` em `js/ui.js`, mesma área visual das antigas, cantos por arcos) foram conferidas lado a lado em 20, 32 e 96 px: nenhuma se confunde com outra. Verde (Brasil) e Turquesa (Reino Unido), e Azul (EUA) e Celeste (Egito), são os pares de cor mais próximos: ali a forma (círculo × cruz, quadrado × trapézio) é que separa. As bandeiras 3D `bandeira-<forma>` das 7 novas saem de `ferramentas/renderizar-arte.mjs` (kit em `vitrine-arte.html`).
- **A Rússia é rosa (aprovado):** o ciano antigo some no mar (ΔE < 4 para daltônicos).
- **Desenho das formas:** SVG em `viewBox 0 0 100 100`, caminhos arredondados de `arte/maquetes/formas.js` (copiar para
  `js/ui.js` como `FORMAS`, Fundação). Nunca usar os caracteres ● ■ ▲ ★ ◆ ⬢ de fonte (mudam de sistema para sistema e
  nenhuma das nossas fontes os tem). Traço: `stroke: var(--tinta)`, `stroke-width: 9` (no viewBox 100),
  `paint-order: stroke`, `stroke-linejoin: round`.
- **Forma sobre a cor** (pano da bandeira, tampa de torre): forma **branca** com traço índigo, ocupando 64% do lado da peça.
- **Forma como selo** (placar, chips, rótulo da casa no mapa, broche do boneco sobre disco creme, ponta de gráfico): forma
  **na cor da equipe** com traço índigo.
- **Texto sobre a cor da equipe:** sempre letra-bolha (miolo branco + contorno índigo .17em). Pelo menos uma das duas
  camadas passa de 3:1 contra cada cor.
- **A cor de equipe nunca encosta direto na mesa anil** (EUA × anil = ΔE 2,7 para deuteranopes): fica dentro de uma peça
  creme ou ganha aro de "adesivo" creme `--ladrilho` de 0,3u por fora do contorno índigo.
- **Nome da equipe na tela:** "Equipe Verde", "Equipe Azul"… (com a forma ao lado). Nunca identificar equipe por letra.
- Os tons de sombra e contorno seguem a regra das 18 cores estudada: sombra = matiz deslocado 12–20° (quentes para o
  vermelho/magenta, frios para o azul), brilho × 0,62, saturação +10 pp; contorno = mesmo matiz com brilho ~10%
  (`arte/maquetes/tons.py`).

### 2.4 Territórios neutros (por continente, 2 tons)

Claros e pouco saturados (L* 85–97), para as potências saltarem. Dois vizinhos do mesmo continente nunca repetem o tom
(coloração gulosa do grafo de vizinhos; ver `mapa-guia.js`, `montarTerra`). Variação de ±1,5% de brilho por pino (sorteio
fixo por célula) para a peça não parecer "computador". Pinos da borda do território: −4% de brilho.

| Continente | Tom A | Tom B | Nome |
|---|---|---|---|
| América do Norte | `#F6DECB` | `#ECCFB8` | pêssego |
| América do Sul | `#DCE6C4` | `#CEDBB2` | sálvia |
| Europa | `#E0E1EC` | `#D2D4E3` | névoa |
| África | `#F4E2BA` | `#EAD3A2` | areia |
| Ásia | `#F3D9D6` | `#E9C8C4` | rosa-argila |
| Oceania | `#E6DCF0` | `#D9CCE8` | lilás |
| Polos (Groenlândia, Antártida) | `#F6FAFD` | `#E7F1F8` | gelo |

O mapa começa claro e **vai ganhando cor** conforme as parcerias se formam — é a história da partida.

### 2.5 Casa da potência × parceiro (como distinguir no mapa)

| | Casa da potência (o próprio país/bloco) | Parceiro (território neutro na esfera da potência) |
|---|---|---|
| Cor | **Lisa**, cor cheia em todos os pinos | **Xadrez 2×2**: blocos de 2×2 pinos alternando cor cheia e cor **clara** |
| Altura | **+1 placa** (+0,4 módulo) acima dos neutros: a posse vira relevo | Altura dos neutros (não sobe) |
| Borda | Pinos da borda 7% mais escuros | Pinos da borda na **sombra** da equipe (+6% de brilho) |
| Marco | O **boneco** da equipe na capital, sobre base de peão creme com aro índigo; rótulo grande com a forma | **Bandeira** na âncora: base 2×2 na sombra, mastro creme `#F2F2EE` de 4,4 módulos, ponta amarela, pano 2,4×1,6 na cor com a **forma branca**; escala 1,5 |
| Onde aparece também | Placar, painel da vez | Ficha do território ("Parceiro do Brasil ●"), encaixes de liderança continental |

Quem não enxerga a diferença de cor lê o **xadrez + bandeira** (parceiro) ou o **relevo + boneco** (casa).
Prova: `maquetes/capturas/mapa-anil2.png` (Cone Sul e Andes em xadrez verde; Brasil liso e mais alto).

### 2.6 Estados

| Estado | Cor | Forma/ícone (nunca só cor) | Onde e como |
|---|---|---|---|
| **Vez** (equipe que joga) | `--amarelo` | aro amarelo 0,55u + ponteiro "VEZ" + brilho que pulsa a cada 2 s (RM: parado) | Linha do placar, painel da vez, boneco no mapa (holofote amarelo no chão) |
| **Crise** (indicador ou nação em risco) | `#FF8A1F` | selo "!!" + **fita zebrada** amarelo/índigo (`repeating-linear-gradient(-45deg, #FFD21F 0 .8u, #1A1433 .8u 1.6u)`) de 0,8u na borda de baixo da peça | Peça do indicador, chip da nação (valor < 30), apoio < 30 ("Crise política: −1 CP") |
| **Colapso iminente** (≤ 10% do limiar) | `#F0303A` | selo "✕" + tremida de 0,6u por 0,3 s a cada 4 s (RM: vinheta vermelha de 150 ms nas bordas, uma vez) | Indicador global; alarme toca **uma vez** por limiar |
| **Conflito** (território) | `#FF4B2B` (emissivo .35) | **1 a 3 blocos de alerta** 1×1 com "!" branco flutuando (nível = nº de blocos); nível ≥ 2: anel zebrado no chão + hachura (1 pino sim, 1 não, nas diagonais, −20% de brilho); nível 3: anel `#FF3B30` que se expande e some (1,4 s) + 3 bolinhas de fumaça `#5B6170` | Mapa; ficha do território (0–3 blocos) |
| **Foco de tensão** (nível 0 com risco: Taiwan, Coreia) | `#FFD21F` | anel tracejado de 12 traços, raio 4 pinos, girando 0,2 rad/s, + ícone ⚠️ | Mapa |
| **Aliado** (aliança estratégica) | cores das duas potências | **elo duplo** (dois anéis entrelaçados, cada um na cor de uma) + 🤝 | Placar (elo ao lado do nome), arco pontilhado duplo entre as capitais (2 s ao criar, depois 25% de opacidade) |
| **Bloqueado** (ação sem recurso, alvo inválido) | `--cinza-peca` | 🔒 + listras diagonais 45° (`#C9D0DE`/`#E3E9F4`, 1u) + o recurso que falta em pílula vermelha com "!" + motivo por extenso na ficha e no leitor de tela ("Falta 1 de Tecnologia") | Barra de ações, lista de alvos |
| **Sancionado** | `#6C6E68` | cadeado + corrente cinza na casa do alvo; arco tracejado índigo com cadeado no meio | Mapa, placar (corrente no retrato) |
| **Computador** | — | a palavra "Computador" (sem emoji) + boneco com **cabeça de monitor** (§7.5) | Placar, lobby, mapa |
| **Paz recente** | `#BFF5C9` | brilho verde-claro nos pinos por 1 mandato + **pomba** pousada na âncora | Mapa |
| **Pressão** (≥ 40 / ≥ 60) | branco / `#FF8A1F` | fumacinha branca saindo da âncora / tijolos saltando da torre de quem pressionou | Mapa; ficha (medidor com marca em 60) |
| **Disputa** (2 torres empatadas no limiar) | branco sobre índigo | selo de balança ⚖ desenhado (não fonte) de 2,6u | Acima das torres |

### 2.7 Indicadores globais

Ordem na barra do topo (os três que podem acabar o jogo no meio): **Comércio · Cooperação · Temperatura · Relógio ·
Deslocados · Energia**. Cada peça tem ícone Fluent 3D, valor, medidor com **limiar desenhado** e estado em palavras.

| Indicador | Ícone | Valor na peça | Medidor | Limiares desenhados | Estados (palavra) |
|---|---|---|---|---|---|
| Comércio | 🚢 | "62" | 10 tijolinhos-contêiner | marcas em 40 e 75 | Fragmentado (< 40) · Normal · Globalização acelerada (> 75) |
| Cooperação | 🕊️ | "45" | 10 tijolinhos | marcas em 30 e 70 | Cada um por si (< 30) · Normal · Multilateralismo forte (> 70) |
| Temperatura | 🌡️ | "1,45 °C" | **termômetro deitado de 13 tijolos** (0,1 °C cada, de 1,0 a 2,3) | bandeirinha "1,5" (Paris), "2,0", "✕" em 2,2 | Meta de Paris · Risco · Perigo · Colapso |
| Relógio do Juízo Final | mostrador próprio | "84 s" | **mostrador de 270° com só os últimos 5 minutos** | zona de 60 s e "MEIA-NOITE" | Calmo · Alerta · Crise · Meia-noite |
| Deslocados | 🧳 | "120 mi" | 20 encaixes de 10 milhões | "Emergência" em 150, "✕" em 200 | Estável · Emergência · Catástrofe |
| Energia (preço) | 🛢️ | "55" | ponteiro semicircular 0–100 | marcas 35, 50, 70 | Energia barata · Normal · Crise do petróleo |

**Cores de faixa dos medidores** (sempre com o símbolo): bom `#2FCB62` ✓ · médio `#FFC21A` ! · risco `#FF8A1F` !! ·
crítico `#F0303A` ✕. Tijolos do termômetro: até 1,5 `#FFC93C`; 1,5–2,0 `#FF8A1F`; 2,0–2,3 `#E8322B`.
Relógio: mostrador creme, zona dos últimos 60 s em `#FF5A1F`, últimos 15 s em `#D7263D`.

### 2.8 As 6 categorias de ação (pastel)

"O quê" é pastel: corpo dos tijolos de ação, cartões de opção dos dilemas, chapéu/camisa dos conselheiros, selo de
categoria nas manchetes. **Sempre com ícone + nome** (os pastéis entre si não se separam para daltônicos — o ícone é a pista).
Texto sobre eles: índigo (≥ 9,8:1).

| Categoria (id) | Nome na tela | Pastel (face) | Lado (relevo) | Brilho do topo | Ícone | Chapéu do conselheiro |
|---|---|---|---|---|---|---|
| `diplomacia` | Diplomacia | `#DCCFFF` lavanda | `#8F79CC` | `#E4DBFF` | 🤝 | cartola |
| `economia` | Economia e Comércio | `#FFE08A` manteiga | `#CCA742` | `#FFE8A8` | 💰 | capacete de obra |
| `natureza` | Natureza e Energia | `#B3EFC6` menta | `#65BF82` | `#C6F3D4` | 🌱 | chapéu de explorador |
| `seguranca` | Paz e Segurança | `#FFC4AE` pêssego | `#CC7C5E` | `#FFD2C1` | 🛡️ | capacete azul-céu da paz (`#8FD3FF`, faixa branca, sem emblema) |
| `pessoas` | Pessoas e Direitos | `#FFCAE6` rosa | `#CC75A3` | `#FFD7EC` | 👥 | boné |
| `ciencia` | Ciência e Informação | `#99CDF8` céu | `#4F90C6` | `#B2D9FA` | 💡 | óculos de laboratório |

O lado dos pastéis é explícito (`--cor-lado`), "de bala de goma": saturação +22 pp e brilho × 0,80 — fica vivo como
plástico colorido, e não acinzentado como a mistura automática com índigo. Medido (`arte/guia/conferir.py`): pastel ×
qualquer equipe ≥ 10,5 de ΔE2000 nas 8 condições; categorias entre si ≥ 12,7 em visão normal; texto índigo ≥ 10,4:1.

### 2.9 Mundo 3D: oceano, terra e clima

| Token | Hex | Uso |
|---|---|---|
| Oceano 0 → 4 | `#7FD8EC` · `#58C6E4` · `#38B1DC` · `#2397CF` · `#197DBF` | Plataforma → fossa (batimetria; fronteiras salpicadas ±0,9 célula) |
| Espuma | `#F2FDFF` | Peças redondas 1×1 com pino em 70% das células de costa |
| Rejunte | `#0B1F4B` | Base escura sob todas as peças (some as frestas) |
| Moldura do tabuleiro | `#FFF4DC` | Borda creme do mapa (1 tijolo de altura) |
| Gelo | `#F6FAFD` / `#E7F1F8` | Polos; vira oceano 0 quando derrete |
| Água avançando | `#A8E9F5` (opacidade .7) | Placas sobre a costa quando o mar sobe / enchente |
| Seca | `#D9B26A` (mistura de 40%) | Pinos do território ressecado + rachaduras (ladrilhos 1×1 `#B48A4A`) |
| Fogo (só incêndio florestal) | `#FF7A1A` / `#FFD21F` | Cones piscando devagar (≤ 2 Hz) |
| Cinzas | `#4A4545` | Pinos queimados depois do incêndio |
| Fumaça | `#5B6170` (conflito) · `#8A8F9E` (emissões) | Bolinhas de peça redonda que sobem e somem |
| Nuvem / tempestade | `#FFFFFF` / `#6B7391` | Modelo `nuvem` (Kenney) tingido |
| Raio | `#FFE45C` | Tempestade (pisca ≤ 2 vezes por segundo) |
| Plástico cinza (prédios, máquinas) | `#A0A5A9` claro · `#6C6E68` escuro | Re-tingir os modelos Kenney para estes cinzas |
| Madeira | `#B0743C` | Cabos, caixotes, martelo |
| Ouro | `#FFC93C` (lado `#C98A00`) | Troféu, moedas, medalha de ouro, ponta do mastro |
| Prata / bronze | `#D5DEEA` (lado `#8E9BB0`) / `#E79A5C` (lado `#A55A2A`) | Medalhas e pódio |
| "Peça preta" | `#2B2747` | Pneus, câmera de TV, servidores — nunca `#000` |
| Âncora do telejornal | `#4A4F5C` (grafite) | Terno do âncora (com gravata `--amarelo`); neutro, não confunde com equipe (o teal confundia com o Brasil) |

---

## 3. Tipografia

### 3.1 Famílias (todas SIL OFL 1.1, arquivos sem modificação em `fontes/`, de `ativos/fontes/`)

| Família | Pesos | Papel | Arquivos |
|---|---|---|---|
| **Fredoka** | **700** (600 só em rótulo pequeno) | Títulos, botões, abas, nomes no mapa, avisos | `fredoka-latin.woff2` (+ `-ext`) |
| **Nunito** | **800–900** (700 só em texto longo do Manual) | Texto, legendas e **todos os números** (algarismos tabulares nativos) | `nunito-latin.woff2` (+ `-ext`) |
| **Titan One** | 400 | **Só letreiros:** faixa do ano, cabeçalhos "JORNAL MUNDIAL" e "PLANTÃO GLOBAL", carimbos e títulos dos grandes momentos (REUNIÃO NA ONU, BALANÇO, VITÓRIA). Nunca o nome do jogo: o nome é a logo oficial. Sempre caixa-alta, até 3 palavras, ≥ 64 px em 1080p | `titan-one-latin.woff2` (+ `-ext`) |

```css
@font-face { font-family: 'Fredoka'; font-weight: 300 700; font-display: block; src: url(../fontes/fredoka-latin.woff2) format('woff2'); }
@font-face { font-family: 'Nunito'; font-weight: 200 1000; font-display: block; src: url(../fontes/nunito-latin.woff2) format('woff2'); }
@font-face { font-family: 'Titan One'; font-weight: 400; font-display: block; src: url(../fontes/titan-one-latin.woff2) format('woff2'); }
/* + as três -latin-ext com unicode-range U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF */
```
Lilita One (do Carreira em Jogo) **sai** do jogo: era a cara do jogo anterior.

### 3.2 Tamanhos (escala por `--u`; o piso de 18 px vale em 1366×768)

| Token | Uso | u | 1920×1080 | 1366×768 |
|---|---|---|---|---|
| `--fs-mega` | Palavra da revelação ("DIPLOMATA"), "2050" final | 14u | 151 px | 108 px |
| `--fs-faixa` | Faixa de anúncio (Titan One) | 11u | 119 px | 84 px |
| `--fs-h1` | Título de tela | 6,5u | 70 px | 50 px |
| `--fs-h2` | Título de painel, manchete do Plantão, título do dilema | 4,4u | 48 px | 34 px |
| `--fs-cartao` | Botão principal, título de cartão, aviso, número flutuante pequeno | 3,4u | 37 px | 26 px |
| `--fs-corpo` | Texto, opções do dilema, nomes no placar, letreiro | 2,8u | 30 px | 22 px |
| `--fs-min` | Rótulos, custos, legendas, nome no tijolo de ação | `max(18px, 2.2u)` | 24 px | 18 px |
| Rótulo do mapa (casa / neutro) | Fredoka 700 | 3u / 2,4u | 32 / 26 px | 23 / 18 px |
| Valor de indicador global | Nunito 900 | 3,3u | 36 px | 25 px |
| Número flutuante no mapa | Nunito 900 | 5,6u | 60 px | 43 px |

**Nada que a turma precise ler fica abaixo de `--fs-min`.** Se não couber: quebre a linha, troque o layout ou peça texto
mais curto ao Conteúdo. `caberNaLargura(el, minimo)` nunca desce abaixo de `--fs-min` (rótulo) nem de `--fs-corpo` (texto
de dilema e manchete).

### 3.3 Contorno, sombra e números

- **Letra-bolha** (texto sobre cor, sobre o mapa ou sobre a mesa): `color:#fff; -webkit-text-stroke:.17em var(--tinta);
  paint-order:stroke fill; letter-spacing:.02em;` + sombra dura `text-shadow: 0 .07em 0 var(--tinta)` em títulos ≥ `--fs-h2`.
  Texto ≤ `--fs-min`: traço `.2em`. Sobre o mapa, sombra suave extra `0 .12em 0 rgba(26,20,51,.35)`.
- **Texto sobre creme:** índigo `--tinta`, sem contorno. Secundário em `--tinta-suave`.
- **Números:** sempre Nunito 900 com `font-variant-numeric: tabular-nums` (o "0:45 → 0:44" não treme). Titan One só em número
  estático (ano). Sinal de menos tipográfico "−" (U+2212, função `sinal()`), vírgula decimal ("1,45 °C"), espaço fino não
  separável antes da unidade, "120 mi" no HUD e "120 milhões" no texto; CO<sub>2</sub> com `<sub>`.
- **Caixa-alta** só em Titan One (letreiros) e selos de até 2 palavras ("VEZ", "AO VIVO"). Frases nunca em caixa-alta.
  Nada de itálico no telão.
- **Altura de linha:** 1,05 em títulos, 1,18 em opções e manchetes, 1,3 em texto corrido.
- **Limites de texto** (o validador do Conteúdo deve avisar): manchete ≤ 70 caracteres · título de dilema ≤ 40 · texto de
  dilema ≤ 220 · opção ≤ 90 · resumo da opção ≤ 40 · "Você sabia?" ≤ 160 · rótulo de botão ≤ 18 · nome no tijolo de ação
  ≤ 2 linhas de 10 caracteres (campo `curto`; ver pendências em §12).

---

## 4. Linguagem de ilustração (o kit)

O cliente foi claro: **nada de rabisco, forma crua ou traço grosso sem acabamento.** Todo desenho do jogo é de uma de duas
famílias, e nenhuma outra:
- **(a) Objetos de peças renderizados em 3D** (pré-renderizados em imagem com fundo transparente): tudo o que é *coisa* —
  jornal, urna, martelo, troféu, caixas de recursos, retratos dos bonecos.
- **(b) Ornamentos em SVG/CSS** desenhados como peças de plástico vistas de frente: tudo o que é *moldura* — cabeçalhos,
  faixas, carimbos, selos, tíquetes, balões, padrões, gráficos e medidores.

Os ícones pequenos (≤ 64 px) são os **Fluent Emoji 3D** (`js/icones.js`, MIT): já têm volume e brilho de brinquedo e
combinam com o kit. Botões de mídia (som, pausa) usam os SVG "High Contrast" da mesma família, em índigo.

### 4.1 Os 7 princípios do desenho
1. **Tudo é peça.** Tijolo, placa, ladrilho, peça redonda, telha, arco, cone e barra (§4.3). Toda face de cima de tijolo ou
   placa tem pino; ladrilho liso só onde há impressão (texto, desenho).
2. **Silhueta primeiro.** O objeto é reconhecível como sombra chapada a 48 px: uma forma dominante + um detalhe que quebra o
   contorno (alça, antena, folha, papel saindo).
3. **Um exagero por objeto:** a "parte-charme" fica 1,2–1,4× maior (a lente da câmera, a cabeça do martelo, os sininhos do
   relógio, a fenda da urna).
4. **Paleta curta:** até 3 cores do guia por objeto + índigo + **um acento amarelo** (`#FFD21F`: um pino, um brilho, uma
   etiqueta). Objetos neutros não usam cor saturada de equipe (quem = saturado).
5. **Postura viva:** inclinação de 5–12°, assimetria leve (tampa entreaberta, folha levantada, cédula entrando na urna).
6. **Acabamento de estúdio:** chanfro de 0,05 em toda aresta, bisel no pino, reflexo de plástico, sombra de contato, junta
   escura entre peças, impressão nítida (decal) em vez de geometria confusa.
7. **Proibido:** caixa sem chanfro, cilindro sem pino, contorno grosso feito à mão, degradê genérico de "botão de site",
   emoji do sistema, texto em fonte do sistema, imitação de logotipo, marca ou emblema oficial (ONU, Cruz Vermelha).

### 4.2 A receita do estúdio de brinquedo (render dos objetos)

Dona: frente de Ilustração (`ferramentas/renderizar-arte.mjs` abre `ferramentas/vitrine-arte.html?render=<nome>` no Chrome
sem janela via `ferramentas/navegador.mjs`). **Prova da receita (código de partida):** `arte/maquetes/kit.js` (estúdio, peças,
contorno, 5 objetos e retratos) + `objetos.html` + `render-kit.mjs` → `arte/maquetes/kit/*.png`; folha de conferência
`kit-galeria.html` → `maquetes/capturas/kit-galeria.png` (sobre ladrilho, mesa anil e mapa, a 48, 96 e 170 px).

| Item | Valor |
|---|---|
| Renderizador | `WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true })`, `setClearColor(0x000000, 0)`, `toneMapping = NeutralToneMapping`, exposição 1,0, `outputColorSpace = SRGBColorSpace`, `setPixelRatio(2)` (renderiza 1024 e reduz para 512: borda limpa) |
| Câmera "3/4 de brinquedo" | `PerspectiveCamera(22)`; objeto girado **32°** (frente para a esquerda de quem olha), câmera **24°** acima; a esfera envolvente ocupa 78% da altura; centro do objeto a 46% da altura (sobra embaixo para a sombra) |
| Câmera frontal | Para placas com texto, selos-objeto e retratos: giro 0–15°, câmera 8° acima |
| Luz-chave | `DirectionalLight('#FFF1DC', 2.4)` em (−3, 6, 4), com sombra (`PCFShadowMap`, 2048², `radius 4`, `bias −.0004`) |
| Luz de recorte | `DirectionalLight('#A8DBFF', 1.4)` em (4, 3, −5): separa a silhueta do fundo e faz o "fio azul" nas costas |
| Preenchimento | `HemisphereLight('#EAF4FF', '#5B4C8C', .9)`: sombra fria e arroxeada, nunca cinza |
| Reflexo | `RoomEnvironment` por PMREM (sigma .04), `environmentIntensity = .35` |
| Sombra no chão | plano `ShadowMaterial({ color: '#1A1433', opacity: .22 })` (sombra projetada para a direita e para trás) **+ sombra de contato**: elipse radial `#1A1433` α .38 → 0, 1,15× a largura e 0,5× a profundidade da base |
| Plástico | `MeshStandardMaterial({ roughness: .30, metalness: 0 })`, ±1,5% de brilho por peça (sorteio fixo) |
| Transparente | `{ color: '#CFEFFF', transparent: true, opacity: .45, roughness: .05, envMapIntensity: 1.6 }` + 1 risco de brilho branco |
| Ouro | `{ color: '#FFC93C', metalness: .55, roughness: .28 }` (só troféu, moedas, medalha, ponta de mastro) |
| Impressão (decal) | ladrilho com `CanvasTexture` de 512 px por módulo, Fredoka/Nunito/Titan One já carregadas, `anisotropy 8` |
| **Contorno de adesivo** | depois do render, no canvas 2D: a **máscara só do objeto** (renderizada sem chão nem sombras) pintada de `#1A1433`, deslocada em 24 + 12 direções num raio de **2,5% do lado** (13 px em 512) e **menos a própria máscara** (`destination-out`): fica só o **anel**, por baixo da imagem. Assim o vidro continua transparente e a sombra fica fora do adesivo. Dá o mesmo contorno índigo da interface e separa o objeto de qualquer fundo |
| Saída | `img/arte/<nome>.webp` (512×512, qualidade .9, ≤ 25 KB) embutido em base64 em `js/arte.js`; `arte(nome, { classe, alt })` devolve o `<img>`. Kit inteiro ≤ 1,5 MB |
| Tamanhos de uso | 48 (chip), 96 (botão grande, selo), 160–220 (cabeçalho, conselheiro), 360 (destaque de painel). Nunca acima de 512 |
| Conferência | `ferramentas/vitrine-arte.html`: cada objeto a 48, 96, 192 e 360 px sobre ladrilho, mesa anil e mapa |

### 4.3 Biblioteca de peças (geometria comum; 1 módulo = 1 pino)

| Peça | Geometria (Three.js r186) | Medidas |
|---|---|---|
| Tijolo n×m | `RoundedBoxGeometry(n, 1.2, m, 3, .05)` + pinos | altura 1,2 |
| Placa n×m | idem com altura .4 | 0,4 |
| Ladrilho (liso) | placa sem pino; recebe impressão | 0,4 |
| Pino | `LatheGeometry` do perfil `[[.3,0],[.3,.17],[.29,.19],[.265,.2],[0,.2]]`, 16 lados no render, 12 no jogo | Ø 0,6, altura 0,2, bisel no topo |
| Peça redonda 1×1 / 2×2 | `CylinderGeometry(.487 / .975, h, 24)` + pino central | h 0,4 ou 1,2 |
| Telha 45° | perfil triangular extrudado, chanfro .05 | 1×2, 2×2 |
| Arco 1×3 / 1×4 | `TorusGeometry` cortado + pés retos | vão interno 1 / 2 |
| Cone 1×1 / 2×2 | `CylinderGeometry(.12, .48, 1.2)` / dobro | — |
| Barra (cabo) | `CylinderGeometry(.25, .25, n, 16)` com tampas arredondadas | Ø 0,5 |
| Junta | toda peça encosta na vizinha com fresta de 0,02 e chanfro: a junta escura aparece sozinha | — |

**Pegadinha do r186:** `RoundedBoxGeometry` sai sem índice e `LatheGeometry` com índice; converta com
`g.index ? g.toNonIndexed() : g` antes de `mergeGeometries`, ou a peça some sem erro.

### 4.4 Kit (a) — objetos de peças renderizados em 3D

Caixa = largura × altura × profundidade em pinos. Câmera: **3/4** (padrão) ou **F** (frontal). P0 = necessário nas
primeiras telas; P1 = completar antes da entrega. ✔ = já prototipado com a receita em `arte/maquetes/kit.js` (ponto de
partida; a Ilustração refina e completa). Quando existe modelo em `dados/modelos.js` (`Modelos3D`, CC0), **renderize
o modelo** com a receita, sempre **sobre uma placa-base de pinos** (é ela que "traz o modelo para o mundo de peças").

| id | O que é (peças) | Cores | Charme | Caixa | Câm. | Uso | P |
|---|---|---|---|---|---|---|---|
| `jornal` | **Jornal Mundial:** 3 ladrilhos 5,4×7 creme levemente desencontrados (folhas), deitados; o de cima impresso com a faixa vermelha "JORNAL MUNDIAL" (Titan One), a linha de edição, a manchete em Fredoka, uma "foto" e colunas de linhas | ladrilho, tinta, vermelho-alerta, amarelo (selo "EXTRA!") | selo-estrela "EXTRA!" amarelo de 12 pontas no canto; câmera **mais alta** (giro −18°, 56° acima) para a página não ficar de perfil | 6×1×8 | 3/4 alta | histórico de manchetes, letreiro (ícone), balanço (manchetes), capa "O mundo em 2050" | P0 ✔ |
| `camera-tv` | **Câmera de estúdio:** corpo de tijolos 3×2×4 peça-preta, lente redonda 2×2 (aro cinza + vidro azul-escuro com reflexo), luz "gravando" (pino transparente vermelho emissivo) no topo, alça amarela, tripé de 3 barras | `#2B2747`, `#A0A5A9`, amarelo, vermelho | lente 1,3× maior; adesivo "PG" (Plantão Global) amarelo na lateral | 3×5×5 | 3/4 | vinheta e tarja do Plantão, selo "AO VIVO" | P0 |
| `microfone` | **Microfone de repórter:** cabo barra 1×1×4 peça-preta, globo de espuma (peça redonda com textura de grade) cinza-claro, canopla quadrada amarela com "PG" | `#2B2747`, `#D5DEEA`, amarelo | inclinado 20°, como estendido para alguém | 2×5×2 | 3/4 | repórter de campo, fala na ONU, "Para conversar" | P0 |
| `urna` ✔ | **Urna de votação translúcida:** caixa 4×3×4 transparente, tampa 4×4 amarela com fenda, cédulas (ladrilhos 1×2 brancos) dentro | transparente, amarelo, branco, verde-ok (✓ na cédula) | uma cédula entrando pela fenda, com ✓ impresso | 4×5×4 | 3/4 | votação, Cúpula do Clima (compromissos secretos), "votou" | P0 |
| `martelo` | **Martelo da assembleia:** cabeça cilíndrica 2×2×4 madeira com 2 aros dourados, cabo barra 1×1×5, bloco de som redondo 3×3 | madeira `#B0743C`, ouro, `#8A5A2E` (bloco) | inclinado 30°, prestes a bater; linhas de impacto (3 ladrilhos amarelos) | 5×4×3 | 3/4 | resultado da votação, cabeçalho da sessão da ONU | P0 |
| `carimbo` | **Carimbo de borracha:** cabo de bulbo madeira, base 2×4 com borracha vermelha e brilho | madeira, `#F0303A`, cinza | marca de tinta "✓" no chão ao lado | 4×4×2 | 3/4 | decoração do balanço e do dossiê (os textos dos carimbos são SVG, §4.5) | P1 |
| `trofeu` | **Troféu de peças:** base tijolo 4×4 peça-preta com placa dourada "2050", haste redonda 2×2, taça cônica com 2 alças em arco | ouro, `#2B2747` | brilho-estrela de 4 pontas na borda da taça | 4×6×4 | 3/4 | pódio, vitória, placar (líder) | P0 |
| `medalha-ouro` / `-prata` / `-bronze` | Peça redonda 4×4 com aro e o número 1/2/3 em relevo + fita de 2 ladrilhos 1×4 em V | ouro / prata / bronze; fita `--mesa-topo` com listra amarela | leve giro de 15° (mostra a espessura) | 4×6×1 | F | pódio, selos, fim | P0 |
| `globo` | **Globo de mesa:** esfera de peças (como o mascote, sem rosto), meio-arco dourado, base redonda peça-preta | oceano 2, terra verde-folha `#7CCB4E`, areia `#F2D58A`, gelo | inclinado 23° (eixo da Terra) | 4×6×4 | 3/4 | botão Jogar, créditos, Missão 2050 | P0 |
| `termometro` | **Termômetro de peças:** tubo 1×1×8 transparente, coluna de tijolinhos vermelhos até 2/3, bulbo redondo 2×2 vermelho, marcas (ladrilhos 1×1) e placa "°C" | transparente, `#E8322B`, `#FFC93C` (marca 1,5), ladrilho | uma gotinha de suor (ladrilho redondo azul-claro) escorrendo | 2×9×2 | 3/4 | Cúpula do Clima, balanço (clima), manual | P0 |
| `relogio-juizo` ✔ | **Relógio do Juízo Final:** mostrador redondo 6×6 creme, 12 marcas em pinos índigo, setor dos últimos 5 minutos em ladrilhos vermelhos, ponteiros índigo (11:57), 2 sininhos amarelos no topo, pezinhos | ladrilho, tinta, `#D7263D`, amarelo | sininhos 1,3×; ponteiro com ponta amarela | 6×7×2 | F | HUD (ícone grande do indicador), plantão, colapso | P0 |
| `navio` | Modelo `navio-cargueiro` sobre placa 4×8 do oceano 2, com esteira de 3 peças redondas brancas | modelo + oceano | contêineres nas 6 cores de **categoria** (pastel), nunca de equipe | 4×3×8 | 3/4 | comércio, letreiro de economia | P1 |
| `aviao` | Modelo `aviao` com rastro de 3 ladrilhos redondos brancos decrescentes | branco, cinza, amarelo | inclinado 15° em curva | 6×3×6 | 3/4 | cúpulas, missão diplomática, comércio | P1 |
| `pomba` | Modelo `pomba` com ramo de oliveira, asas para cima, sobre nuvem de 3 peças redondas | branco, `#65BF82` (ramo) | olhinho com brilho | 4×4×3 | 3/4 | paz, acordo, cooperação, COP com sucesso | P0 |
| `aperto-maos` | **Aperto de mãos:** duas mãos-luva de boneco (blocos arredondados) com mangas em pastel lavanda e menta, apertando | pele `#F2C08E` e `#8D5A35`, lavanda, menta | 3 risquinhos de brilho em volta | 6×3×3 | 3/4 | aliança, negociação aceita, acordo comercial | P0 |
| `moedas` | Pilha de 5 moedas (modelo `moeda`) + 1 em pé | ouro | a de pé meio inclinada | 3×3×3 | 3/4 | economia, comércio, empréstimo, mercado no balanço | P0 |
| `caixa-alimentos` / `-energia` ✔ / `-minerais` / `-tecnologia` | **Caixote de peças** 3×2×3 (tijolos madeira `#C98B4E` com pinos) com etiqueta impressa do recurso na frente e o conteúdo aparecendo: espigas e folhas / bateria verde com raio amarelo / cristais lilás e turquesa / chip (ladrilho 2×2 verde-placa com pinos dourados) | madeira + cor do recurso | conteúdo transbordando 1 módulo acima da borda | 3×3×3 | 3/4 | recursos (painel da vez, negociação, mercado) | P0 |
| `pinos-cp` ✔ | **Capital Político:** peça redonda 2×2 **alta** (1 tijolo) amarela com pino grande + 2 peças redondas 1×1 soltas (alta para não parecer moeda) | amarelo, lado `#B98A00` | estrela de brilho branca de 4 pontas (é "o poder") | 4×2×3 | 3/4 | CP no painel, custos, ganho de CP | P0 |
| `megafone` | Cone amarelo + punho peça-preta + aro vermelho + 3 arcos de "som" em ladrilho | amarelo, `#2B2747`, vermelho | arcos de som saindo | 4×3×3 | 3/4 | quem convocou a reunião, protestos, apoio popular | P1 |
| `prancheta` | Placa 4×6 madeira, clipe cinza, folha creme com 3 linhas e 2 ✓ verdes | madeira, ladrilho, verde-ok | folha com canto dobrado | 4×6×1 | 3/4 | objetivos da missão, relatório, professor | P1 |
| `mapa-enrolado` | Rolo creme meio aberto mostrando terra verde e areia + fita vermelha | ladrilho, verde-folha, areia, vermelho | a ponta do rolo enrolando para cima | 6×2×3 | 3/4 | Manual (territórios), Laboratório de projeções | P1 |
| `manual` | **Livro "Manual do Diplomata":** capa anil impressa, lombada de tijolos, marcador amarelo, entreaberto 15° | `--mesa-topo`, ladrilho, amarelo | marcador saindo por cima | 5×1×6 | 3/4 | botão Manual, ajuda | P0 |
| `engrenagem` | Engrenagem de 8 dentes cinza-claro com pino central amarelo | `#D5DEEA`, amarelo | — | 4×1×4 | 3/4 | Ajustes, Para o professor | P1 |
| `cadeado` | Corpo 3×2×3 ouro com fechadura índigo e alça em arco cinza | ouro, tinta, cinza | alça levemente aberta na variante `cadeado-aberto` | 3×4×2 | 3/4 | bloqueado, sanção, papel guardado | P0 |
| `envelope-secreto` | Envelope creme fechado, selo de lacre vermelho (peça redonda com "?"), carimbo "CONFIDENCIAL" | ladrilho, vermelho-alerta, tinta | uma pontinha do papel saindo | 5×1×4 | 3/4 | missão secreta, papel, voto secreto | P0 |
| `lupa` | Aro peça-preta, vidro transparente com reflexo, cabo de madeira | `#2B2747`, transparente, madeira | aumento visível de uma "peça" atrás do vidro | 4×1×5 | 3/4 | "Você sabia?", combate à desinformação | P1 |
| `maleta` | Maleta diplomática peça-preta com cantos dourados, alça e 2 adesivos de viagem (globo, estrela) | `#2B2747`, ouro, adesivos pastel | adesivos tortos | 4×3×2 | 3/4 | Missão diplomática, negociar, lobby (acessório) | P0 |
| `pulpito` | Púlpito de tijolos creme com faixa `--mesa-topo`, microfone na haste e o **globo de peças** do jogo na frente (emblema próprio, **nunca** o da ONU) | ladrilho, anil, amarelo | o microfone torto | 4×5×3 | 3/4 | ONU, discurso | P1 |
| `binoculo` | 2 cilindros peça-preta com lentes azul-claro e faixa amarela | `#2B2747`, `#A8DBFF` | — | 3×2×3 | 3/4 | botão da missão secreta | P1 |
| `ampulheta` | 2 cones transparentes, areia amarela, molduras de madeira | transparente, amarelo, madeira | areia caindo (3 pinos em fila) | 3×5×3 | 3/4 | vez do computador, tempo | P1 |
| `dossie` | Pasta parda `#E8C77A` com aba, carimbo "CONFIDENCIAL" e retrato clipado (silhueta com "?") | `#E8C77A`, vermelho, ladrilho | clipe dourado | 5×1×6 | 3/4 | revelação de papel | P0 |
| `tablet-voto` | Tablet com moldura `--mesa-topo`, tela creme com 3 botões ✓ ✗ – (verde, vermelho, cinza) | anil, ladrilho, verde-ok, vermelho, cinza | dedo de boneco tocando o ✓ | 5×1×4 | 3/4 | votação, COP | P1 |
| `escudo` | Escudo de tijolos cinza-claro com borda amarela e uma pomba impressa | `#D5DEEA`, amarelo | — | 4×5×1 | F | Paz e Segurança (cabeçalho), ciberdefesa | P1 |
| `lampada` | Bulbo amarelo-claro emissivo `#FFF3A8` + rosca cinza | `#FFF3A8`, cinza | 4 raios de ladrilho | 3×4×3 | 3/4 | Ciência, "Por quê?", dica | P1 |
| `pilha-tijolos` | Pilha bagunçada de 7 tijolos 2×4 nas 6 cores de equipe + amarelo | equipes + amarelo | 1 tijolo caindo da pilha | 5×4×4 | 3/4 | carregando, "Começar", créditos | P0 |
| `bandeira-<forma>` (6) | Bandeira da potência: base 2×2, mastro creme, ponta amarela, pano na cor com a forma branca | cor da equipe | pano com ondulação de 2 dobras | 3×6×2 | 3/4 | lobby, placar, pódio, revelação | P0 |
| `caixa-ajuda` | Modelo `carga-ajuda` com coração impresso nas caixas (**nunca cruz vermelha**: é emblema protegido) | madeira `#C98B4E`, coração `#FF6B6B` | coração 1,2× | 4×3×4 | 3/4 | ajuda humanitária, doação | P0 |
| `tenda` | Modelo `tenda` azul-clara com coração pequeno e lampião | `#A8DBFF`, branco | lampião amarelo aceso | 4×3×3 | 3/4 | acolher refugiados (sempre com respeito, §6.9) | P1 |
| `satelite`, `foguete`, `turbina`, `painel-solar`, `fabrica`, `escola`, `hospital` | Modelos de `Modelos3D` sobre placa-base 4×4 | modelo | — | — | 3/4 | ilustração de categoria, manual, balanço | P1 |
| `selo-missao-2050` | Peça redonda 6×6 amarela com anel de 12 pinos e "MISSÃO 2050" impresso em Titan One | amarelo, tinta | leve giro 15° | 6×1×6 | F | início, objetivos, vitória cooperativa | P0 |

**Retratos dos bonecos** (placar, painel da vez, âncora, conselheiros, tablet de votação) não são do kit: saem de
`Cenas3D.retrato(avatar, { expressao, acao, tamanho })` com **a mesma receita de luz e contorno** (§7.7).

### 4.5 Kit (b) — ornamentos em SVG/CSS

Todos são peças vistas de frente: **face** (cor) + **lateral** embaixo (relevo de 0,6–1,6u) + **contorno índigo** (0,45u) +
**brilho** no topo (faixa de 0,4u com 50% de branco). Medidas em `u`.

| Ornamento | Forma e proporções | Cores | Como desenhar | Uso |
|---|---|---|---|---|
| **Cabeçalho "Jornal Mundial"** (jornal de brinquedo) | Ladrilho creme largo (altura 12u no histórico, 4,4u no letreiro). Em cima, a **faixa vermelha** (tijolo `--vermelho-alerta` de 6u com pinos) com "JORNAL MUNDIAL" em Titan One 4u **branco em letra-bolha**, entre dois mini-globos (ícone 🌍 4u) — o mesmo bloco do letreiro e do objeto `jornal`; embaixo, linha de edição "Edição 2030 · Mandato 2 de 6 · Preço: 1 pino" em Nunito 800 `--fs-min`, entre dois filetes índigo (0,35u e 0,15u, 0,4u de vão) | ladrilho, `--vermelho-alerta`, tinta, amarelo | papel com retícula sutil: `radial-gradient(rgba(26,20,51,.05) .18u, transparent .2u) 0 0/.9u .9u`; selo "EXTRA!" = estrela de 12 pontas amarela 7u com Titan One 2u, girada 12°, só para notícia grande | histórico de manchetes, balanço (manchetes), fim ("O mundo em 2050"), letreiro (versão compacta só com o bloco do nome) |
| **Vinheta "Plantão Global"** | Tela cheia por 1,6 s: listras diagonais −20° `--vermelho-alerta` / `#C81E2A` de 6u (deslizam ≤ 1 ciclo/s); no centro, o `globo` do kit girando dentro de **2 anéis de órbita** feitos de peças redondas 1×1 amarelas; letreiro "PLANTÃO" em Titan One 11u branco letra-bolha sobre um tijolo amarelo inclinado −4°, e "GLOBAL" logo abaixo num tijolo índigo | vermelho, amarelo, tinta, branco | entrada: listras varrem da esquerda (0,35 s), globo entra com `back.out(1.6)`, letreiro "bate" (carimbo, 0,28 s); **não imitar** vinheta de emissora real (nada de esfera azul metálica nem plim-plim) | abertura de cada evento |
| **Tarja do Plantão** (lower third) | Faixa de 74u × 16u ancorada embaixo: bloco vermelho "PLANTÃO" (Titan One 3,4u, branco) com pinos + chip "AO VIVO" (bolinha vermelha que pulsa 1 Hz + texto branco sobre índigo) + chip de lugar "📍 Sahel" (ladrilho) + **manchete** em Fredoka 700 `--fs-h2` sobre ladrilho + texto `--fs-corpo` na segunda linha | vermelho, tinta, ladrilho, amarelo (filete superior de 0,5u) | relógio do mandato "2030" à direita em Nunito 900 sobre índigo | Plantão (sobre o mapa) |
| **Moldura de painel (tablet)** | Face creme, **moldura colorida de 1,4u** (cor do contexto: equipe da vez, sessão da ONU, categoria) com contorno índigo 0,45u, raio externo 2,4u, lateral 1,2u, tela interna rebaixada (sombra interna 0,3u); **pinos** só na borda de cima da moldura, um a cada 3u, quando o painel é de ação | contexto + ladrilho + tinta | `.painel` (§5.3) | dilema, votação, balanço, negociação, ficha da nação |
| **Fita / faixa** | Faixa reta (altura 7u) com **pontas em cauda de andorinha** (entalhe de 1,2u) dobradas para trás (3u, na cor da lateral); texto em letra-bolha | cor do contexto | SVG de 3 partes (ponta-esq, meio esticável, ponta-dir) | nomes no pódio, "Também brilharam", "Missão cumprida", títulos de resultado |
| **Faixa de anúncio** (splash) | Um **tijolo comprido** de 70–150u com pinos grandes (passo 4,4u), lateral 1,6u, inclinado −3°; ícone do kit num soquete branco de 13u à esquerda; pré-título Fredoka `--fs-h2`, título Titan One `--fs-faixa`, subtítulo Fredoka `--fs-h2`, tudo em letra-bolha | cor do contexto | `.faixa.peca.pinos` (§5.3) | começo de mandato ("2030"), vez da equipe, reunião, balanço |
| **Selo** (conquista, destaque) | **Peça redonda** de 9u vista de cima: anel externo com **10 pinos**, miolo liso com ícone Fluent 5u ou número; fita em V de 2 ladrilhos embaixo (opcional) | pastel da categoria ou ouro/prata/bronze | círculos SVG + pinos (`<circle>` com brilho) | selos do IGI (Clima, Paz, Solidariedade, Desenvolvimento, Diplomacia, Conhecimento), "Destaque", "BNCC" |
| **Carimbos de texto** | Retângulo arredondado (raio 1u) com **borda dupla** (0,5u + vão 0,35u + 0,25u), Titan One 5–9u, girado −8°; "sombra de batida" (cópia 0,4u abaixo a 20%) | VOTOU `--verde-ok` · APROVADA `--verde-ok` com ✓ · REJEITADA `--vermelho-alerta` com ✕ · VETADA `#B0001A` com mão ✋ (ícone Fluent) · SEM MAIORIA `#8A94A6` · DECIDIDO tinta · CONFIDENCIAL vermelho | texto branco letra-bolha sobre a cor (estilo "placa-carimbo"), nunca textura suja de tinta | votação, dilema, dossiê, balanço |
| **Tíquete** | Ladrilho creme com **entalhes semicirculares** de 1,2u nas laterais e picote tracejado (índigo 25%, traço 0,6u) separando um canhoto colorido de 9u com ícone | ladrilho + cor do contexto | `mask` com `radial-gradient` nos entalhes | custo de ação no detalhe, proposta de troca (Negociar: "Você dá" ↔ "Você recebe"), convite da ONU, recompensa "+2 CP" |
| **Divisor** | Fileira de pinos (círculos de 1,1u com brilho) a cada 2,2u, na cor da lateral do painel | lateral do contexto | `background: radial-gradient(...) 0 50%/2.2u 100% repeat-x` | separar seções de painel e do Manual |
| **Balão de fala** | Ladrilho com contorno 0,45u, raio 1,8u, lateral 0,6u e **ponta** triangular de 2,4u; variante "pensamento" com 3 bolinhas | ladrilho, tinta | `.balao` (§5.3) | âncora, conselheiros, mascote (dicas), ficha do território |
| **Ponteiro "VEZ"** | Etiqueta-seta amarela de 6,2u × 3,8u com contorno índigo e "VEZ" em Nunito 900, presa na borda de cima do painel da vez (canto direito) | amarelo, tinta | SVG (`hud.html`, `.ponteiro`) | painel da vez, linha do placar, lobby |
| **Faixa de instrução** | Tijolo amarelo inclinado −2°, Nunito 900 `--fs-corpo`, ícone do alvo (📍) e botões "Ver lista" e "Cancelar (Esc)" | amarelo, tinta | — | escolher alvo no mapa |

### 4.6 Padrões de fundo

| Padrão | CSS de referência | Uso |
|---|---|---|
| **Pinos na mesa** | `radial-gradient(circle at 50% 42%, rgba(255,255,255,.07) 0 .5u, rgba(0,0,0,.10) .52u .7u, transparent .74u) 0 0 / 4u 4u` sobre o degradê da mesa | início, lobby, ajustes, fim, revelação (bem fraco: .04) |
| **Planta de montagem** | grade `linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px) 0 0/2u 2u` (e a vertical) + desenhos de tijolos "explodidos" em traço branco 2 px a 10% nos cantos + círculos numerados de passo (Titan One) | Manual, Para o professor, Laboratório de projeções |
| **Ondas de peças** | fileira de semicírculos `radial-gradient(circle at 50% 0, var(--oceano-1) 0 1.6u, transparent 1.65u) 0 0/3.2u 2u repeat-x` em 2 camadas desencontradas | rodapé de painéis do clima e do comércio, COP |
| **Raios** | `repeating-conic-gradient(from 0deg at 50% 60%, #FFD21F 0 6deg, #FFC400 6deg 12deg)`; gira no máximo 0,05 volta/s (RM: parado) | faixa do ano, vitória, pódio |
| **Zebra de alerta** | `repeating-linear-gradient(-45deg, #FFD21F 0 1u, #1A1433 1u 2u)` **parada** (fita que corre dispara fotossensibilidade) | crise, colapso iminente, reunião de emergência (rodapé) |

### 4.7 Gráficos

| Gráfico | Desenho | Regras |
|---|---|---|
| **Barras = pilhas de tijolos** | cada unidade é um tijolo 2×2 visto de frente (face + lateral 0,4u + brilho), empilhado com junta índigo de 0,15u; 2 pinos no tijolo do topo; base = placa cinza `--cinza-peca`; a forma da equipe na base da coluna; valor em Nunito 900 em cima | uma série por cor de equipe; valor sempre escrito; nada de eixo fino |
| **Linhas com pinos** | linha de 0,6u na cor da equipe com contorno índigo de 0,25u (dois traços sobrepostos); pontos de dado = pinos (círculo 1,2u com traço índigo e brilho branco); a ponta de cada linha = forma da equipe de 2,2u | séries inativas em `#C9CED6` com 0,4u; grade tracejada índigo a 12%; destaque de uma série por vez (as outras em cinza) |
| **Cascata de causas** (balanço) | barras horizontais a partir de um eixo central: "+" para a direita em tijolos `--ganho`, "−" para a esquerda em `--perda`, 1 tijolinho por ponto; rótulo à esquerda ("+4 Sanções: EUA → Rússia") | até 4 barras; a maior em destaque |
| **Emissões** | colunas de **tijolos de CO<sub>2</sub>** (`#2B2747` com "CO₂" impresso em branco) por potência; alterna total / por pessoa / acumulado histórico | nunca culpar sozinho: os três números juntos |
| **Matriz energética** | fileira de 10 peças: limpa = `--verde-ok` com raio impresso; fóssil = grafite `#4A4F5C` com chaminé | proporção legível de longe |
| **Proibidos** | pizza/rosca para comparar potências; escala vermelho→verde; 3D de planilha; eixo sem rótulo | — |

### 4.8 Medidores

| Medidor | Desenho (SVG/CSS) | Animação |
|---|---|---|
| **Barra de tijolinhos** (`.seg`) | trilho `--placa-escura` com borda índigo 0,35u e raio 0,7u; células = tijolinhos 1×1 vistos de cima (quadrado de cantos 2,2/10 com pino de brilho radial); cheias na cor da faixa; vazias `--encaixe`; marcas de limiar = entalhe amarelo de 0,3u acima do trilho | enche com mola leve (`cubic-bezier(.3,1.4,.5,1)` 0,45 s) |
| **Termômetro de tijolos** | 13 tijolos 1,4u com junta de 0,2u, deitado; bulbo redondo de 3u à esquerda; bandeirinha "1,5" (Paris) e marcas "2,0" e "✕" | tijolo novo cai e assenta (§9); RM: aparece |
| **Relógio do Juízo Final** | mostrador creme (Ø 7,2u no HUD, sem texto; 18u no balanço, com "MEIA-NOITE" no topo), aro índigo 0,4u; arco de 270° só com os **últimos 5 minutos**; 10 marcas (a cada 30 s); zona de 60 s em `#FF5A1F`, últimos 15 s em `#D7263D`; ponteiro índigo com pino central amarelo | ponteiro anda com `elastic.out(1, .5)` 0,6 s + `tique` |
| **Ponteiro semicircular** (energia) | arco de 180° em 3 zonas (menta / ladrilho-2 / pêssego) com marcas 35, 50, 70; ponteiro índigo | `elastic.out(1, .5)` 0,6 s |
| **Anel de progresso** (missão secreta) | 8 segmentos de peça curva (arcos de 40° com 5° de vão), vazios `--encaixe`, cheios amarelos | segmento acende com "pop" |
| **Encaixes** (deslocados, liderança continental) | fileira de encaixes redondos vazios (anel `--encaixe`) que recebem pinos coloridos | pino entra com quique curto |

---

## 5. Componentes de interface e layout do HUD

**Linguagem: "peças de montar" (proposta A refinada de `ativos/fontes_ui.md`).** Toda peça de interface é plástico visto de
frente: **face** + **lateral** embaixo + **contorno índigo** + **brilho** no topo. **Pinos só em peças de ação** (botões, aba
ativa, painel da vez, ano, faixas): o pino significa "dá para apertar ou é destaque". Texto em **ladrilho creme**. Barras são
**tijolinhos 1×1 vistos de cima**. Ícones vão em **soquete redondo** (placa 2×2).
Base de implementação: `ativos/ui-demo/componentes.css` (Fundação copia para `css/base.css`) **com as mudanças desta seção**.
Prova: `arte/maquetes/hud.html` → `maquetes/capturas/hud-1920.png` e `hud-1366.png`.

### 5.1 Tokens (`css/base.css`, Fundação)

```css
:root {
  --u: min(1vh, .5625vw);                              /* 1% da altura do palco 16:9 */
  --f-marca: 'Titan One', 'Fredoka', sans-serif;  --f-titulo: 'Fredoka', 'Nunito', sans-serif;  --f-texto: 'Nunito', sans-serif;
  --fs-mega: calc(14 * var(--u)); --fs-faixa: calc(11 * var(--u)); --fs-h1: calc(6.5 * var(--u)); --fs-h2: calc(4.4 * var(--u));
  --fs-cartao: calc(3.4 * var(--u)); --fs-corpo: calc(2.8 * var(--u)); --fs-min: max(18px, calc(2.2 * var(--u)));
  /* mesa e véus */
  --mesa-topo: #3550C8; --mesa-meio: #22339A; --mesa-base: #141F66;
  --mesa: radial-gradient(60% 60% at 50% 52%, rgb(255 255 255 / .16), transparent 70%),
          linear-gradient(var(--mesa-topo), var(--mesa-meio) 55%, var(--mesa-base));
  --noite: radial-gradient(70% 60% at 50% 88%, #2A3C9A, #070A24 78%);
  --veu: rgb(14 20 64 / .45);
  /* plástico da interface */
  --tinta: #1A1433; --tinta-suave: #4A4570; --ladrilho: #FFF9EC; --ladrilho-2: #F3EAD6; --placa-escura: #2E2752; --encaixe: #4B4475;
  --amarelo: #FFD21F; --amarelo-lado: #B98A00; --verde-ok: #3CD46A; --verde-ok-lado: #1F9A47;
  --vermelho-alerta: #F0303A; --vermelho-alerta-lado: #A3141F; --cinza-peca: #E3E9F4; --cinza-peca-lado: #98A6C2;
  --ganho: #5BE37D; --perda: #FF6B6B; --bom: #2FCB62; --medio: #FFC21A; --risco: #FF8A1F; --critico: #F0303A;
  /* equipes: cor, sombra (lado), clara (xadrez) */
  --brasil: #27B263; --brasil-lado: #0D6E4E; --brasil-clara: #73CD9A;   --eua: #0A32B4; --eua-lado: #0B2384; --eua-clara: #3657C2;
  --china: #D0180E; --china-lado: #81001C; --china-clara: #DB4F48;      --ue: #9645EE; --ue-lado: #651C94; --ue-clara: #AD6EF2;
  --india: #FF9C0A; --india-lado: #9E3400; --india-clara: #FFC267;      --russia: #F2248F; --russia-lado: #960773; --russia-clara: #F66EB5;
  /* categorias (pastel) */
  --cat-diplomacia: #DCCFFF; --cat-diplomacia-lado: #8F79CC;   --cat-economia: #FFE08A; --cat-economia-lado: #CCA742;
  --cat-natureza: #B3EFC6; --cat-natureza-lado: #65BF82;       --cat-seguranca: #FFC4AE; --cat-seguranca-lado: #CC7C5E;
  --cat-pessoas: #FFCAE6; --cat-pessoas-lado: #CC75A3;         --cat-ciencia: #99CDF8; --cat-ciencia-lado: #4F90C6;
  /* relevo e raios */
  --b: calc(.45 * var(--u)); --lado: calc(1 * var(--u)); --raio: calc(1.4 * var(--u));
  --sombra-solta: 0 calc(1.2 * var(--u)) calc(2.4 * var(--u)) rgb(14 20 64 / .35);  /* peça flutuando sobre o mapa */
}
[data-equipe="brasil"] { --cor: var(--brasil); --cor-lado: var(--brasil-lado); --cor-clara: var(--brasil-clara); }  /* idem para as 6 */
.cat-diplomacia { --cor: var(--cat-diplomacia); --cor-lado: var(--cat-diplomacia-lado); }                              /* idem para as 6 */
```

**Mudanças em relação a `componentes.css`:** (1) cores pelos tokens acima (saem `#3CD46A` como principal, `#22B14C` e o ciano
da Rússia); (2) **o botão principal é amarelo** (`.btn-principal`), o verde vira `.btn-confirmar` (✓ em diálogos);
(3) placas de equipe do placar passam a ser **ladrilho com aba colorida** (§5.8), porque azul e roxo cheios somem na mesa
anil; (4) `--sombra-solta` em tudo o que flutua sobre o mapa; (5) foco com anel duplo (§5.2); (6) piso do texto em
`--fs-min`.

### 5.2 Botões (tijolos com pinos)

| Variante | Face / lado | Texto | Altura | Uso |
|---|---|---|---|---|
| `.btn-principal` | `--amarelo` / `--amarelo-lado` | índigo, Fredoka 700 `--fs-cartao` | 7,4u (80 / 57 px) | o que **avança**: Jogar, Começar!, Encerrar vez, Continuar, Confirmar, PRONTO! |
| `.btn-confirmar` | `--verde-ok` / `--verde-ok-lado` | letra-bolha + ✓ (SVG) | 6,6u | ✓ dentro de escolhas: votar Sim, aceitar troca |
| `.btn-perigo` | `--vermelho-alerta` / lado | letra-bolha | 6,6u | Vetar, Sair sem salvar, Recusar |
| `.btn-neutro` | `--ladrilho` / lado automático | índigo | 6,6u | Cancelar, Voltar, Por quê?, Ver lista |
| `.btn-mini` | qualquer | `--fs-min` | 5,8u (≥ 44 px em 768p) | ações secundárias em cartões |
| `.btn-ic` (redondo/quadrado) | ladrilho | ícone SVG índigo 3u | 6,4u × 6,4u | pausa, som, menu, zoom, fechar ✕ |

- **Forma:** raio 1,2u, contorno `--b` (0,45u), lateral 1u (0,7u no mini), pinos na borda de cima (passo 2,6u).
- **Estados:** passar o mouse → `filter: brightness(1.07) saturate(1.06)` e sobe 0,2u (120 ms); apertado → desce 0,7u e a
  lateral vai a 0,3u (70 ms, `power2.out`), solta com `back.out(3)` em 160 ms + som `clique`; **foco** (teclado) →
  `outline: .55u solid var(--amarelo); outline-offset: .45u` + `box-shadow` de 0,25u índigo por fora do contorno amarelo
  (o anel duplo aparece até sobre o botão amarelo); desativado → `grayscale(.85)`, opacidade .55, cursor proibido e, quando
  for falta de recurso, cadeado + motivo escrito.
- Rótulo de até 18 caracteres, verbo no infinitivo ou imperativo curto ("Encerrar vez", "Votar", "Escolher").
- **Alvo de toque:** ≥ 6,6u (71 px em 1080p) para o que o aluno toca na lousa; ≥ 5,8u para secundários.

### 5.3 Peças-base (resumo do CSS de referência)

```css
.peca { /* não herda cor nem relevo da peça de fora */
  --cor: initial; --cor-lado: initial; --face: var(--cor, var(--ladrilho));
  --face-lado: var(--cor-lado, color-mix(in oklab, var(--face) 64%, var(--tinta)));
  position: relative; color: var(--tinta); background-color: var(--face);
  background-image: linear-gradient(color-mix(in oklab, var(--face), #fff 24%), var(--face) 58%);
  border: var(--b) solid var(--tinta); border-radius: var(--raio);
  box-shadow: inset 0 calc(.4 * var(--u)) 0 rgb(255 255 255 / .5), inset 0 calc(-.35 * var(--u)) 0 rgb(0 0 0 / .08),
              0 var(--lado) 0 calc(-1 * var(--b)) var(--face-lado), 0 var(--lado) 0 0 var(--tinta);
}
.flutua { box-shadow: /* os 4 de cima */ ..., var(--sombra-solta); }       /* painel, balão e aviso sobre o mapa */
.pinos::before { /* pinos SVG mascarados, na cor da face: ver componentes.css (--pino-forma, --pino-detalhe) */ }
.letra-bolha { color: #fff; -webkit-text-stroke: .17em var(--tinta); paint-order: stroke fill; letter-spacing: .02em; }
.soquete { /* encaixe redondo para ícone: radial branco → --soquete; contorno --b; sombra 0 .35u 0 --tinta */ }
.painel { --lado: calc(1.2 * var(--u)); --raio: calc(2.4 * var(--u)); padding: calc(1.4 * var(--u)); background: var(--cor, var(--amarelo)); }
.painel > .tela { background: var(--ladrilho); border: var(--b) solid var(--tinta); border-radius: calc(1.2 * var(--u));
  box-shadow: inset 0 calc(.3 * var(--u)) 0 rgb(26 20 51 / .18); padding: calc(2 * var(--u)); }
```

### 5.4 Barra de ações (tijolos de ação)

```
 ┌──┬──┬──┬──┐   ← 4 pinos (passo 3,1u) na cor da face
 │   ╭────╮    │  ← soquete 4,4u (miolo na cor "lado" clareada 40%) com o ícone Fluent a 78%
 │   │ 🌳 │    │
 │   ╰────╯    │
 │  Desmata-   │  ← nome curto (Fredoka 700, --fs-min), até 2 linhas de 10 caracteres
 │  mento zero │
 │    ●●  💎1  │  ← bandeja de custo rebaixada: pinos amarelos de CP (1,9u) + ícone e número de recurso
 └─────────────┘  ← lateral 1u na cor "lado" da categoria
```
- **Tijolo sorteado** (6): **15,4u × 14,2u** (166 × 153 px em 1080p; 118 × 109 em 768p), corpo no **pastel da categoria**,
  lado explícito (§2.8), contorno 0,45u, raio 1,2u, vão de 0,8u. O piso de 18 px em 768p não cabe em tijolo mais estreito:
  por isso o nome tem **no máximo 2 linhas de 10 caracteres** (campo `curto`, §12).
- **Ações fixas** (Missão diplomática, Negociar): **dois meios-tijolos empilhados** de 15,4u × 6,7u à esquerda, corpo
  `--ladrilho`, soquete 4,2u + **uma palavra** ("Missão", "Negociar") e o custo num pino amarelo de 2,8u no canto ("1");
  separados das sorteadas por um **divisor de pinos**. **Trocar ações** = `.btn-ic` redondo (setas SVG) + pílula "1 CP".
- **Estados:** normal; **passar o mouse** sobe 0,5u (120 ms); **selecionado** sobe 1,2u, ganha aro amarelo 0,55u e brilho
  `0 0 0 1.6u rgb(255 210 31 / .35)`, o ícone dá um quique (`elastic.out(1,.5)` 0,5 s) e abre a **ficha da ação**;
  **bloqueado** = corpo `--cinza-peca` com listras 45°, **cadeado** no canto do soquete e, na bandeja, o recurso que falta
  em pílula vermelha com "!" (o motivo por extenso — "Falta 1 de Tecnologia" — aparece na ficha e no `aria-label`);
  **usado** = encaixa para baixo (lado 0,3u), opacidade .45 e selo ✓ verde.
- **Ficha da ação** (temporária; `.painel` na cor da categoria + `.flutua`; 104u de largura, **ancorada pela base** 0,6u
  acima dos pinos da barra — `bottom: 21.8u` — e cresce para cima, nunca cobre a barra): **linha 1** = ícone 5,4u + nome
  completo Fredoka 4u + chip da categoria + tíquete do custo + botões **Confirmar** (ou "Escolher alvo", `.btn-principal`)
  e **Cancelar** (`.btn-neutro`); **linha 2** = efeitos em chips (ícone + palavra + "+5"/"−1" na cor ganho/perda) e o
  **valor-fantasma** em chip tracejado amarelo ("Emissões −0,4 Gt"); **linha 3** = "**Por quê?** …" (Nunito 800
  `--fs-min`, ≤ 2 linhas). Ação com risco: faixa vermelha em letra-bolha "Isso adianta o Relógio em 12 segundos!".
  Prova: `maquetes/capturas/hud-ficha-1920.png` e `hud-ficha-1366.png`.
- **Escolha de alvo:** a ficha encolhe para a **faixa de instrução** amarela no mesmo lugar ("Clique num território que
  brilha · Ver lista · Cancelar (Esc)"); os alvos válidos brilham no mapa (§6.11) e "Ver lista" abre a alternativa acessível
  (lista de botões com nome, continente e motivo).

### 5.5 Painéis (estilo tablet), abas e balões

- **Painel:** moldura colorida 1,4u (cor do contexto) + tela creme rebaixada; raio externo 2,4u; lateral 1,2u; pinos na borda
  de cima quando é painel de ação. Tamanhos: **P** 64u de largura (avisos com escolha, troca), **M** 110u × até 80u
  (negociar, ficha da nação, pausa), **G** 150u × até 86u (dilema, votação, balanço). Cabeçalho: objeto do kit de 8–10u
  **vazando** a moldura no canto superior esquerdo (−3u), título Fredoka `--fs-h2`, botão ✕ (`.btn-ic`) no canto direito.
  Entra com `abrirPainel()` (sobe 6u e escala .94 → 1, 0,42 s `back.out(1.4)`; sai 0,22 s `power2.in`) sobre o `--veu`.
- **Abas:** inativa `--cinza-peca`, 0,4u mais baixa, texto `--tinta-suave`; ativa `--amarelo` com pinos, lateral 1u, texto
  índigo; altura 5,2u, Fredoka `--fs-corpo`; `role="tablist"`, setas do teclado trocam.
- **Balão** (ficha, dica, fala): ladrilho, contorno 0,45u, raio 1,6u, lateral 0,8u, ponta de 3u em cima (padrão) ou embaixo
  (`data-ponta="baixo"` perto da borda de baixo); título Fredoka `--fs-cartao`.
- **Aviso (toast):** `.aviso.peca` verde (bom), vermelho (ruim) ou ladrilho (neutro), letra-bolha Fredoka `--fs-cartao`,
  ícone Fluent 4u à esquerda; no máximo 2 empilhados; tempo de tela = 1,2 s + caracteres ÷ 15.

### 5.6 HUD do mundo (barra do topo)

- **Ano:** tijolo amarelo 31,1u × 9,4u com pinos (mesma largura da coluna): "2030" em Titan One 4,2u índigo + à direita,
  em duas linhas, "Mandato 2/6" (Nunito 900 `--fs-min`, `#5A4300`) e o **estado do mundo em palavras** com bolinha de
  estado ("! Em alerta"; o pior estado entre os 6 indicadores: Calmo ✓ · Em alerta ! · Em crise !! · À beira do colapso ✕).
- **Peça de indicador** (6 peças de **23u × 9,4u**, vão 0,85u): ladrilho com lateral 0,8u; à esquerda o soquete de 4,6u com
  o ícone Fluent ocupando as duas primeiras linhas; **linha 1** = nome (Fredoka 700 `--fs-min`); **linha 2** = **valor**
  (Nunito 900 3,3u, unidade a 55%: "1,62 °C", "120 mi"); **linha 3** = **medidor** de largura total (§4.8) com entalhes
  amarelos nos limiares; **estado** = tarja de 0,75u na borda esquerda na cor da faixa + selo redondo de 2,6u no canto
  superior direito ("✓", "!", "!!", "✕"); risco ou crise → fita zebrada de 0,7u na borda de baixo.
  **Relógio do Juízo Final:** o mostrador de 7,2u ocupa o lugar do ícone e do medidor; ao lado, "Relógio" e "84 s".
- **Mudou:** anel amarelo de 0,5u que some em 600 ms + número que salta + chip "+4"/"−2" por 2 s embaixo da peça + som
  `subir`/`descer`. **Prévia** (ação selecionada): chip tracejado amarelo "72 → 76" embaixo da peça; efeito com chance:
  "talvez +4 (60%)".
- **Clique na peça:** balão com o histórico (linha com pinos por mandato) e "Por que mudou" do último balanço.
- **Menu** (pausa, som, ajuda/Manual): 3 `.btn-ic` redondos no **alto da coluna direita**, acima dos controles do mapa.

### 5.7 Mapa: controles e rótulos

- **Controles:** 4 `.btn-ic` empilhados na borda direita (aproximar, afastar, visão geral, lentes).
- **Rótulos:** casa de potência = Fredoka 700 3u em letra-bolha com a **forma** de 2,6u à esquerda do nome, logo **abaixo da
  base do boneco**; neutro = 2,4u, só quando importa (território do evento, alvo válido, em foco, sob o mouse). Nome com
  acento, nunca id; nomes longos em 2 linhas de ≤ 14 letras (campo `curto`). **Prioridade** quando se sobrepõem: casa >
  evento/alvo > parceiro > resto; o de menor prioridade some (opacidade 0 em 0,2 s) se o retângulo dele encostar (com folga
  de 0,6u) no de maior prioridade. Prova do problema: `mapa-anil2.png` ("Península Arábica" × "Índia").

### 5.8 Placar + painel da equipe da vez (coluna esquerda)

A coluna esquerda (31,1u de largura, do topo 14,6u até 82u) junta o **placar** (6 linhas) e o **painel da vez**: a linha da
equipe que joga **se expande** em painel e vai para o alto. Assim o painel da vez não tapa o mapa à direita (Austrália e
Pacífico). Prova: `maquetes/capturas/hud-zoom-coluna.png`.

- **Linha recolhida** (31,1u × 6,4u, **ladrilho**, lateral 0,7u, vão 0,9u): **aba** de 7,6u na cor da equipe à esquerda com
  o **retrato-rosto** do boneco (5,2u, §7.7) num soquete com aro índigo e anel interno na cor; a **forma** de 2,4u no canto do
  retrato; nome curto (Brasil, EUA, China, UE, Índia, Rússia) em Fredoka 700 `--fs-corpo`; embaixo, "Equipe Verde" ou
  "Computador" em Nunito 800 `--fs-min` (`--tinta-suave`); à direita, **IGI** em Nunito 900 2,8u numa pílula branca com
  contorno; posição 1º–3º com medalhinha (ouro, prata, bronze) no canto superior esquerdo. Cooperativo: no lugar do IGI, a
  contribuição para as Metas 2050. **Linhas de cor cheia ficam proibidas**: azul e roxo cheios somem na mesa anil e o texto
  secundário fica ilegível.
- **Painel da vez** (31,1u × ~31u, `.painel` com moldura na cor da equipe e pinos): ponteiro amarelo **"VEZ"** no alto à
  direita, medalha de posição no canto; cabeçalho na cor com retrato-rosto 6,8u, "Vez do Brasil" em letra-bolha Fredoka
  3,2u e "Equipe Verde"; tela creme com: **Capital Político** = pílula amarela "5 CP" + até 8 **pinos** de 2,1u vistos de
  cima (cheio com brilho; vazio = encaixe); **recursos** = 4 contadores (ícone 2,6u + número Nunito 900 2,5u) + botão
  **binóculo** da missão secreta (segurar 2 s para ver; "Só a Equipe Verde olha!"); **indicadores da nação** = 5 células
  (ícone 💰 ❤️ 🌳 🛡️ 🗳️ de 2,7u **em cima** do número Nunito 900 2,6u; < 30 ganha fundo pêssego e selo "!"; depois do
  balanço, seta ▲▼).
- **Computador:** a linha diz "Computador" e o retrato é o boneco de **cabeça de monitor** (§7.5); nada de emoji.
- **Reordenar** depois do balanço: FLIP, 0,6 s `power2.inOut`, 40 ms entre linhas.

### 5.9 Doca (barra de ações + Encerrar vez), avisos e letreiro

- **Barra de ações** embaixo, a partir de x 34,1u: coluna das 2 fixas + divisor + 6 sorteadas + Trocar (§5.4).
  **Encerrar vez** à direita: `.btn-principal` de 17,6u × 12,6u com pinos, "Encerrar vez" em Fredoka 700 `--fs-cartao`
  (2 linhas) e a dica "Enter" em Nunito 900 1,7u; anel de cronômetro opcional em volta. Prova: `hud-zoom-doca.png`.
- **Vez do computador:** a barra vira uma faixa ladrilho "A China está decidindo…" com `ampulheta` do kit, a ação aparecendo
  como tijolo que "voa" para o mapa, e o botão "Pular" (`.btn-neutro`).
- **Avisos (toasts):** centralizados **sobre o oceano do sul, logo acima da doca** (topo em 71,4u), nunca no alto: o alto do
  mapa tem o Ártico, a Europa e os bonecos de UE e Rússia.
- **Letreiro do Jornal Mundial** (largura total, 4,44u): fundo `--placa-escura`, filete superior amarelo 0,45u; à esquerda o
  bloco **"JORNAL MUNDIAL"** (vermelho-alerta, Titan One 2,2u branco, borda direita inclinada); selo da categoria (ícone em
  soquete pastel de 3,3u) + manchete em Nunito 800 `--fs-corpo` branca; à direita "2030 · 3/7" (Nunito 900 `--fs-min`,
  `#BFC7D5`) + "Ver todas" (ladrilho). **Não rola:** troca a cada 7 s com virada vertical de 0,3 s; manchete nova chega com
  brilho de 0,6 s e som `virar`. RM: troca seca.

### 5.10 Telejornal do Plantão Global

Sequência (Plantao.noticia): **vinheta** (1,6 s, §4.5) → **bancada**: a câmera voa até o lugar (1,1 s) e o cartão ocupa só a
**metade de baixo** (y 52–92u), para o lugar continuar visível → **efeito no mapa** enquanto o cartão está aberto →
**números saltam** → "Você sabia?" → escolha (se houver) → fecha.
- **Cartão:** à esquerda, o **âncora** (retrato de boneco 26u: terno grafite `#4A4F5C`, gravata amarela, fone de ouvido)
  atrás de uma **bancada de tijolos** creme com faixa vermelha e o adesivo "PG"; à direita, a **tarja** (§4.5) com chip
  "PLANTÃO", chip "AO VIVO", chip de lugar, **manchete** em Fredoka `--fs-h2` (≤ 70 caracteres) e o texto em Nunito
  `--fs-corpo`; embaixo, o quadro **"Você sabia?"** (`--ladrilho-2`, ícone `lampada`, ≤ 160 caracteres).
- **Repórter de campo** (opcional por evento): retrato com `microfone` do kit num balão sobre o lugar do evento.
- **Escolha do evento** (`decisao`): as opções aparecem como os cartões de opção do dilema (§5.11), uma equipe por vez,
  escondido como na votação; doação: tíquetes "Doar 1 / 2 / 3" com a `caixa-ajuda`.
- **Mundo em crise** (2 notícias): a vinheta mostra "MUNDO EM CRISE: 2 notícias neste mandato, porque a tensão passou de 80".

### 5.11 Tela do dilema de governo ("Gabinete")

**Não é prova.** É uma reunião de gabinete: a situação na esquerda, os **conselheiros** (bonecos com o chapéu da
categoria) apresentando cada caminho à direita. Nada de letras A/B/C, nada de "certo/errado", nada de cronômetro
apertado por padrão.

```
┌──────────── painel G (moldura na cor da equipe da vez, pinos) ─────────────────────────────────────────┐
│ [selo da equipe] GABINETE DO BRASIL · decisão do mandato                                       [✕]     │
│┌── situação (34%) ───────────┐ ┌─ opção 1 (pastel da categoria) ┐ ┌─ opção 2 ─────────┐ ┌─ opção 3 ─┐ │
││ [ícone do dilema 8u]        │ │   (retrato do conselheiro 14u    │ │  (conselheira…)    │ │  (…)      │ │
││ Título (Fredoka --fs-h2)    │ │    vazando 4u acima do cartão)   │ │                    │ │           │ │
││ Texto (Nunito --fs-corpo,   │ │ Conselheira de Natureza          │ │                    │ │           │ │
││  ≤ 220 caracteres)          │ │ ╭ balão: "Proteger a floresta e  │ │                    │ │           │ │
││ [📍 Bacia do Nilo]          │ │ │  pagar mais caro pela energia" │ │                    │ │           │ │
││ [Tema: Geopolítica da água] │ │ Pode mudar: [🌳 ▲] [💰 ▼]         │ │                    │ │           │ │
│└─────────────────────────────┘ │ [ Escolher ] (btn-principal)     │ │  [ Escolher ]      │ │[Escolher] │ │
│                                 └──────────────────────────────────┘ └────────────────────┘ └───────────┘ │
│ 💬 Não há resposta certa: cada caminho tem ganhos e custos. Conversem antes de escolher!   (1, 2, 3)  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Cartão de opção:** corpo no pastel da categoria (`.peca.cat-*`), contorno 0,45u, raio 1,8u; o **retrato do conselheiro**
  (`Cenas3D.retrato`, camisa no pastel da categoria, chapéu da categoria, expressão "pensativo"/"determinado") sai 4u para
  fora da borda de cima; cargo em Fredoka `--fs-min` ("Conselheira de Natureza"); **balão** ladrilho com o texto da opção em
  Nunito 900 `--fs-corpo` (≤ 90 caracteres); "Pode mudar:" com 2–3 chips do `resumo` (ícone + ▲▼, sem número, sem "bom/ruim");
  botão "Escolher" (`data-teste="opcao-<n>"`, teclas 1–3).
- **Ao escolher:** o cartão escolhido recebe o carimbo **"DECIDIDO"** (índigo, girado −8°) e desliza para o centro; os outros
  vão a 40% e descem; o painel fecha (0,3 s) e **o efeito acontece no mapa e no HUD** (números saltam com o porquê); por fim,
  um balão do conselheiro com o `porque` (≤ 2 linhas) e o selo pastel "Conceito: …" ficam 4 s ou até o clique.
- **Computador** (`Dilemas.mostrarIA`): aviso-cartão de 2,5 s "A China decidiu: …" com o retrato do conselheiro.

### 5.12 Votação na ONU (estilo reunião de emergência)

Adaptação de `arte/among_us_gartic.md` §4.1, com estas regras de arte:
- **Convocação:** fundo vinho-escuro com 14 linhas de velocidade horizontais (`#FF5A5A` sobre `#2A0008` na emergência;
  `#6FB6FF` sobre `#06122E` na geral); **faixa branca** de 17u, inclinada −3°, com "REUNIÃO NA ONU!" em Titan One `--fs-faixa`
  (vermelho-alerta na emergência, `--mesa-topo` na geral) e a pauta embaixo; ícone = `martelo` do kit batendo no `pulpito`
  (impacto aos 0,55 s com tremida e raios amarelos); rodapé de emergência = zebra parada. 2,4 s, pulável.
- **Painel G** com moldura na cor da sessão (geral `--mesa-topo`, emergência `--vermelho-alerta`): cabeçalho com `martelo`
  (9u), "RESOLUÇÃO 3 · 2031", pauta em letra-bolha, "Se aprovar: … · Se rejeitar: …" com ícones e selo "recomendação" ou
  "obrigatória"; grade 3×2 de **cartões de delegação** (ladrilho, aba de 1,6u na cor da equipe, retrato de 14u **vazando** 3u
  para fora no canto superior esquerdo, nome em Fredoka `--fs-cartao`, selo "P5" de escudo para quem tem veto, `megafone`
  para quem convocou, chip "Computador").
- **Voto secreto:** tela "Vez de votar: Delegação do Brasil" com a `urna` do kit; botões quadrados de 9u com ícone + palavra:
  ✓ Sim (`--verde-ok`), ✕ Não (`--vermelho-alerta`), – Abster (`--cinza-peca`), ✋ Vetar (`#B0001A`, só P5); a tela só
  responde com o carimbo **VOTOU** (mesmo som e animação para qualquer voto).
- **Revelação:** cartões encolhem para uma faixa no topo; surgem 3 bases de tijolo cinza com pinos (SIM, NÃO, ABSTENÇÃO); cada
  voto vira um **tijolinho 1×1 na cor da delegação com a forma impressa**, que voa em arco e encaixa (0,42 s, 0,18 s entre
  votos, tom subindo); contador "pop" em Nunito 900 6u; 0,5 s de pausa; **carimbo** APROVADA / REJEITADA / VETADA / SEM MAIORIA
  (§4.5) com tremida; consequência datilografada (38 ms por letra) e a câmera voa até o mapa.

### 5.13 Revelação de papel secreto (e da missão)

- Fundo `--noite` + padrão de pinos a 4%; **"Seu papel é"** (Fredoka `--fs-h2`, branco 85%) + a palavra em Titan One
  `--fs-mega` com contorno índigo e brilho da cor do papel (DIPLOMATA `#8FE3FF`, INFILTRADO `#FF6B6B`); palco: o boneco da
  equipe sobre pedestal de tijolos com **holofote de baixo** (cone na cor do papel a 35%); embaixo, o `dossie` com o objetivo
  em Nunito `--fs-corpo`.
- **Protocolo de privacidade:** "Delegação do Brasil, venha até o computador. Turma: olhos no professor!" → botão
  **"Segure para ver"** (barra de espaço ou toque mantido) com anel de progresso de 2 s → ao soltar, cortina de 0,5 s e
  "Papel guardado 🔒" (`cadeado` do kit). **Mesmo som, mesma duração, mesmo layout para qualquer papel.**

### 5.14 Balanço do mandato

Passos por clique, Espaço, → ou PageDown (passador de slides), pontos de progresso no topo, "Pular balanço" discreto:
**0. Faixa** "BALANÇO 2026–2029" (Titan One, 1,2 s) → **1. Sobrevoo** (até 4 lugares, 2,5 s cada, legenda num cartão baixo)
→ **2. Mundo** (grade 3×2 de cartões 46u × 23u: ícone + nome, **"72 → 78" em Nunito 900 5,2u**, chip de estado se mudou,
**cascata** de até 4 causas; o que mais mudou ganha borda amarela e selo "Destaque") → **3. Clima** (termômetro grande,
tijolos de CO<sub>2</sub> caindo das casas, emissões total / por pessoa / histórico) → **4. Nações** (uma linha por potência:
IGI antes → depois, ▲▼ de posição, 5 chips, parceiros ganhos e perdidos) → **5. Manchetes** (página do Jornal Mundial com 3
manchetes + "Situação crítica em…" + Metas 2050 no cooperativo) → **6. Para conversar** (o mascote com uma pergunta para a
turma gerada pelo maior movimento e o que vem no próximo mandato).
Cartão central 148u × 80u sobre o mapa com no máximo 45% de véu (sem véu no sobrevoo).

### 5.15 Pódio 3D e fim

- **Pódio** (`Cenas3D.podio`): mesa anil com padrão de raios; colunas de tijolos na cor de cada equipe com tampa clara e o
  número da posição em Titan One impresso; 3º sobe aos 0,8 s, 2º aos 3,0 s, 1º aos 6,5 s (com rufar e luz crescendo); o boneco
  cai sobre a coluna e comemora; nomes em **fitas** (§4.5); IGI conta com `expo.out`; **chuva de tijolinhos** nas cores do
  pódio por 3 s; 4º–6º entram como "Também brilharam" (linhas ladrilho, sem a palavra "último").
- **Vitória cooperativa:** "O MUNDO VENCEU A CRISE!" com os 6 bonecos em fila comemorando. **Colapso:** "COLAPSO GLOBAL" em
  cinza `#8A94A6` com contorno, o Globo Irado triste, os óculos escorregando; uma frase com a causa e a câmera no lugar;
  **sem caveira, sem fogo, sem chuva de tijolos**.
- **Foto oficial da cúpula** (`Cenas3D.foto`): bonecos em 2 fileiras sobre o pedestal, faixa "CÚPULA 2050" e data.

### 5.16 Lobby e editor de avatar (provador)

- **Lobby:** mesa anil com padrão de pinos; no alto (55%), `Cenas3D.lobby` com **6 pedestais redondos** (Ø 3,2 módulos, 1
  tijolo de altura) na cor da potência, tampo creme e a forma na frente; cada boneco numa **pose de personalidade**
  (acenar, braços cruzados, pulinho, polegar…); placa de nome em letra-bolha. Embaixo: 6 **vagas** (ladrilho com aba da cor):
  nome editável (até 14 caracteres), alternador de 2 posições em tijolo "Equipe / Computador" (`data-teste="potencia-<pid>"`),
  "Editar boneco" (lápis). À direita: **modos** em ladrilhos grandes com objetos do kit (competitivo = `trofeu`, blocos =
  `aperto-maos`, cooperativo = `globo`, solo = `maleta`), rodadas (3 tijolos: Rápida, Aula, Completa) e "COMEÇAR!"
  (`.btn-principal` de 9u).
- **Provador:** painel G; esquerda (40%) a prévia 3D girando (uma volta a cada 12 s, arrastar gira com inércia) sobre base
  redonda de tijolos; direita: abas **Pele, Cabelo, Penteado, Chapéu, Acessório, Comemoração**; grade 4×3 de ladrilhos de 12u
  com miniaturas renderizadas (3/4, fundo transparente); escolhido = aro amarelo 0,6u + selo ✓ verde de 4u; embaixo, o nome do
  item em Fredoka `--fs-cartao` e uma frase; botões Desfazer, Sortear (dado SVG) e **PRONTO!** Ao trocar: pulinho do boneco
  (`scaleY .85→1.08→1`, 0,35 s) + `pop`.

### 5.17 Menu de pausa e ajustes

Véu .55 + painel M com moldura amarela e "PAUSA" em Titan One; botões empilhados de 8u: **Continuar** (principal), Manual,
Ajustes, Teste da sala, Salvar e sair (neutros), Sair sem salvar (perigo, com confirmação na própria peça). Ajustes são
**interruptores de tijolo** (peça de 2 posições, o tijolo amarelo desliza): Música, Efeitos, Movimento reduzido, Texto grande
(×1,15 / ×1,3), Contraste alto, Gráficos leves. Teclas do professor sempre listadas no rodapé (Espaço, P, H, M, F, Esc).

### 5.18 Manual do Diplomata

Um **livro de instruções de montagem**: painel G cor `--mesa-topo` com as **abas verticais** à direita como marcadores de
página (cada uma no pastel do assunto, com ícone); páginas em ladrilho com fundo "planta de montagem" a 4%; **passos
numerados** em círculos amarelos com Titan One ("1", "2"…), ilustrações do kit, glossário em cartões, divisores de pinos.
`manual.html` imprime em papel branco, mesmas cores de aba, sem fundo.

### 5.19 Layout do HUD (partida)

Validado em `maquetes/hud.html` → `maquetes/capturas/hud-1920.png`, `hud-1366.png`, `hud-ficha-1920.png`,
`hud-ficha-1366.png` (as duas resoluções são o mesmo layout em `u`; só o piso de 18 px muda).

| Peça | `u` (x / y) | 1920×1080 px (x / y) | 1366×768 px (x / y) | Conteúdo |
|---|---|---|---|---|
| Ano + estado do mundo | 1,5–32,6 / 1,6–11 | 16–352 / 17–119 | 11–250 / 12–85 | §5.6 |
| 6 indicadores (23u, vão 0,85u) | 34–176,3 / 1,6–11 | 367–1904 / 17–119 | 261–1354 / 12–85 | Comércio · Cooperação · Temperatura · Relógio · Deslocados · Energia |
| Coluna direita: menu (3) + controles do mapa (4), botões de 5,9u | 170,4–176,3 / 13,4–63,9 | 1840–1904 / 145–690 | 1309–1354 / 103–491 | pausa, som, ajuda · aproximar, afastar, visão geral, lentes |
| Coluna esquerda: painel da vez + placar | 1,5–32,6 / 14,6–82 | 16–352 / 158–886 | 11–250 / 112–630 | §5.8 |
| Avisos (temporários) | centro em 98 / 71,4–77,5 | ~700–1420 / 771–837 | ~500–1010 / 548–595 | §5.9 |
| Ficha da ação / faixa de instrução (temporárias) | 40–144 / base em 78,2 | 432–1555 / até 845 | 307–1106 / até 601 | §5.4 |
| Barra de ações (fixas + 6 + Trocar) | 34,1–155,6 / 80,4–94,6 | 368–1680 / 868–1022 | 262–1195 / 617–727 | §5.4 |
| Encerrar vez | 158,7–176,3 / 81,4–94 | 1714–1904 / 879–1015 | 1219–1354 / 625–722 | §5.9 |
| Letreiro | 0–177,8 / 95,6–100 | 0–1920 / 1032–1080 | 0–1366 / 734–768 | §5.9 |
| **Área livre do mapa** | **32,6–170,4 / 11–79** | **352–1840 / 119–853** | **250–1309 / 85–607** | nenhum painel sólido; só os temporários |

**Câmera da visão geral** (Mundo 3D): alvo (0, 0, 3), **distância 186**, inclinação .62 rad, FOV 34 +
`camera.setViewOffset(W, H, 0, 0.065 * H, W, H)` (a imagem sobe 6,5% da altura). Medido (`maquetes/ancoras.mjs`): todas as
âncoras de território caem na área livre (a da Antártida fica rente à doca), a terra vai de x 331 a 1929 e de y 137 a 760
em 1080p; sob a coluna esquerda e a coluna direita só ficam moldura, oceano e as pontas da Chukotka e das Aleutas. Em telas
16:10 e 4:3 o HUD escala pela dimensão menor (`--u`) e a sobra vai para o mapa. **Tecla H** esconde tudo menos o letreiro.

**O que aparece em cada fase:**

| Fase | Topo | Coluna | Doca | Letreiro |
|---|---|---|---|---|
| Abertura do mandato (faixa do ano) | sim | recolhida | não | sim |
| Plantão | sim | recolhida | não | não (a tarja ocupa) |
| Dilema da vez | sim | painel da vez | não (painel G no centro) | sim |
| Decisões | sim | painel da vez | sim | sim |
| Vez do computador | sim | painel da vez (leitura) | faixa "decidindo…" + Pular | sim |
| Balanço | não | não | não | sim |
| ONU, COP, revelação, pódio | não (cena 3D) | não | não | não |

---

## 6. O mundo 3D

Dono: Mundo 3D (`js/mapa3d.js`). Ponto de partida aprovado: `arte/maquetes/mapa-guia.js` (casa lisa e mais alta, parceiro
em xadrez com bandeira, torres em fileira com tampa de forma, tijolos-fantasma, boneco com base, mesa anil) +
`arte/teste-blocos/v2.js` (chanfros, pinos, oceano) + conclusões de `ativos/pos3d.md`.

### 6.1 Peças e material
- **Placa de terra:** `RoundedBoxGeometry(1, .8, 1, 2, .05)` (2 placas de altura), largura **1,0** (a separação vem do chanfro;
  fresta física serrilha no telão), numa `InstancedMesh`. **Pinos** noutra `InstancedMesh` (perfil com bisel, 12 lados),
  **sem projetar sombra**. Casa da potência: +0,4.
- **Base de rejunte** `#0B1F4B` sob tudo (plano com `alphaMap` das células válidas): some as linhas azuis entre países.
- **Plástico:** `MeshStandardMaterial`, `metalness 0`; rugosidade .30 (terra, tijolos, construções), .32 (roupa), .28 (pele),
  **.16 no mar** com `envMapIntensity 1.4` (o mar fica "molhado" só pelo reflexo, sem transparência). ±1,5% de brilho por
  peça (sorteio fixo por célula).
- **Reflexo:** `RoomEnvironment` por PMREM, `cena.environmentIntensity = .35`. Se a face de cima de um território medir
  ΔE > 3 contra o hex do guia na captura, baixe para .25 (no `ativos/pos3d.md`, .7 deixou o vermelho rosado).
- **Moldura do tabuleiro:** contínua (`ExtrudeGeometry` da silhueta de Robinson com 1,5 módulo de folga), 1 tijolo de altura,
  creme `#FFF4DC`, chanfro .15, **fileira de pinos** no topo; nada de anel de ladrilhos "colar de contas" nas pontas.
- **Antártida** contínua (toda célula ao sul da costa vira gelo); ilhas de 1 célula = peça redonda 1×1 com pino.

### 6.2 Oceano
5 tons de ladrilho liso (`#7FD8EC` → `#197DBF`) pela **batimetria** (`MAPA.profundidade`, gerada do Natural Earth em
`ferramentas/gerar-mapa.mjs`; enquanto não existir, pela distância à costa), fronteiras **salpicadas** (±0,9 célula), anel de
**espuma** (peças redondas brancas com pino em 70% das células de costa). Sem "ondinhas" deslizando (parecem protetor de
tela): no lugar, uma faixa diagonal de +4% de brilho que cruza o mar a cada 6–8 s e 1–2 cintilações de 300 ms em ladrilhos
sorteados. RM: parado.

### 6.3 Luz, sombra e pós-processamento
```js
renderer.toneMapping = THREE.NeutralToneMapping;           // fiel ao amarelo e às cores de equipe (AgX/ACES lavam)
cena.add(new THREE.HemisphereLight('#EAF4FF', '#5B4C8C', .8));   // sombra fria e arroxeada
const sol = new THREE.DirectionalLight('#FFF0D8', 2.3); sol.position.set(-60, 110, 80);   // sudoeste: sombra para nordeste
sol.castShadow = true; sol.shadow.mapSize.set(4096, 2048); sol.shadow.bias = -.0003; sol.shadow.normalBias = .03;
renderer.shadowMap.type = THREE.PCFShadowMap; sol.shadow.radius = 2.5;   // PCFSoftShadowMap saiu no r186
// Modo "bonitos": N8AO (Performance, meia resolução, aoRadius 1.1, intensity 2.2, cor #13224A) entrando aos poucos entre
// as distâncias de câmera 100 e 55 (de longe vira pontilhado) → OutputPass → SMAA depois do OutputPass.
// Modo "leves": pixelRatio 1, sombra 2048 só de torres e bonecos (terra.castShadow = false), MSAA nativo, sem composer.
// Troca automática para "leves" se a média dos quadros passar de 22 ms em 3 s. THREE.Clock está obsoleto: THREE.Timer.
```
Sem bloom e sem profundidade de campo no mapa jogável (o projetor estoura o claro e o borrado parece defeito); os dois só nas
cenas de vitrine (lobby, pódio, foto oficial).

### 6.4 Câmera
- **Visão geral:** §5.19 (alvo (0, 0, 3), distância 186, inclinação .62, FOV 34, `setViewOffset` subindo 6,5%). Norte sempre
  para cima (azimute 0); o usuário pode girar ±0,7 rad, mas todo voo volta ao azimute 0.
- **Focar território:** distância `max(28, min(110, 14 + √pinos × 3,2)) / perto`, inclinação .78, voo de 1,1 s
  `power2.inOut` + `whoosh`. RM: corte seco.
- **Modo início:** passeio lento (azimute ±8° e distância ±6% num ciclo de 40 s). RM: parada.
- **Sobrevoo do balanço:** 2,5 s por lugar, sem girar.

### 6.5 Influência (torres)
- Tijolo 2×2 (`RoundedBox(1.95, 1.2, 1.95, 2, .05)` + 4 pinos com bisel), na cor da potência; até **10 tijolos**.
- **Fileira** da mais alta para a mais baixa (da esquerda para a direita de quem olha), espaçamento 2,3 módulos.
- **Tampa:** ladrilho 2×2 com a **forma branca** contornada de índigo impressa (é a face que mais aparece vista de cima).
- **Tijolos-fantasma:** brancos a 28% (sem `depthWrite`) completando a torre do líder até a resistência: "faltam 2" sem número.
- **Visão geral:** só as 2 mais altas + pílula "+2" (HTML) se houver mais; **de perto** (distância < 70): todas, com o número
  em cima. Territórios pequenos (Caribe, Levante, Taiwan, Coreia, Balcãs, Ilhas do Pacífico): âncora deslocada para o mar e
  ligada ao território por uma fileira de peças redondas 1×1.
- **Sem contorno** nas torres (a oclusão e a sombra já fazem o contato).

### 6.6 Parceria, liderança e disputa
- **Vira parceiro:** onda de cor a partir da âncora (0,9 s; crista +0,6 e assenta) + bandeira sobe (0,4 s `back.out(1.7)`) +
  **chuva de 12 tijolinhos** na cor da potência + som `subir`. **Perde:** a bandeira desce (0,3 s `power2.in`), a cor volta em
  onda, som `descer`.
- **Liderança continental:** rótulo do continente no mar (Fredoka 3u letra-bolha) com uma **fileira de encaixes** (um por
  território neutro do continente), cheios com a forma e a cor do parceiro, a marca da maioria e "+1 CP".
- **Disputa:** selo de balança acima das torres empatadas no limiar.

### 6.7 Crises e conflitos
Conflito é **emergência humanitária, não espetáculo**: blocos de alerta, anéis, hachura e fumaça (§2.6). Escalada: bloco novo
cai (0,5 s) + `trovao` + 1 tijolo salta de cada torre ali. Esfriar: o bloco sobe e se desfaz em pinos (0,6 s) + `sucesso`.
Conflito nível 3 tira estabilidade dos vizinhos: linha pontilhada laranja até cada vizinho (0,5 s) com "−3" flutuando.
**Nunca:** armas, tanques, soldados, mira, explosão, caveira, sangue, fogo de batalha.

### 6.8 Clima (o mundo que reage e guarda memória)

| Gatilho | Mudança no mapa | Como |
|---|---|---|
| T ≥ 1,6 °C | 10% dos pinos de gelo da borda (Groenlândia, Ártico, Antártida) viram mar | a peça afunda 0,4 e troca de cor em 0,6 s; o urso-polar (`urso-polar`) senta triste |
| T ≥ 1,8 °C | +15% do gelo; **mar sobe**: 1 pino de água rasa avança nas costas baixas (Ilhas do Pacífico, Sul da Ásia, delta do Nilo) | placas translúcidas `#A8E9F5` a .7 sobre os pinos da costa |
| T ≥ 2,0 °C | Sahel e Norte da África 25% mais secos; acende a luz "Permafrost" no termômetro | mistura de 40% com `#D9B26A` + rachaduras + `cacto` |
| T ≥ 2,15 °C | acende a luz "Florestas morrendo" | árvores da Amazônia e do Congo perdem as folhas (somem 1 a 1) |
| Seca (evento) | território ressecado | §2.9 + som `descer` |
| Queimada (evento) | 3–6 cones laranja/amarelos piscando ≤ 2 Hz, fumaça subindo; depois cinzas `#4A4545` | fogo **só** para incêndio florestal |
| Tempestade / ciclone | espiral de 3 nuvens `#6B7391` girando 1,5 rad/s sobre o mar junto à costa + 2 raios `#FFE45C` | som `trovao` |
| Onda de calor | domo laranja translúcido pulsando (.25 ↔ .4 em 1,6 s) + ☀️ | som `descer` |
| Enchente | placas azuis translúcidas sobre o território | som `whoosh` |
| Tensão ≥ 80 | a mesa puxa para o violeta (§2.1) e a música vai para `tensao` | 2 s |

Cada mudança aparece no sobrevoo do balanço com legenda ("O gelo da Groenlândia diminuiu").

### 6.9 Comércio, energia, pessoas deslocadas e cooperação
- **Rotas de comércio:** linha pontilhada de peças redondas 1×1 brancas (a cada 2 pinos) sobre o mar nas rotas fixas (Suez e Mar
  Vermelho, Malaca, Panamá, Atlântico Norte, Pacífico Norte, Cabo; Ártico quando abrir); 1 navio por rota a cada 20 pontos de
  Comércio, andando 2 pinos/s; conflito na rota → linha laranja tracejada, navios param e "−1,5" aparece sobre o indicador.
- **Aviões:** voam em arco entre capitais (altura 8 módulos, 1,4 s) em missões diplomáticas, cúpulas e acordos.
- **Energia:** termelétrica solta fumaça `#8A8F9E` proporcional às emissões; turbinas giram (`helice`); painéis solares com
  brilho; crise do petróleo: bombas e plataformas do Golfo piscam laranja devagar.
- **Pessoas deslocadas (com respeito):** **nunca** pessoas sofrendo, multidão anônima ou barco afundando. Mostrar a **seta de
  chevrons brancos tracejada** (origem → destino, 1,2 s) e **tendas de acolhimento** azul-claras com coração no destino (1 a
  cada 5 milhões, no máximo 4); acolher: a tenda ganha lampião aceso e uma hortinha (placa verde com 2 brotos). Vocabulário:
  "pessoas deslocadas", "acolhimento", "refugiados".
- **Cooperação:** pombas (`pomba`, asas batendo 3 Hz) voando entre os signatários em arco dourado pontilhado; Cúpula do Clima
  com sucesso: uma pomba sai de cada capital ao mesmo tempo.

### 6.10 A ação vira construção (peça por peça)

Regras: toda construção nasce sobre uma **placa-base 4×4 na sombra da potência** com uma **bandeirinha de 2 módulos com a
forma**; monta peça por peça (§9); fica num **anel de vagas** ao redor da âncora (raio 3–5 módulos, longe das torres); no
máximo **3 por território neutro e 5 por casa** — a mais antiga desmonta em pilha de tijolos que some. Ao carregar partida
salva, `e.construcoes` reconstrói tudo sem animação.

| Ação | Construção (modelo de `Modelos3D` ou peças) | Onde |
|---|---|---|
| Missão diplomática | `predio-governo` (escala .6) + bandeira da potência | alvo |
| Cooperação Sul-Sul | `escola` + `carga-ajuda` | alvo |
| Propor resolução na ONU | sem construção: abre a sessão; pombas na visão geral | — |
| Sanções econômicas | 3 `barreira` em fila + cadeado; arco tracejado índigo com cadeado | casa do alvo, lado da sancionadora |
| Aliança estratégica | bandeira das duas potências nas duas capitais + arco duplo + `aperto-maos` (sprite) no meio | casas |
| Cúpula regional | mesa redonda de peças (peça redonda 4×4 creme + 6 cadeirinhas 1×1 nas cores dos vizinhos) | casa |
| Acordo de livre-comércio | `navio-cargueiro` + pilha de `conteiner-*` no porto + rota pontilhada | alvo |
| Tarifas de importação | `barreira` + contêineres parados | porto da casa |
| Infraestrutura no exterior | `guindaste-porto` + trilho de peças | alvo |
| Exportar commodities | `navio-granel` saindo da casa | costa da casa |
| Política industrial | `fabrica` (fumaça conforme emissões) | casa |
| Atrair transnacionais | torre de escritórios de tijolos (3×3×6, janelas em ladrilho azul-claro) | casa |
| Empréstimo a país em crise | pilha de `moeda` + `predio-governo` pequeno | alvo |
| Energia renovável | 2 `turbina-eolica` + `painel-solar` | casa |
| Explorar petróleo e gás | `bomba-petroleo` (terra) ou `plataforma-petroleo` (costa) + `tanque-combustivel` | casa |
| Desmatamento zero | 3 `arvore-folhosa`/`palmeira` brotando + cerca de pinos verdes | floresta da casa |
| Fundo para florestas tropicais | árvores brotando em 3 territórios + `moeda` voando até eles | alvos |
| Expandir a fronteira agrícola | `escavadeira` + canteiros (placas amarelas e verdes em faixas); árvores somem | casa |
| Fundo climático internacional | `moeda` voando + `painel-solar` pequeno em 3 territórios vulneráveis | alvos |
| Meta climática ambiciosa | placa-alvo (peça redonda 3×3 com anéis concêntricos) num mastro | casa |
| Minerais críticos | `jazida` + `escavadeira` | alvo/casa |
| Energia nuclear | `usina-nuclear` | casa |
| Adaptação climática | dique de tijolos cinza-azulados ao longo da costa + caixa-d'água | casa |
| Ampliar a defesa | **torre de radar** (prato branco em torre cinza) — nada de arma | casa |
| Ciberdefesa | rack de servidor peça-preta com luzes verdes e cadeado | casa |
| Mediação de paz | mesa de diálogo (2 cadeiras + `pomba` pousada); um bloco de alerta se desfaz se der certo | alvo |
| Ajuda à reconstrução | `guindaste-porto` pequeno + casinhas de tijolos | alvo |
| Base militar no exterior | cercado de pinos cinza com hangar em arco e bandeira — sem armas | alvo |
| Combate ao crime transnacional | posto de fronteira (cabine + cancela listrada) | fronteira da casa |
| Desarmamento | a torre de radar **desmonta** em pilha e uma `pomba` levanta voo | casa |
| Acolher refugiados | 2 `tenda` com coração + `caixa-ajuda` | casa |
| Ajuda humanitária | `caminhao-ajuda` + `carga-ajuda` | alvo |
| Investir em educação | `escola` | casa |
| Saúde pública e vacinas | `hospital` + `ambulancia` | casa |
| Combate à fome e à desigualdade | barraca de feira (toldo listrado) com caixotes de alimentos | casa |
| Direitos de indígenas e quilombolas | **marco de demarcação** (placa de madeira) + árvores + cerca de pinos verdes — nenhuma figura caricata | floresta da casa |
| Fechar fronteiras | segmentos de `muro` na borda da casa | casa |
| Pesquisa e inovação | laboratório (prédio branco com cúpula de observatório) | casa |
| Combate à desinformação | torre de transmissão com placa ✓ | casa |
| Programa espacial e satélites | `foguete` sobe (3 s, fumaça branca) e um `satelite` passa a orbitar baixo sobre o mapa | casa |
| Diplomacia cultural | palco de tijolos com telão e holofotes (estrela no topo) | 3 alvos |
| Internet e cabos submarinos | cabo pontilhado amarelo no fundo do mar + antena | casa → alvo |

Modelos Kenney são **peças moldadas** de brinquedo (como as peças especiais de um kit): entram como estão, mas **re-tingidos**
para a paleta (cinzas `#A0A5A9`/`#6C6E68`, telhados no material "tinta" = cor da potência) e **sempre sobre a placa-base de
pinos**. Nada de cruz vermelha (o `hospital` usa "H" azul).

### 6.11 Alvos, destaque e números no mapa
- **Alvos válidos:** os pinos sobem 0,2 e ganham emissivo amarelo .25 pulsando a cada 1,2 s (RM: fixo); o válido sob o mouse
  sobe 0,4 e mostra o tijolo-fantasma pulsando na torre. Inválidos não mudam. Sempre há a **lista** como alternativa.
- **Passar o mouse:** o território sobe 0,2 em 0,12 s (`power2.out`) e abre a ficha (balão §5.5).
- **Número flutuante:** nasce 2 módulos acima da âncora, Nunito 900 5,6u em letra-bolha (`--ganho`/`--perda`/branco; cor da
  potência quando é influência, com a forma), sobe 6u em 1,2 s e some; no máximo 4 por lugar, 0,18 s entre eles.
- **Voo até o HUD** (causa → efeito): uma peça pequena com o ícone sai do território e voa até a peça do indicador (Bézier,
  0,7 s `power2.inOut`); ao chegar, a peça do HUD pulsa e conta + `moeda`.

### 6.12 Escala dos objetos (visão geral; 1 módulo ≈ 9 px em 1080p)

| Objeto | Escala | Tamanho na tela (1080p) |
|---|---|---|
| Boneco na capital (com base de peão) | `clamp(1.25, distância / 55, 2.6)` → 2,6 na visão geral, 1,4 de perto | ~75–90 px de altura |
| Torre de influência | 1 (até 10 tijolos = 12 módulos) | até ~110 px |
| Construção de ação | 1,0 de perto, 1,3 na visão geral (pegada 4×4, altura 3–5 módulos) | 40–60 px |
| Bandeira de parceiro | 1,5 (mastro 4,4 módulos) | ~60 px |
| Árvore, cacto, tenda | 1 (2–3 módulos) | 20–30 px |
| Navio / avião | 1 de perto, 1,4 na visão geral | 50–70 px |
| Bloco de alerta | 1×1 flutuando 1,5 acima | ~12 px cada |

Orçamento: ≤ 3,5 milhões de triângulos no mapa; ≤ 2 contextos WebGL vivos; pausar o mapa quando uma cena 3D cobre a tela.

---

## 7. Bonecos

Dono: Bonecos e cenas (`js/bonecos.js`, fonte única para mapa, cenas e retratos). Base aprovada: `ativos/boneco-proposto.js`
(procedural, 0 bytes de modelo). **Original:** sem cabeça cilíndrica com pino, sem mão em "C", sem quadril recortado (o
boneco de montar de marca é marca 3D registrada).

### 7.1 Proporções (altura ≈ 3,0 módulos sem chapéu)
- **Cabeça-bloco** 1,3 × 1,1 × 1,1 (≈ 37% da altura, **mais larga que os ombros**), cantos de raio 0,3 (4 segmentos).
- **Tronco** 1,0 × 0,78 × 0,6, raio 0,17, levemente trapezoidal, na **cor da equipe**, com **broche** no peito: círculo creme
  de raio 0,24 com aro índigo e a **forma da equipe** desenhada (canvas, nunca caractere de fonte), na cor dela.
- **Pernas** curtas (0,64) na **sombra** da equipe; **sapatos** 0,44 × 0,22 × 0,6 grafite `#2B2D42`; cinto grafite.
- **Mãos-luvinha** (blocos arredondados) na cor da pele, no fim da manga.
- **Contorno:** casca invertida de 0,045 na cor de contorno da equipe (§2.3). **Bolha de contato** no chão (radial
  `#0B1F4B` a .45) que encolhe quando ele pula.

### 7.2 Rosto e expressões
- Textura 384×320 transparente na face da frente da cabeça (acompanha a curva). **Olhos** ovais verticais `#1A1433` com
  **dois brilhos** (um grande em cima, um pequeno embaixo); **sobrancelhas** em arco; **boca** em arco; bochechas
  `rgba(255,110,130,.35)`. Nos dois tons de pele mais escuros, aro claro de 3 px a 35% em volta dos olhos.
- Expressões: **feliz** (padrão), **piscar** (100 ms a cada 2–5,5 s), **alegre** (olhos "^ ^", boca aberta `#6B1020` com
  língua `#F06A7A`), **triste**, **surpreso** (boca em "O"), e as novas **pensativo** (uma sobrancelha erguida, boca de lado)
  e **determinado** (sobrancelhas 20° para dentro, boca reta) para conselheiros e votação; **falando** = boca alterna 2 quadros
  a 8 Hz (âncora, conselheiros, discurso).

### 7.3 Pele, cabelo e diversidade
- **Peles** (`Bonecos.PELES`): `#FFDBB4`, `#F2C08E`, `#D9A066`, `#B57A48`, `#8D5A35`, `#5C3A21` + amarelo de brinquedo
  `#FFD21A` (opção de fantasia, nunca padrão). O sorteio inicial distribui os 6 tons humanos entre as 6 equipes; nenhum tom
  é "o normal".
- **Cabelos:** `#3B2414`, `#1B1A22`, `#E8C25A`, `#B5532A`, `#7A4A2A`, grisalho `#C9CCD1`. **Penteados:** curto, franja,
  coque, black, longo, careca (P1: tranças).
- **Inclusão:** cadeira de rodas como acessório de mobilidade (P1, com pose própria).

### 7.4 Chapéus e acessórios
- **Chapéus** (1,15–1,3× a largura da cabeça, mesmo contorno do corpo): cartola (faixa na cor da equipe), capacete de obra,
  boné (cor da equipe), astronauta (bolha com reflexo), explorador, óculos, fone com microfone, coroa de louros (vitória) e,
  para conselheiros, **capacete da paz** azul-céu `#8FD3FF` com faixa branca (sem emblema).
- **Acessórios de mão** (`Bonecos.ACESSORIOS`): prancheta, megafone, maleta, livro, globo, microfone, luneta — os mesmos
  objetos do kit em versão de peça, presos à mão.
- **Proibido:** sombreiro, cocar, chapéu cônico asiático, turbante ou fez como fantasia, quepe ou capacete militar, bandeira
  estampada no corpo.

### 7.5 Personagens fixos
- **Computador:** mesmo corpo na cor da potência, mas a cabeça é um **monitor** (bloco arredondado 1,3 × 1,0 × 0,9 peça-preta
  `#2B2747`, tela `#1A1433` com olhos e sorriso de pixels ciano `#6FE7FF`, emissivo .6) + antena com bolinha amarela.
  Expressões em pixels (feliz, "…" pensando, triste). Lê-se "não humano" de longe, sem transparência.
- **Âncora do Plantão:** terno grafite `#4A4F5C`, gravata amarela, fone com microfone; pele sorteada por partida.
- **Conselheiros do dilema:** camisa no **pastel da categoria**, calça no lado dela, chapéu da categoria (§2.8), expressão
  pensativo ou determinado. Não usam cor de equipe.

### 7.6 Poses e animações (`acao`)

| Ação | Tempo | Como |
|---|---|---|
| parado | contínuo | tronco "respira" ±1,5% a 0,5 Hz; a cada 4–8 s olha para o lado (±0,35 rad, 0,4 s); pisca |
| acenar | 1,2 s | braço sobe a 2,6 rad em 0,18 s (`back.out(2)`), 3 balanços de ±0,35 rad a 3 Hz, desce em 0,25 s |
| pular | 0,8 s | agacha 0,08 s (`scaleY .85`, largura 1,08), sobe 1,6 em 0,28 s esticando para 1,08, desce 0,22 s, assenta 0,18 s `back.out(3)` |
| comemorar | 1,6 s | 2 pulos com os braços para cima e rosto "alegre"; 12–20 tijolinhos na cor da equipe |
| palmas | 1,2 s | braços à frente, mãos batendo a 4 Hz (pódio) |
| triste | 1,5 s | cabeça desce 0,3 rad, braços para dentro, `scaleY .97`, balanço lento |
| surpreso | 0,6 s | pulinho de 0,4 + boca "O" + sobrancelhas sobem |
| votar | 0,9 s | ergue uma plaquinha de voto (ladrilho 1×2) e baixa |
| falar | contínuo | gesto de mão a cada 1,2 s + boca "falando" |
| apontar | 0,3 s e segura | braço estendido na direção do alvo |

RM: sem pulos nem balanços; as **poses e expressões** continuam (braço erguido, rosto alegre).

### 7.7 Retratos (`Cenas3D.retrato`)
Girado 15° para a esquerda, câmera FOV 20 a 8° acima, **mesma luz e contorno de adesivo do kit (§4.2)**, fundo transparente,
em cache por avatar + expressão. Dois enquadramentos fixos (iguais para todos os bonecos, para os retratos alinharem):
- **`rosto`** (tamanhos < 10u: placar 5,2u, painel da vez 6,8u, chips): centro em y 2,5 do boneco, meia-altura 1,02 — o rosto
  enche o soquete; o topo do chapéu pode ser cortado pelo círculo.
- **`busto`** (tamanhos ≥ 14u: conselheiros, tablet de votação, âncora 26u): centro em y 2,45, meia-altura 1,62 — do peito
  (com o broche) ao topo do chapéu mais alto.
Prova: `arte/maquetes/kit/rosto-*.png` e `retrato-*.png` (código em `maquetes/kit.js`, `estudioBusto`).

### 7.8 No mapa
Base de peão (aro índigo `Cylinder(1.05→1.1, h .22)` + disco creme `#FFF4DC` `Cylinder(.96, h .28)`) — é o que separa o
boneco do território da própria cor. Fica na capital, deslocado para o nordeste da âncora; na vez, um **holofote amarelo**
no chão (disco emissivo `#FFD21F` a .35 + anel). Reações: acena ao ganhar parceria, fica triste em crise na casa, comemora na
vitória.

---

## 8. Mascote "Globo Irado" e logotipo

### 8.1 O mascote em 3D (`js/mascote.js`, Bonecos e cenas)
"Irado" é gíria de "muito legal": o Globo Irado é **o planeta de óculos escuros**, confiante e brincalhão — e que sente o que
acontece com ele (susto, tristeza).
- **Corpo (alinhado ao globo da logo oficial):** esfera de raio 10 com ~1.200 peças em espiral de Fibonacci. **Mar** =
  ladrilhos redondos **lisos** (sem pino) em **azul royal da marca**: `#1E8CCD` perto da costa, `#0B6DBA`, `#02569F` no
  fundo (corpo da esfera `#02569F`); **terra** = peças redondas **com pino**, 1,6× mais altas, toda em **verde-limão da
  marca** `#96C513` (sem deserto nem gelo, como na logo) — legível de longe, sem cores de equipe.
- **Contorno** índigo `#1A1433` (casca 3% maior, faces internas) na silhueta inteira; **sombra de contato** elíptica a 30%.
- **Óculos escuros** (a marca dele): 2 lentes `RoundedBox(6.2, 3.2, 1.4, 4, .7)` com degradê `#1A1433 → #2B3A67`, rugosidade
  .1, um risco de brilho branco diagonal em cada lente, ponte e hastes; **sobrancelhas** = 2 blocos arredondados índigo
  (2,6 × 0,6 × 0,6) acima das lentes, inclinados 12° para dentro (a atitude); **boca** = sorriso **de lado** com meia-lua de
  dentes brancos.
- **Braços (como o punho da logo):** ombro = peça redonda 2×2 verde-limão encaixada na esfera; braço `RoundedBox` **azul
  `#0B5CAB`** com **faixa verde-limão no punho**; **luva branca** de desenho animado (3 dedos + polegar). Com o braço no alto
  (aceno do `feliz` e os dois braços do `comemorar`) a luva vira a **mão "irada" da logo**: indicador e mindinho em pé
  (os chifrinhos), médio e anelar dobrados, polegar atravessado por cima deles, palma para a câmera. **Pés:** 2 tênis arredondados
  índigo com sola branca aparecendo sob a esfera.
- **Movimento:** a superfície gira por baixo do rosto (0,35 rad/s); o corpo flutua ±0,6 (2 s) e balança ±0,05 rad; acena com
  `back.out(2)`. RM: parado, acenando em pose.

| `Mascote.reagir` | Como |
|---|---|
| `feliz` (padrão) | sorriso de lado, aceno |
| `susto` | os óculos **escorregam** para a ponta (0,25 s `back.out`) e revelam olhos redondos brancos com pupila índigo e brilho; sobrancelhas sobem; boca "O"; pulinho |
| `triste` | óculos inclinados 8°, sobrancelhas para fora, boca invertida, braços caídos; no colapso, uma gota de suor azul-clara |
| `comemorar` (vitória) | pulo duplo com os braços para cima, brilho cruzando as lentes, chuva de tijolinhos |
| `pensando` (dicas) | luva no "queixo", uma sobrancelha erguida |

Onde aparece: início (grande, ao lado da logo oficial), "Para conversar" do balanço, dicas (retrato renderizado com a receita do
kit, `globo-irado-*`), colapso, vitória cooperativa, carregamento.

### 8.2 Logo oficial e marca (`logo(variante, classe)` em `js/icones.js`; arquivos em `img/marca/`)
**A logo oficial manda.** É a arte enviada pelo cliente (`img/logo.webp`): globo de oceano azul royal e continentes
verde-limão em relevo com anel verde; à frente, a mão branca de desenho animado no gesto "irado" (chifrinhos), punho azul com
faixa verde; embaixo, GEOGRAFIA em branco e IRADA em verde-limão, letras grossas com contorno azul-marinho sobre uma base
azul-marinho em 3D, sublinhadas por um traço verde curvo. O logotipo desenhado antes (letras Titan One com o Globo Irado no
"O") **saiu**: não use, não recrie.

**Recortes** (`node ferramentas/recortar-logo.mjs` refaz tudo a partir de `img/logo.webp`; WebP para a tela, PNG para imprimir):

| Peça | Arquivos | Uso |
|---|---|---|
| Completa | `logo-1024/512/256.webp` + `.png` (proporção 1024 × 1114) | início, capa do manual, fim, impressos |
| Emblema | `emblema-512/256.webp` + `.png` (quadrado) | ícone, carregamento, selos, avatar do jogo |
| Palavra | `palavra-1024/512.webp` + `.png` (1024 × 456) | cabeçalhos horizontais, rodapés |
| Horizontal | composta em HTML/CSS: `logo('horizontal')` = emblema + palavra | barras (manual, pausa, créditos) |
| Favicon | `favicon-32.png`, `favicon-180.png` (fundo anil, ícone de toque), `favicon-512.png`; `img/favicon.png` (64) e `img/favicon.svg` | aba do navegador |

`img/logo.svg`, `logo-claro.svg`, `logo-mono.svg` (completa) e `logo-globo.svg` (emblema) agora **embutem a arte oficial**
(data URI: SVG aberto como `<img>` não carrega arquivo externo). Não há versão monocromática oficial: para imprimir em preto
e branco, use o PNG colorido e deixe a impressora converter; peça a versão mono ao cliente se precisar.
O que o recorte fez com a arte, e só isto: a sombra de contato cinza-clara (sobra do fundo branco) virou sombra azul-marinho
com o mesmo tom sobre o branco (sem halo claro na mesa anil); no **emblema**, a parte de baixo do globo que a base esconde
foi completada com o próprio perfil do globo (anel, linha branca, oceano) e a mão termina no punho; na **palavra**, a borda
azul-marinho da base foi refeita onde o punho e o globo a cobriam. A versão 1024 da completa é ampliada da arte de 827 px:
para impressão grande, peça ao cliente o arquivo original em alta (ou vetor).

**Cores oficiais** (medidas na logo; fichas `--marca-*` em `css/base.css`): azul royal `#02569F` (lado aceso `#1E8CCD`),
verde-limão `#96C513` (claro `#AFD522`, lado `#74AF07`), azul-marinho `#153255` (escuro `#102949`), branco `#FAFAF8`.
Valem **só onde a marca aparece** (logo, `.marca-titulo`, `.marca-selo`, mascote). A interface continua com a paleta do §2.

**Regras.**
- **Nunca** redesenhar, redesenhar "em vetor", distorcer (a altura manda; a largura segue a proporção), girar (exceto a
  entrada animada), recolorir, pôr contorno, brilho, neon ou filtro de cor, separar a mão do globo, trocar a ordem das
  peças, nem **escrever "Geografia Irada" em fonte solta como se fosse a logo** — onde o nome do jogo aparece como marca,
  vai a logo (`logo(...)`). Em texto corrido, título de aba, leitor de tela e `alt`, o nome é texto normal.
- **Área de respiro:** em volta da logo, livre de texto e de borda, no mínimo 1/4 da altura do emblema (na completa,
  ≈ 8% da altura; na horizontal, metade da altura do conjunto).
- **Tamanho mínimo na tela:** completa 10u de altura (77 px em 768p); palavra 36 px; emblema 32 px; horizontal 36 px. Abaixo
  disso, use só o emblema. Impresso: completa ≥ 30 mm de largura.
- **Fundos onde funciona:** mesa anil (o principal), placa escura, ladrilho/papel claro, branco; sobre o mapa ou foto, só
  com `.logo.sombra` (sombra de contato índigo). Não usar sobre verde-limão, azul royal ou amarelo chapados, nem sobre
  padrão carregado.
- **Tamanhos no CSS** (`css/arte.css`): `img.logo-completa` 31u (início) · `.medio` 18u (pausa, manual, créditos) ·
  `.pequeno` 10u; `img.logo-emblema` 12u / 8u / 32 px; `img.logo-palavra` 12u / 8u / 36 px; `.logo-horizontal` 8u / 6u / 36 px.
- **Classes da marca:** `.marca-titulo` (título de seção em Titan One branco com contorno marinho e o traço verde curvo da
  logo por baixo; `.claro` sobre papel) — para títulos de seção, **nunca** para o nome do jogo; `.marca-selo` (emblema numa
  placa redonda marinho com aro verde); `.marca-carregando` (o emblema respira; parado com movimento reduzido).
- **Entrada na tela inicial:** `animarLogo(el)` — a logo cai, achata ao bater (`back.out(3)`) e assenta com um tremidinho;
  RM: aparece pronta.

**Harmonia com a paleta (registrado para o refinamento):** o azul royal da marca fica perto do azul da Equipe Azul (EUA,
`#0A32B4`) e o verde-limão perto do verde de "ok" e do Brasil — por isso nenhuma das duas vira cor de interface, estado ou
equipe. A base azul-marinho da logo é mais fria que o índigo `#1A1433` dos contornos: os dois convivem porque nunca se
encostam (a logo traz o próprio contorno). Sobre a mesa anil a logo se lê bem (branco e limão contra o anil; a base marinho
separa as letras do fundo). O amarelo dos botões (`#FFD21F`) e o limão da marca não devem ficar lado a lado em peças do
mesmo tamanho: o botão "Jogar" perto da logo pede uma distância de pelo menos o respiro.

---

## 9. Animação e suco

**Regras:** antecipação → ação com exagero → assentamento. **Um foco por vez** (enquanto o carimbo cai, nada mais se mexe).
**Tudo pulável** (clique, Espaço, Enter ou PageDown levam ao estado final: `timeline.progress(1)`), nada não pulável acima de
1,2 s. Som no quadro do impacto (±20 ms). Suco é tempero: nem nenhum, nem demais. Anime só `transform` e `opacity` no DOM.

### 9.1 Catálogo de microanimações

| Microanimação | Duração | Curva (GSAP) | Detalhe | Som |
|---|---|---|---|---|
| Botão aperta / solta | 70 / 160 ms | `power2.out` / `back.out(3)` | desce 0,7u, lateral 1u → 0,3u | `clique` |
| Passar o mouse (peça, botão) | 120 ms | `power2.out` | sobe 0,2u, brilho 1,07 | — |
| Painel entra / sai | 420 / 220 ms | `back.out(1.4)` / `power2.in` | sobe 6u, escala .94 → 1 | `whoosh` (entra) |
| Itens em cascata | 40–80 ms entre itens | `power2.out` | sobem 1,4u | — |
| Aviso (toast) | 300 / 250 ms | `back.out(2)` / `power2.in` | sobe 3u, escala .8 → 1 | `pop` |
| Faixa de anúncio | entra 420 ms · fica 0,8 s + caracteres ÷ 15 · sai 300 ms | `back.out(1.5)` / `power2.in` | `skewX −14° → 0`, entra da esquerda | `vez` / `reuniao` |
| **Tijolo cai na torre** | 320 ms queda + 140 ms pouso | `power2.in` / `back.out(3)` | cai de +6 módulos; pouso `scaleY .88 → 1`; 90 ms entre tijolos; **sem `bounce.out`** (plástico encaixa, não quica 3 vezes) | `tijolo` com +1 semitom a cada 3 |
| **Montar objeto peça a peça** | 0,8–1,6 s no total | `back.out(1.6)` por peça (260 ms) | cada peça vem de +2,5 módulos com giro ±0,3 rad; intervalo = mín(80 ms; 1,2 s ÷ peças); de baixo para cima e do centro para fora; no fim "ta-dá" (escala 1,08 → 1, 200 ms) + 8 plaquinhas de poeira | `tijolo` por peça, tom subindo; última peça grave |
| Desmontar | 800 ms | física simples | peças saltam (lateral 1,5–3, vertical 4–6 módulos/s, gravidade 25, giro 2–5 rad/s); aos 0,6 s encolhem com `back.in(2)` | `pop` |
| Onda de cor (parceria) | 900 ms | linear | crista +0,6 e assenta | `subir` |
| Bandeira sobe / desce | 400 / 300 ms | `back.out(1.7)` / `power2.in` | — | `subir` / `descer` |
| Arco ação → alvo | 500 ms | `power2.inOut` | chevrons na cor da potência correndo pelo arco | `whoosh` |
| Número que salta | `mín(1,2 s; 0,4 + 0,12·log2(1+|Δ|))` | `power2.out` | ao fim, pulso 1 → 1,25 → 1 (180 ms); anel amarelo some em 600 ms | `moeda` a cada 70 ms (máx. 12) |
| Número flutuante | 1,4 s | `back.out(2)` + `power1.out` | escala .6 → 1,15 → 1 (220 ms), sobe 6u, some nos 300 ms finais | — |
| Voo até o HUD | 700 ms | `power2.inOut` | curva de Bézier | `moeda` ao chegar |
| Ponteiro do Relógio | 600 ms | `elastic.out(1, .5)` | — | `tique` |
| Câmera voa | 1,1 s | `power2.inOut` | norte para cima | `whoosh` (velocidade pela distância) |
| **Carimbo** | 100 ms parado + 280 ms | `back.out(2.2)` | escala 2,4 → 1, giro −25° → −8°; tremida (trauma +.4) e 6 plaquinhas de poeira | `martelo` |
| Selo, ícone, emblema surge | 500–550 ms | `elastic.out(1, .5)` | escala 0 → 1 (nunca em texto) | `pop` |
| Tijolinho de voto | 420 ms + encaixe 140 ms | `power2.in` + `back.out(3)` | arco até a coluna; 180 ms entre votos | `tijolo` com tom subindo |
| Reordenar placar | 600 ms | `power2.inOut` | FLIP, 40 ms entre linhas | — |
| Esperando o professor | 2 s por ciclo | `sine.inOut` | botão pulsa 1 → 1,04 | — |
| Pulso de crise | 1,6 s | `sine.inOut` | brilho da tarja | — |
| Troca de manchete | 300 ms a cada 7 s | `power2.out` | virada vertical | `virar` (só manchete nova) |
| Vinheta do Plantão | 1,6 s | `power3.out` | listras → globo → letreiro "bate" | `plantao` |
| Datilografia (consequência) | 38 ms por letra | linear | pausa de 700 ms no ponto | `tique` a 40% a cada 2 letras |
| Cronômetro, últimos 5 s | 1 Hz | `power2.out` | número 1 → 1,08 → 1, pílula vermelha | `tique` +1 semitom por segundo |

### 9.2 Chuva de tijolos, tremida, quique e esticar
- **Chuva de tijolinhos** (a comemoração do jogo; **substitui o confete de papel**): partículas = tijolinhos 1×1 e 2×2 com
  pino. Nas cenas 3D, malhas instanciadas com física simples; na interface, `canvas-confetti` com `shapeFromPath` de tijolo,
  `scalar` 1,4–1,6. **Quando:** pódio e vitória (120 peças, 3 s, cores do pódio), parceria nova (12, local, cor da potência),
  acordo histórico da COP (40, cores das 6), resolução aprovada (20, cor do proponente). **Nunca** em ação rotineira, sobre
  texto sendo lido, ou acima de 350 partículas.
- **Tremida** (modelo de trauma: soma +.35 crise média, +.6 colapso, +.4 VETO/martelo; decai 1,6/s; intensidade = trauma²;
  interface ≤ 10 px e ≤ 0,6°; câmera ±0,25 módulo): **só** crise grande, colapso, VETO e martelo da ONU. Nunca em erro.
- **Quique** (`back.out`): bonecos aterrissando, selos, carimbos, peças encaixando. `elastic.out(1, .5)` só em ícone e emblema.
- **Esticar e achatar:** bonecos, tijolos, botões e selos; conserve o volume (`scaleX ≈ 1/√scaleY`); **nunca** deforme texto.

### 9.3 Movimento reduzido (`RM`)

| Movimento normal | Com movimento reduzido |
|---|---|
| Câmera voa | corte seco (ou dissolve de 300 ms) |
| Tremida | vinheta vermelha nas bordas por 150 ms, uma vez |
| Chuva de tijolinhos | nada (o selo e o texto bastam) |
| Quique, elástico, esticar e achatar | aparece com dissolve de 150–200 ms |
| Montar peça por peça | o objeto aparece inteiro com dissolve de 300 ms |
| Onda de cor | troca com dissolve de 300 ms |
| Número contando | valor final direto + anel de destaque |
| Bonecos e mascote em loop | parados, com pose e expressão |
| Letreiro, pulsos | troca seca; só a mudança de cor |

**Movimento reduzido tira movimento, não tempo de leitura:** as pausas de leitura continuam em tempo real (nada de acelerar a
linha do tempo inteira com `timeScale(20)`). Nada pisca mais de 3 vezes por segundo, em nenhum modo; fita zebrada é parada.

---

## 10. Som e música por momento

Arquivos aprovados em `ativos/audio/` (CC0; créditos em `ativos/audio/CREDITOS.txt`; nos créditos, os sons de rioforce são
citados pelo autor e pelo número, **sem** o nome da marca que aparece no título original). Dono: Som (`js/audio.js`).
Música por baixo da conversa: nunca compete com o professor; **nenhuma informação só no som**.

| Momento | Efeito / humor (`audio.js`) | Arquivo | Volume | Notas |
|---|---|---|---|---|
| Menu, lobby, provador | `musica('menu')` | `trilha-menu.m4a` (115 BPM) | .45 | — |
| Partida | `musica('jogo')` | `trilha-jogo.m4a` (108 BPM) | .35 | abafa (passa-baixa 1,8 kHz) com painel aberto |
| Mundo em crise (tensão ≥ 80 ou T ≥ 2,0) | `musica('tensao')` | `trilha-tensao.m4a` | .42 | troca com crossfade de 1,5 s |
| Reunião na ONU, COP | `musica('assembleia')` | `trilha-assembleia.m4a` | .30 (.15 no discurso) | entra 1 s depois do alarme |
| Vitória / colapso | `vinheta('vitoria' / 'derrota')` | `vinheta-vitoria.m4a` / `vinheta-derrota.m4a` | .80 / .75 | trilha sai em 0,3 s antes |
| Clique em botão | `clique` | `clique.m4a` | .50 | variação ±4% de tom |
| Tijolo encaixa (torre, construção, voto) | `tijolo` | `tijolo-1/2/3.m4a` (sorteio sem repetir) | .90 | `playbackRate` 0,95 + 0,03·i (teto 1,25); a última peça com `tijolo-3` a 0,9 |
| Construção sem animação peça a peça | `tijolo` (pronto) | `construcao.m4a` | .80 | — |
| Tijolo de influência caindo | `tijolo` | `tijolo-cai.m4a` | .85 | — |
| Chuva de tijolinhos | `chuva` | `chuva-tijolos.m4a` | .60 | 2–3 vezes defasado numa chuva longa |
| Peça aparece, selo, aviso, "quase" | `pop` | `pop.m4a` | .55 | — |
| Painel, faixa, câmera voando | `whoosh` | `whoosh.m4a` | .45 | `playbackRate` 0,9–1,1 pela distância |
| Reunião de emergência | `alarme` | `alarme.m4a` | .65 | **uma vez**; abaixa a trilha (×0,4) |
| Resultado da votação, carimbo | `martelo` | `martelo.m4a` | 1,0 | + `subir` (aprovada) ou `descer` (rejeitada); **não** usar `sucesso`/`erro`: votar não é acertar |
| VETO | `trovao` | sintetizado (`audio.js`) | — | com tremida |
| Dinheiro, número contando, voo até o HUD | `moeda` | `moeda.m4a` | .85 | máx. 12 por contagem |
| Capital Político ganho ou gasto | `pino` | `pino.m4a` | .85 | — |
| Ação concluída, acordo histórico, missão cumprida | `sucesso` | `sucesso.m4a` | .70 | parceria nova usa `subir` (bandeira) + `chuva` curta |
| Algo deu errado (sem humilhar) | `erro` | `erro.m4a` | .55 | mais baixo que o sucesso, de propósito |
| Plantão Global | `plantao` | `plantao.m4a` (3,4 s) | .70 | abaixa a trilha |
| Vez de uma equipe, faixa do ano | `vez` | `som/vez.wav` (Kenney) | .50 | — |
| Manchete nova, papel secreto (abrir/fechar) | `virar` | `som/virar.wav` | .60 | **igual para qualquer papel** |
| Voto confirmado | `voto` | `som/voto.wav` | .60 | **igual para qualquer voto** |
| Ponteiro do Relógio, cronômetro, datilografia | `tique` | `som/tique.wav` | .45 | +1 semitom por segundo no fim |
| Tempo esgotado | `tempo` | `som/tempo.wav` | .60 | tom neutro |
| Indicador subiu / desceu, bandeira | `subir` / `descer` | sintetizados (marimba) | — | — |
| Tempestade, escalada de conflito | `trovao` | sintetizado | — | — |

Mixagem: limitador no mestre (threshold −3 dB); **ducking** da trilha a ×0,4 em 0,15 s durante alarme, plantão, vinhetas e
discurso, voltando em 0,8 s; no máximo 6 efeitos simultâneos e o mesmo som não repete em menos de 35 ms; volumes separados
de música e efeitos, tecla M e opção "sala silenciosa". Os efeitos `carta`, `certo`, `errado`, `pergunta`, `cilada`,
`qualificacao` e `promocao` (do jogo anterior e do quiz) **saem**.

---

## 11. O Teste do Estúdio e a lista "NUNCA FAÇA"

### 11.1 Como fazer (obrigatório para tudo o que se desenha)
1. Capture em **1366×768** enquanto itera e em **1920×1080** na checagem final (`ferramentas/navegador.mjs`, nunca
   `--virtual-time-budget`); capture também com `movimentoReduzido: true`. Guarde em `scratchpad/qa/<sua-frente>/`.
2. Abra a captura com a ferramenta Read e avalie **elemento por elemento**: "Isto parece ter sido criado e projetado por um
   estúdio profissional de games?". "Mais ou menos" = **não**: refaça e avalie de novo.
3. Faça também o **teste da miniatura** (o elemento reduzido a 48 px continua reconhecível?), o **teste do fundo da sala**
   (reduza a captura para 25% da largura e veja se o essencial ainda se lê) e o **teste da lupa** (amplie um trecho 1,2–2×:
   `arte/maquetes/recorte.mjs <captura> <saída> x y largura altura escala`).
4. No relatório, dê a **nota final (0–10)** de cada elemento desenhado. Abaixo de 8 não é entrega.

### 11.2 Checklist por tipo de elemento

**Objeto 3D do kit (render)**
- [ ] Silhueta reconhecível como sombra chapada a 48 px; uma parte-charme exagerada; postura viva (inclinação, assimetria).
- [ ] Chanfro em toda aresta, pino com bisel em toda face de cima de tijolo/placa, juntas visíveis entre peças.
- [ ] Luz da receita (chave quente, recorte azul, preenchimento arroxeado), reflexo de plástico, sombra de contato + sombra
      projetada; nenhuma face "chapada" sem gradação.
- [ ] Contorno de adesivo índigo uniforme (2,5% do lado); fundo transparente sem franja branca.
- [ ] Até 3 cores do guia + índigo + acento amarelo; nenhuma cor saturada de equipe em objeto neutro.
- [ ] Impressões nítidas (texto em fonte do jogo, sem serrilhado); nenhum logotipo ou emblema protegido.

**Ornamento SVG/CSS**
- [ ] Face + lateral + contorno índigo 0,45u + brilho de topo; raios do guia; pinos só se for peça de ação.
- [ ] Nenhum degradê genérico, nenhuma sombra borrada como único relevo, nenhum traço fino (< 3 px em 1080p).
- [ ] Texto em Fredoka/Nunito/Titan One conforme §3; letra-bolha sobre cor.

**Componente de interface**
- [ ] Hierarquia clara: um foco, no máximo 4 blocos de informação; espaçamento em múltiplos de 0,4u com ritmo.
- [ ] Texto ≥ `--fs-min` (18 px em 768p); contraste ≥ 7:1 no essencial; números tabulares.
- [ ] Todos os estados desenhados: normal, passar o mouse, apertado, foco (anel duplo), desativado com motivo, selecionado.
- [ ] Cor + forma/ícone/palavra (nunca só cor); botões de verdade; `data-teste` onde o contrato pede.
- [ ] Não tapa o mapa fora das áreas do §5.19; funciona em 1366×768, 1920×1080 e 1280×720.

**Mundo 3D**
- [ ] Nenhuma linha azul/escura atravessando a terra (amplie 4×); nenhuma mancha de "cometa" ao lado dos pinos.
- [ ] Casa (lisa e alta) e parceiro (xadrez + bandeira) distinguíveis sem cor (vire a captura para cinza e confira).
- [ ] Rótulos sem sobreposição, com acento, em letra-bolha; boneco legível sobre o território da própria cor.
- [ ] Construções sobre placa-base com bandeirinha; escala da §6.12; nada de arma, explosão, caveira.
- [ ] Modo leve entra sozinho em máquina fraca; ≤ 3,5 M de triângulos.

**Boneco e retrato**
- [ ] Cabeça-bloco grande, olhos com dois brilhos (inclusive na pele mais escura), contorno tingido, base/bolha de contato.
- [ ] Pose com antecipação e assentamento; expressão combina com o momento; chapéu sem caricatura.
- [ ] Retrato com a luz e o contorno do kit, fundo transparente, broche com a forma visível.

**Animação**
- [ ] Antecipação, exagero e assentamento; curvas e tempos do §9; um foco por vez; pulável.
- [ ] Com movimento reduzido: sem movimento, mas com o mesmo tempo de leitura; nada pisca > 3 Hz.

**Som**
- [ ] Sincronizado com o impacto (±20 ms); volume da tabela §10; nenhuma informação só no som; variação nos repetitivos.

**Texto (língua)**
- [ ] Português do Brasil impecável, com acentos; nomes de território e potência por extenso (nunca id); tom de jogo,
      claro e respeitoso; números em pt-BR ("1,45 °C", "−3", "120 milhões").

### 11.3 NUNCA FAÇA
1. Escrever **LEGO, Roblox, Among Us, Gartic, Nintendo, EA** ou nome de outro estúdio/jogo em qualquer coisa que apareça no
   jogo (tela, créditos de estilo, comentários visíveis, nomes de arquivo exibidos).
2. Imitar logotipo, personagem, boneco de marca (cabeça cilíndrica com pino, mão em "C"), silhueta do tripulante com visor,
   letreiro "EMERGENCY MEETING", selo "I VOTED", vinheta de emissora real ou o relógio do Bulletin of the Atomic Scientists.
3. Usar o **emblema ou a bandeira da ONU**, a **cruz vermelha** ou bandeiras nacionais pintadas nos territórios.
4. Cartas que viram ou confete de papel como linguagem principal (é a cara do jogo anterior); Lilita One.
5. Quiz, letras A/B/C/D, "certo/errado" ou cronômetro apertado nos dilemas e decisões de governo.
6. Forma crua: caixa sem chanfro, cilindro sem pino, círculo chapado como "ícone", traço grosso feito à mão, degradê genérico,
   sombra borrada como único relevo, **emoji do sistema** (use os ícones Fluent ou SVG próprio).
7. Preto puro (`#000`) em contorno, texto ou área grande; texto branco sem contorno sobre cor clara ou sobre o mapa.
8. Cor sozinha para identificar equipe, estado, categoria ou voto; equipe identificada por letra; vermelho×verde sem ✓/✕.
9. Cor saturada fora das potências (território neutro, categoria, objeto neutro); azul, ciano ou branco como cor de equipe.
10. Texto abaixo de 18 px em 1366×768; Nunito abaixo de 700; itálico; frases em caixa-alta; ids técnicos na tela.
11. Painel sólido sobre terra habitada na visão geral; véu acima de 55%; `backdrop-filter` sobre o mapa; informação essencial
    só no passar do mouse.
12. Armas, tanques, soldados, mira, explosão, caveira, sangue, risco biológico, "eliminado", "PERDEDOR", "último lugar".
13. Caricatura de povos (chapéus típicos como fantasia, sotaques, estereótipos); pessoas deslocadas como multidão sofrendo.
14. Animais-símbolo como emblema de país (águia, dragão, urso, elefante).
15. `bounce.out` de três quiques em tijolo; "ondinhas" deslizando no mar; letreiro rolando sem parar; fita zebrada correndo.
16. Mais de uma animação grande ao mesmo tempo em cantos diferentes do telão; animação não pulável acima de 1,2 s.
17. Bloom ou profundidade de campo no mapa jogável; `metalness` em plástico; pino projetando sombra; fresta física entre peças.
18. Alarme repetido (cada limiar toca uma vez); música com letra; som estridente no erro.
19. Pizza ou rosca para comparar potências; escala vermelho→verde; gráfico sem rótulo e sem fonte.
20. Mexer em `js/simulacao.js`, `conteudo/*`, `docs/DESIGN.md`, `ferramentas/validar-conteudo.mjs` ou `teste-simulacao.mjs`
    para "acertar" a arte: peça pelo contrato e registre a pendência.

---

## 12. Quem usa o quê (atalho por frente)

| Frente | Seções que mandam no seu trabalho | Entregas visuais principais |
|---|---|---|
| Fundação | §2, §3, §5.1–5.3, §5.5, §9, §11 | tokens, `.peca`, botões, painéis, abas, balões, avisos, faixa, `FORMAS`, `corDe`, `formaDe`, foco duplo, `--fs-min` |
| Ilustração e identidade | §4 inteira, §8.2, §11.2 (kit) | receita de render, kit (a) P0 → P1, ornamentos (b), padrões, gráficos e medidores em SVG, logotipo |
| Mundo 3D | §2.4–2.7, §2.9, §6, §9 (tijolo, montar, onda), §11.2 (mundo) | mesa anil, moldura, oceano, casa × parceiro, torres, clima, construções, alvos, câmera |
| Bonecos e cenas | §7, §8.1, §5.13, §5.15, §5.16 | boneco, computador, âncora, conselheiros, retratos, mascote, lobby, provador, revelação, pódio, sala da ONU |
| Partida (HUD) | §5.4, §5.6–5.9, §5.19 | coluna placar + painel da vez, barra de ações, ficha da ação, faixa de instrução, letreiro |
| Plantão Global | §4.5 (vinheta, tarja, Jornal Mundial), §5.10 | vinheta, bancada com âncora, tarja, "Você sabia?", escolhas |
| Dilemas | §2.8, §5.11, §7.5 | gabinete, cartões de conselheiro, carimbo "DECIDIDO", porquê e conceito |
| ONU | §5.12, §4.5 (carimbos), §9.1 (tijolinho de voto) | convocação, painel de votação, voto secreto, revelação, COP |
| Relatórios | §4.7, §4.8, §5.14, §5.15 | balanço em passos, cascata, emissões, fim, pódio, foto oficial |
| Telas | §5.13, §5.16, §5.17, §8 | início com logotipo e mascote, lobby, provador, revelação, ajustes, professor |
| Manual | §5.18, §4.6 (planta de montagem) | livro de instruções, abas, passos numerados |
| Som e créditos | §10 | trilhas, efeitos, mixagem, créditos (sem nome de marca) |

**Pedidos a outras frentes (registrados como pendência, ninguém edita o arquivo alheio):**
- **Conteúdo / Motor** (`conteudo/politicas.js`): campo `curto` para o nome no tijolo de ação (≤ 2 linhas de 10 caracteres,
  com `\n` onde quebrar; ex.: "Desmata-\nmento zero", "Obras no\nexterior", "Crime trans-\nnacional", "Indígenas e\nquilombolas");
  campo `curto` em `conteudo/territorios.js` para rótulos de mapa (≤ 2 linhas de 14). As cores de `CATEGORIAS.cor` e
  `potencias.cor` ficam obsoletas: a interface usa os tokens deste guia.
- **Bonecos:** acrescentar o chapéu `capacete-paz`, as expressões `pensativo`, `determinado` e `falando`, a cabeça de monitor
  do computador e os acessórios de mão.
- **Mundo 3D / gerador:** `MAPA.profundidade` (batimetria do Natural Earth) em `ferramentas/gerar-mapa.mjs`.
