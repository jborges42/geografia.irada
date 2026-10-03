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
  O jogo não pode ficar mais lento com o tempo: nada cresce sem limite durante a partida (dispose, pools, instancing,
  tweens e listeners removidos). Recomendações medidas para todos os módulos em
  `docs/trabalho/DESEMPENHO.md` (a integração aplica).
  Trocas pendentes da logo oficial: `docs/trabalho/PENDENCIAS-LOGO.md` (a integração aplica).
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
`css/plantao.css`, `css/dilemas.css`, `css/onu.css`, `css/relatorios.css`, `css/manual.css`.

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
  `pronto` (Promise). Clique e passar devolvem `{ id, x, y }`. Extras: `vez(pid)`, `posicaoNaTela(id)`, `EQUIPES`, `ACOES()`,
  `EFEITOS()`, 3º parâmetro opcional de `efeito` (`{ pid, de, para }`).
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
  canvas ou textura do Three.js), `ICONES_BOTAO.som|mudo|pausa|tocar` (SVG). `logo(variante = 'completa', classe?)` → `<img>` da logo oficial (`img/marca/`; variantes `completa`, `emblema`, `palavra`, `horizontal`; `logo(classe)` continua valendo); `animarLogo(el)` → entrada da logo.
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
- Diplomacia (13 potências, relações −100..+100; DESIGN §5.6): `relacao(e, a, b)` · `rotuloRelacao(v)` → `{ texto: 'Aliada'|'Amiga'|'Cordial'|'Fria'|'Tensa'|'Hostil', nivel }` ·
  `relacoesDe(e, pid)` → `[{ id, valor, rotulo, aliada, sancionada, comercio }]` (do maior ao menor) · `metaCop(e)` (pontos mínimos na COP).
  `jogarCarta` devolve também `reacoes: [{ quem, para?, tipo: 'relacao'|'aliados'|'apoio'|'furaram'|'retaliacao'|'corrida', texto }]`,
  `relacoes: [{ a, b, antes, depois }]` e, nas cartas de acordo/aliança, `aceita`; em `mudancas` entram `{ quem: a, v: 'relacao', de: b, antes, depois, motivo }`.
  `balanco` devolve `diplomacia: { relacoes: [{ a, b, antes, depois, motivo }], contagio: [{ de, para, valor }], incidentes: [{ tipo, a, b, texto }] }`.
  Cartas com alvo potência: `cupula_bilateral`, `acordo_bilateral`, `exercicio_conjunto`, `espionagem`, `embargo_tecnologico` (além de sanções, tarifas e aliança); o campo `diplomacia` de cada carta (conteudo/politicas.js) diz como o mundo reage.
  Partida salva com `estado.versao < 3` (6 potências) é descartada ao carregar.
- `e.historico` = foto de cada ano (global e potências) para os gráficos; `e.manchetes` = Jornal Mundial;
  `e.bncc` = contagem de habilidades trabalhadas; `e.construcoes` = `[{ carta, potencia, alvo, ano }]` (o mundo 3D
  monta um objeto por ação e reconstrói tudo ao carregar uma partida salva).

## Conteúdo (formatos)

- `conteudo/dilemas.js`: `const DILEMAS = [{ id, titulo, texto, icone, conceito, local?, condicoes?, potencias?, bncc, opcoes: [{ texto, resumo, categoria, efeitos }] }]` (formato final no cabeçalho do arquivo).
- `conteudo/fichas.js`: `const FICHAS = { [id]: { resumo, fatos: [{ texto, fonte }] } }` para as 13 potências e os 32 territórios (a Antártida incluída)
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
- Relações bilaterais: efeitos `rel.china`, `rel.alvo`, `rel.local`, `rel.rivais`, `rel.aliados`, `rel.todos` (dilemas e decisões de eventos) e `rel.china.eua` (par explícito, em eventos); o motor aplica em `efeitoRelacao` e a relação de fábrica vem de `RELACOES` em `conteudo/potencias.js` (veja DESIGN §5.6).
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
  `pular`, `menu`, `continuar-jogo`, `sair`, `revanche`, `novo-jogo`, `inicio`; Manual: `manual-<aba>`, `fechar-manual`.

## Catálogo de componentes (Fundação: `css/base.css` + `js/ui.js`)

Vitrine com todos os componentes, estados e conteúdo do jogo: `ferramentas/vitrine-ui.html` (`?p=1..7` mostra uma prancha só,
16:9). Unidade `--u` = 1% da altura do palco 16:9 (10,8 px em 1080p, 7,68 px em 768p): use `calc(N * var(--u))` em tudo.
**Regras:** toda peça é plástico (face + lateral + contorno índigo + brilho); **pinos só em peça de ação**; texto sobre cor
saturada ou sobre o mapa/mesa = `.letra-bolha`; nada abaixo de `--fs-min`; cor nunca sozinha (forma, ícone ou palavra junto).
Painel por cima do jogo **só** com `abrirPainel`/`fecharPainel` (nada de `<dialog>.showModal()`). Os nomes `esq-*` são dos esqueletos.

### Fichas de design (`:root` em `css/base.css`)
- **Tipografia:** `--f-marca` (Titan One: só letreiros), `--f-titulo` (Fredoka 700), `--f-texto` (Nunito 800–900, todos os números);
  `--fs-mega` 14u · `--fs-faixa` 11u · `--fs-h1` 6,5u · `--fs-h2` 4,4u · `--fs-cartao` 3,4u · `--fs-corpo` 2,8u · `--fs-min` máx(18 px, 2,2u);
  `--lh-titulo` 1,05 · `--lh-opcao` 1,18 · `--lh-texto` 1,3. `--texto` (1; 1,15; 1,3) multiplica h2 → min ("Texto grande", em `:root`).
- **Mesa e véus:** `--mesa-topo/-meio/-base`, `--mesa-crise-*`, `--mesa-colapso-*`, `--mesa` (degradê pronto), `--noite`, `--pinos-mesa`, `--veu` (máx. .55).
- **Interface:** `--tinta` `--tinta-suave` `--ladrilho` `--ladrilho-2` `--ladrilho-lado` `--placa-escura` `--encaixe` `--amarelo` (+`-lado`,
  `-claro`, `-texto`) `--verde-ok` (+`-lado`) `--verde-texto` `--vermelho-alerta` (+`-lado`) `--vermelho-texto` `--cinza-peca` (+`-lado`)
  `--ganho` `--perda` · faixas `--bom` ✓ `--medio` ! `--risco` !! `--critico` ✕ · estados `--crise` `--colapso` `--conflito` `--foco-tensao`
  `--paz` `--sancionado` `--vetada` `--sem-maioria` `--pessego-alerta` `--zebra` (fita parada).
- **Potências:** `--cor-<pid>`, `--cor-<pid>-lado`, `--cor-<pid>-clara`, `--cor-<pid>-contorno` (pid = brasil, eua, china, ue, india, russia)
  e o atalho `--<pid>`. **Categorias:** `--cat-<id>`, `--cat-<id>-lado`, `--cat-<id>-brilho` (diplomacia, economia, natureza, seguranca,
  pessoas, ciencia). **Continentes:** `--cont-<an|as|eu|af|ai|oc|po>` e `-b`. **Mundo:** `--oceano-0..4`, `--espuma`, `--rejunte`, `--moldura`.
  **Objetos:** `--ouro/-prata/-bronze` (+`-lado`), `--peca-preta`, `--grafite`, `--madeira`, `--termo-1..3`, `--relogio-zona`, `--relogio-fim`.
- **Medidas:** espaço `--e1..--e8` (0,4u · 0,8 · 1,2 · 1,6 · 2,4 · 3,2 · 4,8 · 6,4) · contorno `--b` (0,45u), `--b-fino` (0,3u) · lateral `--lado`
  (1u) · raios `--raio` (1,4u), `--raio-btn` (1,2u), `--raio-painel` (2,4u), `--raio-balao` (1,6u), `--raio-chip` (0,9u).
- **Sombras:** `--sombra-solta` (peça flutuando sobre o mapa), `--sombra-chip`, `--rebaixo`, `--anel-foco`.
- **Camadas (z):** `--z-mundo` 0 · `--z-rotulos` 1 · `--z-cena` 5 · `--z-telas` 10 · `--z-camada` 20 · `--z-splash` 40 · `--z-aviso` 50 · `--z-chuva` 60.
- **Tempo:** `--t-aperta` 70 ms · `--t-solta` 160 · `--t-passa` 120 · `--t-entra` 420 · `--t-sai` 220 · `--t-mola` 450; curvas `--c-saida`
  (power2.out) `--c-entrada` (power2.in) `--c-suave` (sine.inOut) `--c-volta` (back.out 1,7) `--c-quique` (back.out 3) `--c-mola`.
- **Contexto de cor:** `[data-equipe="<pid>"]` e `.cat-<id>` definem `--cor`/`--cor-lado` (e `--cor-clara`); cores prontas `.amarela`
  `.verde` `.vermelha` `.cinza` `.creme` `.branca` `.escura` `.anil` `.ouro` `.prata` `.bronze`. `:root[data-contraste="alto"]` = contraste alto.

### Peças-base
| Classe | O que faz |
|---|---|
| `.peca` | Plástico de frente; cor por `--cor`/`--cor-lado` (não herda do pai). `.flutua` (sombra sobre o mapa), `.fina` (lateral baixa), `.cor-herdada` (usa a cor do pai) |
| `.pinos` | Pinos na borda de cima, na cor da face (`.grandes` para passo maior). Só em peça de ação |
| `.letra-bolha` | Miolo branco + contorno índigo; `.pequena` (traço maior), `.relevo` (sombra dura, títulos ≥ h2), `.no-mapa` |
| `.marca` · `.num` | Titan One em caixa-alta · Nunito 900 com algarismos tabulares |
| `.soquete` | Encaixe redondo para ícone (`--soquete` = cor) |
| `.ico` · `.glifo` · `svg.forma` | Ícone Fluent (`imgIcone`) · glifo SVG de `GLIFOS` · forma da equipe (`formaDe`) |
| `.rebaixo` · `.so-leitor` | Área rebaixada · texto só para leitor de tela |
| `.is-hover` `.is-ativo` `.is-foco` | Força o estado (vitrine, tutorial) |

### Componentes (HTML de exemplo)
```html
<!-- Botões (tijolos): principal amarelo = o que avança; confirmar verde (✓); perigo; neutro (secundário); mini; ícone -->
<button class="btn btn-principal peca pinos" data-teste="encerrar-vez">Encerrar vez</button>
<button class="btn btn-confirmar peca pinos">${GLIFOS.ok} Votar sim</button>
<button class="btn btn-perigo peca pinos">Vetar!</button>
<button class="btn btn-neutro peca">Cancelar</button>
<button class="btn btn-neutro btn-mini peca">Por quê?</button>
<button class="btn btn-ic peca redondo" aria-label="Aproximar">${GLIFOS.mais}</button>
<!-- desativado simples: disabled · desativado com motivo: focável, listrado, cadeado e motivo por extenso -->
<button class="btn btn-principal peca pinos bloqueado" aria-disabled="true" aria-describedby="m1">Negociar
  <span class="cadeado">${imgIcone('🔒')}</span><span class="motivo" id="m1">Falta 1 CP</span></button>

<!-- Tijolo (ação da barra, modo do lobby, rodadas): estados aria-pressed="true" (.sel), .bloqueado, .usado; .baixo e .grande -->
<button class="tijolo peca pinos cat-natureza" aria-pressed="true" data-teste="acao" data-id="desmatamento_zero">
  <span class="soquete">${imgIcone('🌳')}</span><span class="nome">Desmata-&#10;mento zero</span>
  <span class="bandeja"><i class="pino-cp"></i><i class="pino-cp"></i> ${imgIcone('💻')}1</span></button>
<button class="tijolo baixo peca pinos"><span class="soquete">${imgIcone('🧳')}</span><span class="nome">Missão</span><span class="preco">1</span></button>
<!-- bloqueado: <span class="falta">${imgIcone('💻')}!</span> na bandeja + <span class="cadeado">…</span> · usado: <span class="selo ok">${GLIFOS.ok}</span> -->

<!-- Painel (tablet): moldura na cor do contexto + tela creme. Tamanhos .painel-p (64u) .painel-m (110u) .painel-g (150u) -->
<section class="painel peca pinos painel-g" data-equipe="brasil" aria-labelledby="t1">
  <header class="painel-cab">${arte('maleta', { classe: 'painel-objeto' })}
    <h2 class="painel-titulo" id="t1">Gabinete do Brasil<small class="painel-sub">Decisão do mandato</small></h2>
    <button class="btn btn-ic peca" aria-label="Fechar">${GLIFOS.fechar}</button></header>
  <div class="tela">…</div>
  <footer class="painel-rodape"><span class="dica">Não há resposta certa.</span><button class="btn btn-principal peca pinos">Escolher</button></footer>
</section>
<hr class="divisoria">  <!-- fileira de pinos entre seções; .vertical entre peças lado a lado; --pino-cor muda a cor -->

<!-- Abas (setas trocam: ativarAbas(lista, aoTrocar)); .abas.verticais para marcadores de página -->
<div class="abas" role="tablist" aria-label="Capítulos">
  <button class="peca" role="tab" aria-selected="true" aria-controls="a1">${imgIcone('📍')} Perto de você</button>
  <button class="peca" role="tab" aria-selected="false" aria-controls="a2">Mundo todo</button></div>
<div id="a1" role="tabpanel">…</div><div id="a2" role="tabpanel" hidden>…</div>

<!-- Pílula (custo, efeito, categoria, prévia) e selo redondo (estado, posição) -->
<span class="pilula amarela"><i class="pino-cp"></i><i class="pino-cp"></i> 2 CP</span>
<span class="pilula ganho">${imgIcone('🌳')} Ambiente +5</span>  <span class="pilula perda">Economia −1</span>
<span class="pilula cat-natureza">${imgIcone('🌱')} Natureza e Energia</span>  <span class="pilula fantasma">Cooperação 45 → 49</span>
<span class="pilula" data-equipe="brasil">${formaDe('brasil', { branca: true })} Parceiro do Brasil</span>
<span class="pilula alerta ao-vivo">AO VIVO</span>  <span class="pilula escura">Computador</span>
<span class="selo grande" data-nivel="risco">!!</span>  <span class="selo ouro">1º</span>  <span class="selo ok">${GLIFOS.ok}</span>

<!-- Contador com ícone; cronômetro -->
<span class="contador peca"><span class="soquete">${imgIcone('🌾')}</span><b>4</b><span class="so-leitor">alimentos</span></span>
<span class="contador peca amarela"><span class="soquete"><i class="pino-cp"></i></span><b>5</b><span class="rot">CP</span></span>
<span class="cronometro peca acabando" role="timer">0:04</span>

<!-- Barra de tijolinhos: --n = tijolinhos cheios (inteiro), --total; cor por data-nivel ou data-equipe; .limiar em % -->
<span class="seg" role="meter" aria-label="Comércio" aria-valuemin="0" aria-valuemax="10" aria-valuenow="6" data-nivel="bom"
  style="--n:6;--total:10"><i class="limiar" style="left:40%"></i><i class="limiar" style="left:75%"></i></span>
<span class="zebra"></span>  <!-- fita parada de crise, na borda de baixo da peça (position: relative) -->

<!-- Balão (ficha, dica, fala): ponta em cima por padrão; data-ponta="baixo" | "nenhuma"; --ponta-x posiciona a ponta -->
<div class="balao peca flutua" role="tooltip"><span class="balao-tit">${imgIcone('🌾')} África Ocidental</span>Parceira da China</div>

<!-- Lista de opções (alternativa ao mapa): role radio + aria-checked (ou aria-pressed); .bloqueado com o motivo no detalhe -->
<div class="lista-opcoes" role="radiogroup" aria-label="Territórios">
  <button class="opcao peca" role="radio" aria-checked="true" data-teste="alvo" data-id="cone_sul"><span class="soquete">${imgIcone('🌽')}</span>
    <span><span class="opcao-nome">Cone Sul</span><span class="opcao-detalhe">América do Sul · influência 3 de 4</span></span>
    <span class="opcao-fim"><span class="marcador">${GLIFOS.ok}</span></span></button></div>

<!-- Campo, interruptor (switch), alternador (2 a 4 posições), deslizante e linha de ajuste -->
<label class="campo"><span class="campo-rotulo">Nome da equipe <span class="campo-conta">12/14</span></span><input class="entrada" maxlength="14"></label>
<div class="ajuste"><span>${imgIcone('🔊')} Música</span>
  <button class="interruptor" role="switch" aria-checked="true" aria-label="Música"><span>Não</span><span>Sim</span></button></div>
<span class="alternador" role="radiogroup" aria-label="Tamanho do texto"><button role="radio" aria-checked="true">Normal</button>
  <button role="radio" aria-checked="false">Maior</button><button role="radio" aria-checked="false">Enorme</button></span>
<input class="deslizante" type="range" min="0" max="100" value="60" style="--v:60%" aria-label="Volume">  <!-- --v segue sozinho ao arrastar -->

<!-- Retrato do boneco (Cenas3D.retrato): anel na cor da equipe e forma no canto; sem imagem, a forma grande -->
<span class="retrato medio" data-equipe="china"><img src="${url}" alt="">${formaDe('china')}<span class="cpu">${imgIcone('💻')}</span></span>
<span class="retrato" data-equipe="brasil">${formaDe('brasil', { classe: 'vazio' })}</span>  <!-- .medio 6,8u · .grande 14u · --tam -->

<!-- Carimbo (placa com borda dupla, −8°): .verde .vermelho .vetada .cinza .indigo; .grande .pequeno; anime com carimbar(el) -->
<span class="carimbo verde grande">${GLIFOS.ok} Aprovada</span>  <span class="carimbo vetada">${imgIcone('✋')} Vetada</span>
<span class="carimbo indigo">Decidido</span>

<!-- Faixa de anúncio: use splash(); a mesma peça serve estática. .raios = sol de raios girando atrás -->
<div class="faixa peca pinos anil"><span class="faixa-icone soquete">${imgIcone('🌍')}</span>
  <div class="faixa-textos"><div class="faixa-pre letra-bolha">Começa o mandato</div><div class="faixa-titulo letra-bolha">2030</div>
  <div class="faixa-sub letra-bolha">Mandato 2 de 6</div></div></div>
```
Avisos: `aviso(texto, { tipo: 'bom' | 'ruim' | 'neutro', icone })` cria `.aviso.peca.flutua` em `#aviso` (máx. 2). `escolha()` usa
`.escolhas`; `esperarContinuar()` cria `.btn-continuar` com `data-teste="continuar-painel"`.

### Auxiliares de `js/ui.js` (novos e ajustados)
- `RAPIDO` (`?rapido`): GSAP 10× e `espera(ms)` ÷ 10. `RM`: pedido do sistema **ou** `gravarPref('movimento-reduzido', true)` (vale ao
  recarregar; põe `.rm` em `<html>`). **RM tira movimento, não tempo de leitura:** nada de `timeScale` no RM; cada animação troca
  movimento por dissolve de 150–200 ms e mantém as pausas (a aceleração global antiga do RM saiu).
- Números: `FINO` (espaço fino), `fmtAno(2030)` → "2030" (`fmt` daria "2.030"), `fmtGraus(1.45)` → "1,45 °C", `fmtMilhoes(120, curto)` →
  "120 mi" / "120 milhões"; `sinal()` continua com o "−" tipográfico. `uPx()` (1u em px), `pxDe('--fs-min')` (ficha em px).
- Cores e formas: `corDe(id, tom)` (id de potência, categoria, continente ou 'amarelo', 'verde', 'vermelho', 'ladrilho', 'anil', 'tinta';
  tom 'cor' | 'lado' | 'clara' | 'contorno' | 'brilho' | 'b' | 'forma'), `formaDe(pid, { branca, classe })` → SVG da forma,
  `nomeEquipe(pid)` → "Equipe Verde", `nomeCurto(pid)` → "EUA", `FORMAS` (caminhos SVG, viewBox 100), `CORES_GUIA` (tabela).
  Ao carregar, `POTENCIAS[i].cor` e `CATEGORIAS[id].cor` passam a valer as cores do guia.
- `GLIFOS.ok | nao | fechar | seta | voltar | mais | menos` (SVG com contorno; nenhuma fonte tem ✓ ✕ →). `fontesProntas` (Promise das 3 fontes).
- Painéis: `abrirPainel(el, { esc, veu = true, foco, som })` → Promise (fim da entrada): põe o painel em `#camada` (centralizado; o módulo
  pode ancorar), cria o véu, deixa inerte o resto da página (ou o painel de baixo), foca `[autofocus]` ou o primeiro controle, `role="dialog"`, e abafa a trilha (`Som.abafar`).
  `esc: true` → Esc fecha; `esc: fn` → Esc fecha e chama `fn`. `fecharPainel(el)` → Promise: a página volta na hora, o foco volta,
  anima e tira painel e véu do DOM (abrir de novo reaproveita o `el`). `fecharPaineis()` fecha tudo sem animação (sair da partida).
- `ativarAbas(lista, aoTrocar)` → `escolher(aba)`; `atualizarDeslizante(el)`; `carimbar(el, { som, tremida })` → Promise (queda com
  giro, martelo, tremida e poeira; RM: dissolve); `tremer(forca)` (trauma; RM: vinheta vermelha de 150 ms); `poeira(el, n)`; `efeitoSom(nome)`
  (seguro sem `Som`).
- Ajustados (mesma assinatura): `splash()` aceita `cor` como id do guia, `raios: true`, tempo padrão 0,8 s + 1 s a cada 15 letras, RM com
  dissolve, Espaço/Enter/PageDown pulam sem acionar o botão em foco · `aviso(texto, ms?, { tipo, icone })` · `confete()` = chuva de
  tijolinhos nas cores das equipes (nada com RM) · `numeroQueSalta()` com duração pelo tamanho da mudança, pulso no fim e `moeda` ·
  `caberNaLargura()` nunca abaixo de `--fs-min` · `mostrarTela()` só mexe em `#telas > .tela` · `escolha()` aceita `teste` e `classe`.
