# Desempenho — Geografia Irada

Objetivo do cliente: "quanto mais jogamos, mais lento fica" — o jogo tem de rodar em PC escolar fraco (pouca RAM, vídeo
integrado) sem perder nenhuma funcionalidade. Tudo abaixo foi medido no Chrome sem janela (`ferramentas/navegador.mjs`);
o perfil **escola** é CPU 4× mais lenta (`Emulation.setCPUThrottlingRate`) + 1366×768. As ferramentas de medição ficaram no
scratchpad da sessão (`perf/partida-longa.mjs`, `sonda.js`, `longa.mjs`, `ab.mjs`, `diff.mjs`); o método está descrito no fim.

## 1. Partida real e longa (index.html, 8 mandatos, perfil escola)

`partida-longa.mjs` = `teste.mjs` competitivo com 8 mandatos, a mesma semente do motor nas duas versões, medindo a cada
mandato (na vez da equipe, com o mapa visível): heap JS depois do coletor, DOM, tweens GSAP vivos (e quantos animam
elemento que já saiu da página), listeners em window/document, `renderer.info`, FPS do mandato inteiro (plantão, ONU,
vezes do computador, construções) e FPS parado.

### Antes (código integrado de hoje, sem as correções desta rodada)
TABELA_ANTES

### Depois
TABELA_DEPOIS

**O que crescia sem parar e foi corrigido**
1. **Tweens infinitos órfãos (HUD)** — `Hud.decidindo()` criava, a cada vez do computador, um `repeat: -1` na ampulheta e
   trocava o HTML sem matar o anterior: +3,5 tweens zumbis por mandato (31 no fim), cada um escrevendo `transform` 60×/s num
   elemento fora da página e segurando o retrato na memória. Agora: `gsap.killTweensOf` antes de trocar/esconder → 0.
2. **Trabalho do mapa por quadro** cresce com as construções (cada uma = 2–3 malhas, ×2 com a sombra). Já reduzido na
   rodada anterior (quadro econômico, sombra em cache, LOD) e agora os **bonecos** caíram de 34 para 24 malhas cada
   (peças lisas de cada articulação mescladas, cor e rugosidade por vértice): −27% de draw calls no mapa e −31% na sala da ONU.
3. **Relógio do áudio** a 100 Hz o jogo inteiro → 100 Hz só durante fade/ducking, 20 Hz parado.

O que **não** cresce (verificado): heap estável (~+0,7 MB/mandato, é o histórico do motor), listeners globais (zero de saldo),
timers/intervalos (2 fixos), texturas, programas de shader, retratos (cache com teto de 240).
O DOM cresce ~+40/mandato até ~1100 por causa das pílulas de torre do mapa (uma por território × potência, escondidas
quando não cabem): limitado a 39×6, não é vazamento.

## 2. Otimizações aplicadas (todas sem mudar API nem visual do modo bonito)

| Onde | O quê | Ganho medido |
|---|---|---|
| js/mapa3d.js | **Quadro econômico**: com a câmera parada e longe, sem tween 3D, efeito, construção ou mouse, o mapa desenha a ~30 q/s (o mar, a respiração e os navios continuam); em ação, 60 q/s como antes | CPU+GPU do mapa ÷2 parado; FPS da página 27 → 47 no mandato 6 (vitrine, escola) |
| js/mapa3d.js | **Sombra em cache** (`shadowMap.autoUpdate = false`): refeita só quando algo pode ter mudado; calma e de longe, ~15/s. Também acaba com a sombra renderizada 2× por quadro no pós-processamento | draw calls/quadro em voo 1829 → 381 (modo bonito de perto) |
| js/mapa3d.js | **LOD dos pinos** (terra, espuma, moldura) quando cada pino tem < 6 px: 8 lados com o mesmo bisel | triângulos 1,9 M → 0,65 M por quadro na visão geral; captura igual (diferença no ruído) |
| js/mapa3d.js | **Pós-processamento pré-compilado** num momento calmo (tela inicial) | 1º zoom de perto: travada de 995 ms → 83 ms |
| js/mapa3d.js | Rótulos só escrevem no DOM o que mudou; números flutuantes por `transform` (sem layout); 1 teste de raio do mouse por quadro (antes: um por evento, contra todas as construções); cores das partículas sem converter texto | sem recálculo de estilo com a câmera parada |
| js/bonecos.js | **Peças lisas mescladas por articulação** (cor + rugosidade por vértice) | 34 → 24 malhas por boneco; ONU 583 → 405 draw calls/quadro; mapa −27% |
| js/bonecos.js | Piscar/falar troca a textura sem `material.needsUpdate` | sem reavaliar o shader a cada piscada |
| js/cenas3d.js | Cache de retratos com teto (240) | memória limitada no provador |
| js/hud.js | Ampulheta: mata o tween infinito antigo | 31 → 0 tweens zumbis em 8 mandatos |
| js/audio.js | Relógio da mixagem adaptativo (100 Hz em fade/ducking, 20 Hz parado) | −80% de despertares de timer |
| lib/three.min.js | Só o que o jogo usa (`ferramentas/gerar-three.mjs` confere todo `THREE.X`) | 1089 → 886 KB |
| dados/modelos.js | Base64 decodificado com `Uint8Array.fromBase64` (ou laço simples) | 241 → 4 ms na carga (CPU 4×) |

## 3. Recomendações que ficam (medidas, mas não aplicadas por risco ou custo)
- **Instancing/BatchedMesh das construções**: as construções ainda somam ~2,3 malhas cada (até ~130 no fim) — é o que faz
  as draw calls do mapa subirem de 8 mil para ~13 mil/s em 8 mandatos. Um `BatchedMesh` por material levaria isso a ~constante,
  mas mexe na montagem, no desmonte e no dissolve do movimento reduzido.
- **"Leves" sem sombra** (como diz a ARQUITETURA): −30% de draw calls e −13% de CPU no modo leve, ao custo de recompilar os
  shaders na troca (fazer com `renderer.compileAsync` e o laço pausado para não travar).
- **Resolução dinâmica** só no modo leve automático e só quando a GPU é o gargalo (precisa do `EXT_disjoint_timer_query`).
- `js/icones.js` e `js/arte.js` (1,1 MB e 1,6 MB em base64) são avaliados na carga; com servidor, imagens em arquivo
  (`img/`) carregariam sob demanda — no file:// o base64 continua sendo o caminho seguro.

## 4. Metas sugeridas (perfil escola, 1366×768)
- ≥ 45 FPS da página no mandato e nenhuma piora ao longo da partida (hoje: METAS_FPS).
- Mapa ≤ 12 ms de CPU por quadro e ≤ 15 mil draw calls/s no 8º mandato.
- Nenhuma tarefa > 200 ms durante a partida (fora a carga e a 1ª compilação).
- 0 tweens órfãos, saldo 0 de listeners globais, heap < 30 MB no fim.

## 5. Como medir de novo
- Partida longa: `node partida-longa.mjs competitivo --rodadas 8 --cpu 4 --saida x.json` (com `PASTA=<cópia>` para comparar
  versões) e `node tabela-pl.mjs x.json`; `--perfil` grava o perfil de CPU do 3º mandato.
- Visual: capturas antes × depois e `node diff.mjs a.png b.png` (média e % de pixels com diferença > 24).
- Sempre `node teste.mjs competitivo` e `node teste.mjs cooperativo --arquivo --rm` sem erro no console.
