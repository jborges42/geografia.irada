# Desempenho — Geografia Irada (rascunho em andamento)

Medições de base (antes) já feitas; otimizações em aplicação. Ferramentas em `scratchpad/perf/` (medir.mjs, longa.mjs, sonda.js, exp2.mjs, perfil.mjs).

## Longa duração (vitrine-mapa, 8 mandatos, GPU do Mac, 1920×1080) — ANTES
| mandato | construções | heap MB | geometrias | draw calls | triângulos | DOM | rótulos | CPU/quadro ms | GPU/quadro ms |
|---|---|---|---|---|---|---|---|---|---|
| início | 0 | 9,6 | 166 | 477 | 1,75 M | 265 | 31 | 9,6 | 184 |
| 2 | 23 | 12,2 | 320 | 581 | 1,95 M | 388 | 133 | 11,1 | 187 |
| 4 | 47 | 13,8 | 431 | 685 | 2,17 M | 425 | 140 | 14,8 | 210 |
| 6 | 73 | 13,1 | 521 | 811 | 2,38 M | 446 | 147 | 13,0 | 168 |
| 8 | 73 | 13,3 | 526 | 811 | 2,38 M | 448 | 148 | 14,5 | 144 |

Achado: não há vazamento de heap (estável ~13 MB) nem de timers/listeners; o que cresce é o trabalho por quadro:
draw calls +70%, triângulos +36%, CPU por quadro +50% (cada construção = 2–3 malhas, ×2 com a sombra) e ~150 rótulos
HTML reposicionados a cada quadro. Na máquina escolar (CPU 4×) isso vira 40 → 58 ms por quadro só de CPU.

## Aplicado até agora (rascunho)
- js/mapa3d.js: quadro econômico (30 q/s quando calmo e longe) + sombra em cache (needsUpdate só quando muda; ~15/s calmo);
  LOD dos pinos (terra, espuma, moldura) na visão geral; rótulos só escrevem no DOM o que mudou; números flutuantes por
  transform (sem layout); mouse com 1 teste de raio por quadro; cor das partículas sem converter texto a cada quadro.
- js/bonecos.js: piscar/falar sem material.needsUpdate.
- js/cenas3d.js: cache de retratos com teto de 240.
- ferramentas/gerar-three.mjs + lib/three.min.js: exporta só o usado (1089 → 886 KB), com conferência automática.
- ferramentas/gerar-modelos.mjs + dados/modelos.js: decodificação base64 241 ms → 4 ms (CPU 4×).
Longa duração no perfil escola (CPU 4×, 1366×768): FPS da página no mandato 6: 27 → 47; draw calls por quadro de página 811 → 407.
