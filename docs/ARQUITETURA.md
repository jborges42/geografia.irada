# Geografia Irada — arquitetura e contratos (v2)

Site estático, sem build, **scripts clássicos** (variáveis globais, como no Carreira em Jogo), funciona offline,
abrindo o `index.html` direto do disco (`file://`) e publicado na Vercel. Português nos nomes, `'use strict'`, sem
frameworks; animação com GSAP; 3D com Three.js (global `THREE`, gerado por `ferramentas/gerar-three.mjs`).
Comentários curtos, em português. Nada de `<script type="module">`, `import` ou `fetch` de JSON/JS (quebram no `file://`).

**Direção de interface:** jogo 3D estilo Among Us / peças de montar / Roblox (docs/DESIGN.md §12 e o guia de arte).
Nada de "cartas que viram" nem confete de papel como linguagem principal: ações numa barra de tijolos, decisões que
constroem objetos de peças no mapa, plantão em formato de telejornal, ONU numa sala 3D com os bonecos, revelação de
papel, pódio 3D com chuva de tijolinhos. Acabamento de versão final.

## Regras para todos
- **Dono de arquivo:** cada arquivo tem um dono (tabela abaixo). Não edite o que não é seu; use o contrato. Se o
  contrato não bastar, crie o que precisa dentro do seu módulo ou registre a pendência com o pedido exato.
- **Marcas:** nunca escreva LEGO, Roblox, Among Us ou Gartic em nada que apareça na tela, nos créditos de estilo ou nos comentários.
- **Português do Brasil impecável** (acentos!), tom de jogo: claro, divertido, respeitoso, para 15–18 anos.
- **Telão e projetor:** funciona bem em 1920×1080 e 1366×768 (e não quebra em 1280×720 nem em tablet deitado).
  Texto mínimo de 18 px a 1366×768 para o que a turma precisa ler; nada importante escondido só no passar do mouse.
- **Acessibilidade:** botões de verdade (`<button>`), foco visível, ordem de tabulação lógica, `anunciar()` para o
  leitor de tela, cor + forma/ícone (nunca só cor), contraste AA, `RM` (movimento reduzido) respeitado, alternativa
  em lista para tudo o que se escolhe no mapa 3D.
- **Sem erros no console**, sem `alert/confirm/prompt`, sem dependência de rede (tudo local, ativos embutidos).
- **Desempenho:** computador escolar fraco. Modo "gráficos leves" (sem pós-processamento, sem sombras, pixel ratio 1)
  ligado automaticamente se o FPS cair; no máximo 2 contextos WebGL vivos; pause o que não está visível.
- **Ganchos de teste:** todo controle que o teste automático precisa usar tem `data-teste="..."` (lista em §Teste).
- **Cancelamento:** toda espera usa `espera/fim/aguardar` de ui.js (lançam `CANCELADA` quando a partida é encerrada).

## Ordem de carregamento (index.html)

```
lib/three.min.js  lib/gsap.min.js  lib/confetti.min.js
dados/mapa.js  dados/projecoes.js  dados/modelos.js  dados/creditos.js
conteudo/potencias.js  conteudo/territorios.js  conteudo/politicas.js  conteudo/eventos.js  conteudo/resolucoes.js
conteudo/dilemas.js
conteudo/fichas.js  conteudo/manual.js  conteudo/bncc.js
js/icones.js  js/arte.js  js/ui.js  js/audio.js  js/simulacao.js
js/bonecos.js  js/mapa3d.js  js/cenas3d.js  js/mascote.js
js/plantao.js  js/dilemas.js  js/onu.js  js/relatorios.js  js/manual.js  js/hud.js  js/telas.js  js/jogo.js
```
CSS: `css/base.css` (fichas de design + componentes), `css/arte.css` (ornamentos e ilustrações) e um por módulo: `css/telas.css`, `css/jogo.css`,
`css/plantao.css`, `css/onu.css`, `css/relatorios.css`, `css/manual.css`.

## Donos dos arquivos

| Frente | Arquivos |
|---|---|
| Motor e balanceamento | `js/simulacao.js`, `teste-simulacao.mjs`, números de `conteudo/potencias.js`, `territorios.js`, `politicas.js`, `resolucoes.js` |
| Conteúdo | `conteudo/eventos.js`, `conteudo/dilemas.js`, `conteudo/fichas.js`, `conteudo/manual.js`, `conteudo/bncc.js`, `docs/BNCC.md`, `docs/COMO-JOGAR.md` |
| Fundação (sistema de design) | `css/base.css`, `index.html` (esqueleto), acréscimos em `js/ui.js`, `fontes/`, `ferramentas/vitrine-ui.html` |
| Mundo 3D | `js/mapa3d.js`, `dados/modelos.js`, `ferramentas/gerar-modelos.mjs`, `ferramentas/vitrine-mapa.html` |
| Bonecos e cenas | `js/bonecos.js`, `js/cenas3d.js`, `js/mascote.js`, `ferramentas/vitrine-cenas.html` |
| Ilustração e identidade | `js/icones.js`, `js/arte.js`, `css/arte.css`, `img/` (logotipo, ícones, ilustrações e objetos 3D pré-renderizados), `ferramentas/renderizar-arte.mjs`, `ferramentas/vitrine-arte.html` |
| Som e créditos | `js/audio.js`, `som/`, `CREDITOS.md`, `dados/creditos.js`, `ferramentas/vitrine-som.html` |
| Telas | `js/telas.js`, `css/telas.css` (início, lobby, editor de avatar, ajustes, professor, revelação secreta) |
| Partida | `js/jogo.js`, `js/hud.js`, `css/jogo.css`, `teste.mjs` (laço, HUD, barra de ações, alvos, salvar/continuar, pausa) |
| Plantão Global | `js/plantao.js`, `css/plantao.css`, `ferramentas/vitrine-plantao.html` (telejornal dos eventos; sem quiz) |
| ONU | `js/onu.js`, `css/onu.css`, `ferramentas/vitrine-onu.html` |
| Relatórios | `js/relatorios.js`, `css/relatorios.css`, `ferramentas/vitrine-relatorios.html` |
| Manual | `js/manual.js`, `css/manual.css`, `manual.html` |

## Esqueleto da página (index.html) e camadas

```html
<div id="mundo" aria-hidden="true"></div>      <!-- canvas do Mapa3D: fundo de tudo (z 0) -->
<div id="rotulos-mapa"></div>                    <!-- rótulos HTML que acompanham o mapa (z 1) -->
<div id="cena" hidden></div>                     <!-- canvas do Cenas3D: lobby, ONU, revelação, pódio (z 5) -->
<main id="telas">                                <!-- telas de página inteira (z 10); mostrarTela(nome) -->
  <section id="tela-inicio" class="tela"></section>       <!-- Telas -->
  <section id="tela-lobby" class="tela" hidden></section> <!-- Telas -->
  <section id="tela-revelacao" class="tela" hidden></section> <!-- Telas -->
  <section id="tela-partida" class="tela" hidden></section>   <!-- Partida (HUD) -->
  <section id="tela-fim" class="tela" hidden></section>       <!-- Relatórios -->
</main>
<div id="camada"></div>                          <!-- painéis por cima do jogo (z 20): cada módulo cria o seu -->
<div id="splash" hidden>…</div>                  <!-- faixa de anúncio de ui.js (z 40) -->
<div id="aviso" role="status" hidden></div>      <!-- aviso curto (z 50) -->
<div id="anuncio" class="so-leitor" aria-live="polite"></div>
```
Cada módulo monta o próprio HTML por JavaScript dentro do seu contêiner (as telas) ou de um filho criado em `#camada`
(painéis). Painéis usam os auxiliares `abrirPainel(el)` / `fecharPainel(el)` de ui.js (inert no resto, foco, Esc,
animação de entrada e saída) — não use `<dialog>.showModal()` (ficaria por cima da faixa de anúncio).

## Arte (js/arte.js, css/arte.css, img/)
Kit de ilustração do jogo, no estilo do guia de arte: objetos de peças de montar renderizados em 3D (jornal, urna, martelo,
carimbos, troféu, globo, termômetro, relógio, navio, pomba, caixas de recursos…), molduras, fitas, carimbos, selos,
cabeçalhos (Jornal Mundial, Plantão Global), padrões de fundo e estilos de gráfico. `arte(nome, { classe, alt })` → HTML
`<img>`; `ARTE` lista os nomes. Todo módulo usa o kit em vez de desenhar formas cruas.

## Peças compartilhadas (js/ui.js)
`$`, `$$`, `esc`, `RM`, `RAPIDO`, `sortear`, `embaralhar`, `listaNomes`, `fmt`, `sinal`, `loop`, `novaPartidaUI`, `espera`,
`fim`, `aguardar`, `CANCELADA`, `lerPref`, `gravarPref`, `anunciar`, `aviso`, `confete`, `confeteDe`,
`numeroQueSalta`, `caberNaLargura`, `mostrarTela(nome)`, `splash({ pre, titulo, sub, cor, icone, tempo, escuro, som })`,
`pularSplash`, `iniciarTempo/pararTempo/pausarTempo`, `esperarContinuar(onde, rotulo)`, `escolha(onde, opcoes)`,
`abrirPainel(el)`, `fecharPainel(el)`, `corDe(pid)`, `formaDe(pid)` (a Fundação acrescenta os que faltam).
`RAPIDO` (`?rapido` na URL) acelera animações e esperas para o teste automático.

## Contratos dos módulos

Todos recebem o estado `e` quando precisam e devolvem Promises; nenhum salva nem avança a rodada (isso é da Partida).
Avatar = `{ pid, nome, cor, forma, pele, cabelo, chapeu, acessorio, humano }` (`pid` = id da potência).

- **Simulacao** (motor): ver seção própria abaixo.
- **Mapa3D** (js/mapa3d.js) — já existe: `iniciar(el)`, `colorir`, `corBaseDe`, `focar(id)`, `visaoGeral()`, `influencia`,
  `colocarBoneco`, `rotulo`, `lonLatParaXZ`, `territorioEm`, `aoClicar(fn)`, `aoPassar(fn)`. A acrescentar:
  `atualizarMundo(e, { animar })` (cores: neutro por continente, parceiro = cor da potência com padrão/marca que o
  distingue da casa da potência; torres de influência; anéis de conflito; clima: gelo, mar, secas, queimadas; objetos;
  pombas/arcos de cooperação), `construir(construcao, { animar })` → Promise (monta peça por peça o objeto de uma ação de
  `e.construcoes`, ver tabela em mapa3d.js), `destacarAlvos(ids | null)`, `efeito(tipo, id)` → Promise ('tempestade',
  'calor', 'seca', 'enchente', 'mar', 'fogo', 'conflito', 'paz', 'pandemia', 'ciberataque', 'acordo', 'sancao',
  'refugiados', 'petroleo', 'comercio', 'ajuda', 'influencia', 'parceria', 'golpe', 'desinformacao', 'cop', 'onu'),
  `numeroFlutuante(id, texto, cor)`, `bonecos(avatares)` (um por potência na capital), `acaoBoneco(pid, acao)`,
  `modo('inicio' | 'jogo')` (no início a câmera passeia sozinha), `pausar(bool)`, `graficos('bonitos' | 'leves')`,
  `pronto` (Promise). Clique devolve `{ id }` do território/potência.
- **Bonecos** (js/bonecos.js): `Bonecos.criar(avatar)` → `THREE.Group` com `.acao('acenar'|'pular'|'comemorar'|'triste'|
  'votar'|'falar'|'parado')`; listas `Bonecos.PELES`, `CABELOS`, `CHAPEUS`, `ACESSORIOS` (`{ id, nome }`).
  Usado pelo Mapa3D e pelo Cenas3D (fonte única do boneco).
- **Cenas3D** (js/cenas3d.js): renderizador próprio no `#cena`, pausa o mapa enquanto aparece.
  `lobby(avatares)` (delegações numa plataforma), `previa(avatar)` (editor: boneco girando em destaque; atualiza ao
  mudar), `salaONU(e, avatares)` + `votos(votos)` (revelação voto a voto) + `fala(pid)`, `revelacao(avatar, papel)`
  ('diplomata' | 'infiltrado' | 'missao'), `podio(ranking, avatares)` (com chuva de tijolinhos), `fim(vitoria, avatares)`
  (bonecos em fila), `foto(avatares, titulo)` → Promise<dataURL PNG>, `retrato(avatar, { expressao, acao, tamanho })` →
  Promise<dataURL> (retrato do boneco com fundo transparente, guardado em cache: placar, painel da equipe, âncora do
  telejornal, conselheiros dos dilemas, tablet de votação), `esconder()`.
- **Mascote** (js/mascote.js): `Mascote.iniciar(el)`, `Mascote.parar()`, `Mascote.reagir('feliz'|'susto'|'triste')`.
- **Ícones** (js/icones.js, Fluent Emoji 3D, MIT, WebP embutido em base64): `imgIcone(emoji, px?)` → HTML `<img class="ico">`
  (aceita o emoji com ou sem U+FE0F; sem ícone, devolve o próprio emoji), `urlIcone(emoji)` → data URI (para `<img>`,
  canvas ou textura do Three.js), `ICONES_BOTAO.som|mudo|pausa|tocar` (SVG). `logo(classe?)` → HTML do logotipo.
  Créditos de terceiros em `dados/creditos.js` (`const CREDITOS = [{ item, autor, licenca, url, uso }]`), mostrados na tela de créditos.
- **Som** (js/audio.js): `efeito(nome)`, `musica(humor, { intensidade })` com humores `menu`, `jogo`, `tensao`,
  `assembleia` (ou `null`), `vinheta('vitoria'|'derrota'|'rodada')`, `alternarEfeitos()`, `alternarMusica()`.
  Efeitos: carta, certo, errado, clique, virar, voto, tique, vez, tempo, promocao, vitoria, cilada, qualificacao,
  pergunta, estrela, tijolo, pop, moeda, whoosh, plantao, alarme, martelo, reuniao, subir, descer, trovao, pincel.
- **Telas** (js/telas.js): `Telas.inicio()`, `Telas.lobby()` → monta a configuração e chama `Jogo.comecar(config, avatares)`;
  `Telas.revelar(e, avatares)` → Promise (passa o computador de equipe em equipe: missão secreta e, no modo
  infiltrado, o papel); `Telas.professor()`. Configuração = `{ modo, rodadas, missoes, infiltrado,
  desafios, foco, tempoResposta, mediador, jogadores: [{ potencia, nome, bloco }] }`.
- **Jogo** (js/jogo.js, js/hud.js): `Jogo.comecar(config, avatares)`, `Jogo.continuar()`, `Jogo.temSalvo()`,
  `Jogo.estado` (estado atual), `Jogo.config`, `Jogo.avatarDe(pid)`, `Jogo.atualizarHUD({ mudancas })`,
  `Jogo.pausar()`, `Jogo.sair()`. HUD: `Hud.montar()`, `Hud.atualizar(e, { mudancas, vez })`, `Hud.manchete(texto)`.
- **Plantao** (js/plantao.js): `Plantao.noticia(e, { id, local }, mudancas)` → Promise (telejornal + efeito no mapa; escolhas votacao → ONU.votacao, doacao → ONU.doacao, decisao → resolverDecisao).
- **Dilemas** (js/dilemas.js): `Dilemas.vez(e, pid)` e `Dilemas.mostrarIA(e, pid, { id, opcao })` (ver "Dilemas e decisões").
- **ONU** (js/onu.js): `ONU.proporResolucao(e, pid)` → `{ id, alvo } | null` · `ONU.votacao(e, { id, alvo, proponente })`
  → resultado de `Simulacao.votacao` · `ONU.cop(e)` → resultado de `resolverCop` · `ONU.doacao(e, evento, local)` →
  resultado de `resolverDoacao` · `ONU.reuniaoEmergencia(e, pid)` → resultado · `ONU.negociar(e, pid)` → resultado | null.
  Votos de equipes humanas são secretos (passa a vez); computador vota com `iaVoto`/`iaCop`/`iaDoacao`.
- **Relatorios** (js/relatorios.js): `Relatorios.balanco(e, rel)` → Promise (rel = retorno de `Simulacao.balanco`) ·
  `Relatorios.fim(e, avatares)` → 'revanche' | 'novo' | 'inicio' · `Relatorios.linha(...)`, `Relatorios.barras(...)` (SVG).
- **Manual** (js/manual.js): `Manual.abrir(aba?)` (abas: objetivo, como jogar, dilemas, indicadores, ações, territórios, eventos,
  ONU, modos, glossário, projeções, BNCC, professor); `manual.html` imprime tudo.

## Laço da partida (Jogo)
```
Telas.lobby → Jogo.comecar → Simulacao.criarEstado → Telas.revelar (missões / papéis)
rodada: splash do ano → Simulacao.sortearEventos → Plantao.noticia (+ escolha: ONU.votacao | ONU.doacao | decisão de cada potência)
        → se copNestaRodada: ONU.cop
        → para cada pid de ordemDaRodada:
             humano: iniciarVez → Dilemas.vez → barra de ações (jogarCarta; alvos no mapa ou na lista;
                     Mapa3D.construir + números saltando; abrirVotacao → ONU.votacao; mediação com prévia de chanceMediacao;
                     Negociar → ONU.negociar; reunião de emergência → ONU.reuniaoEmergencia) → encerrarVez
             computador: iaJogarVez (já aplicado) → animação curta de cada ação (pulável)
        → Simulacao.balanco → Relatorios.balanco → salvar → verificarFim
fim: Relatorios.fim → revanche | novo (lobby) | início
```

## Motor: `Simulacao` (js/simulacao.js)

Estado `e` é JSON puro (salva com `JSON.stringify`). Funções:

- `criarEstado({ modo, rodadas, jogadores: [{ potencia, nome, bloco }], missoes, infiltrado, foco, semente })`
- `ordemDaRodada(e)` → ids na ordem desta rodada · `copNestaRodada(e)` → bool
- `sortearEventos(e)` → `[{ id, local }]` · `aplicarEvento(e, id, local)` → `{ mudancas, escolha }`
  - escolha `votacao` → `votacao(e, { id: escolha.resolucao, alvo: local, proponente: null }, votos)`
  - escolha `doacao` → `resolverDoacao(e, id, local, { pid: n })` (IA: `iaDoacao(e, pid, recurso)`)
  - escolha `decisao` → `resolverDecisao(e, id, local, { pid: indice })` (IA: `iaDecisao(e, pid, id)`)
- Vez: `iniciarVez(e, pid)` → `{ cp, mao }` · `dilemaDaVez(e, pid)` / `resolverDilema(e, pid, id, indice)` ·
  `custoDe(e, pid, carta)` · `podeJogar(e, pid, carta, alvo)` → `{ ok, motivo }` · `alvosValidos(e, pid, carta)` ·
  `jogarCarta(e, pid, carta, alvo, { aceita, recurso })` · `chanceMediacao(e, pid, alvo)` → `{ ok, mudancas, manchete, abrirVotacao?, sucesso?, aceita? }` ·
  `trocarMao(e, pid)` · `negociar(e, de, para, oferta, pedido)` / `iaAceitaTroca(e, pid, oferta, pedido)` · `encerrarVez(e, pid)`
- Computador: `iaJogarVez(e, pid)` → `[{ tipo: 'dilema', id, opcao, resultado } | { tipo: 'carta', carta, alvo, resultado }]` (já aplicado; a interface só anima)
- ONU: `resolucoesDisponiveis(e, pid)` · `votacao(e, { id, alvo, proponente }, { pid: 'sim'|'nao'|'abst'|'veto' })`
  → `{ aprovada, vetos, sim, nao, abst, votos, mudancas }` (territórios votam sozinhos) · `iaVoto(e, pid, res)` · `iaProposta(e, pid)`
- COP: `iaCop(e, pid)` → 0|1|2 · `resolverCop(e, { pid: 0|1|2 })` → `{ sucesso, soma, mudancas }`
- Infiltrado: `reuniaoEmergencia(e, quemChamou, { pid: acusado })` → `{ acusado, acertou }`
- Fim do mandato: `balanco(e)` → `{ ano, proximoAno, antes, depois, causas, mercado, conflitos, mudancas, emissoes, fim }`
- Fim: `verificarFim(e)` · `resultado(e)` → `{ fim, placar, metas, vencedor | vitoria, blocos, infiltrado, contribuicoes, missoes, selos }` ·
  `placar(e)` · `metas(e)` · `igi(e, pid)` · `selos(e, pid)` · `emissoesDe(p)` · `parceirosDe(e, pid)` · `liderancas(e)` · `nome(id)`
- `mudancas` = `[{ quem, v, antes, depois, motivo }]`: a interface mostra números saltando e o porquê.
- `e.historico` = foto de cada ano (global e potências) para os gráficos; `e.manchetes` = Jornal Mundial;
  `e.bncc` = contagem de habilidades trabalhadas; `e.construcoes` = `[{ carta, potencia, alvo, ano }]` (o mundo 3D
  monta um objeto por ação e reconstrói tudo ao carregar uma partida salva).

## Conteúdo (formatos)

- `conteudo/dilemas.js`: `const DILEMAS = [{ id, titulo, texto, icone, conceito, local?, condicoes?, potencias?, bncc, opcoes: [{ texto, resumo, categoria, efeitos }] }]` (formato final no cabeçalho do arquivo).
- `conteudo/fichas.js`: `const FICHAS = { [id]: { resumo, fatos: [{ texto, fonte }] } }` para as 6 potências e os 33 territórios
  (potências também: `emissoesPerCapita`, `emissoesHistoricas` com fonte, para não culpar ninguém de forma simplista).
- `conteudo/manual.js`: `const MANUAL = [{ id, titulo, icone, html }]` (com marcadores `{{colapso.temperatura}}` etc.,
  trocados pelos valores de `Simulacao.PARAM`) e `const GLOSSARIO = [{ termo, definicao }]`.
- `conteudo/bncc.js`: `const BNCC = { competencias, habilidades: [{ codigo, competencia, texto, relacao, noJogo }], gerais, outras, tcts }`.
- `dados/projecoes.js`: `const PROJECOES = { robinson, mercator, peters }` (caminhos SVG para o Laboratório de projeções).

## Dilemas e decisões
- Motor: `dilemaDaVez(e, pid)` → `{ id, titulo, texto, icone, conceito, local?, opcoes: [{ texto, resumo, categoria }] }` ou `null` ·
  `resolverDilema(e, pid, id, indice)` → `{ mudancas, manchete, porque, conceito }` · `iaDilema(e, pid, dilema)` → índice ·
  `iaJogarVez` devolve `{ tipo: 'dilema', id, opcao }` (já aplicado pelo motor) no lugar de `{ tipo: 'briefing' }`.
- Eventos: `escolha = { tipo: 'decisao', opcoes: [{ texto, resumo, categoria }] }` — todas as potências escolhem um índice ·
  `resolverDecisao(e, idEvento, local, { pid: indice })` → `{ mudancas, manchetes: [texto] }` · `iaDecisao(e, pid, idEvento)` → índice.
- Mediação: `chanceMediacao(e, pid, alvo)` → `{ chance, fatores: [{ texto, valor }] }` (prévia na tela); `jogarCarta` não recebe `acertou`.
- `categoria` ∈ diplomacia, economia, natureza, seguranca, pessoas, ciencia (cor da categoria e conselheiro com o chapéu do tema).
- Interface: `Dilemas.vez(e, pid)` → Promise; `Dilemas.mostrarIA(e, pid, { id, opcao })` → Promise curta; data-teste `opcao-<n>`.
- Saem do motor: temasDoBriefing, registrarBriefing, registrarDesafio, ESPECIALIDADE, resolverDesinformacao, especialista,
  contadores.perguntas/acertos, porTema.

## Teste

- `node teste-simulacao.mjs [n]` — balanceamento do motor (milhares de partidas só com o computador).
- `node ferramentas/validar-conteudo.mjs [tema|eventos|fichas|manual|bncc]` — formato e quantidade do conteúdo.
- `node ferramentas/navegador.mjs <pagina> <saida.png> [larg] [alt] [expressão]` — captura de tela no Chrome sem janela (WebGL pela placa de vídeo, Metal; GI_SOFTWARE=1 força o modo por software)
  (WebGL por software); em script: `import { abrirJogo } from './ferramentas/navegador.mjs'` →
  `nav.js(expr)`, `nav.esperarPor(expr)`, `nav.clicar(seletor)`, `nav.clicarEm(x, y)`, `nav.mover(x, y)`, `nav.teclar(tecla)`,
  `nav.digitar(texto)`, `nav.foto(arquivo)`, `nav.erros`, `nav.fechar()`; `abrirJogo({ arquivo: true })` abre por `file://`.
  Use isso (captura na hora certa) e não `chrome --screenshot --virtual-time-budget`: com o mapa animando sem parar,
  o tempo virtual faz o Chrome renderizar centenas de quadros por software e a captura leva minutos.
- `node teste.mjs` — partida inteira pela interface (`index.html?rapido`), clicando nos `data-teste`, sem erros no console.
- `data-teste` usados: `jogar`, `continuar`, `manual`, `professor`, `modo-<id>`, `rodadas-<n>`, `potencia-<pid>`
  (alterna equipe/computador), `comecar`, `revelacao-ok`, `opcao-<n>`, `acao` (com `data-id`), `alvo` (com `data-id`), `confirmar`, `cancelar`,
  `encerrar-vez`, `trocar-acoes`, `negociar`, `voto-<sim|nao|abst|veto>`, `cop-<0|1|2>`, `doar-<n>`, `continuar-painel`,
  `pular`, `menu`, `sair`, `revanche`, `novo-jogo`, `inicio`.
