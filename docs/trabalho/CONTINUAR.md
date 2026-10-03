# Onde paramos (02/10/2026, 12h45)

## Pronto
- Motor com dilemas (sem quiz), 66 dilemas, 48 eventos, 13 potências, 32 territórios neutros e relações bilaterais, equilíbrio dentro das metas (`node teste-simulacao.mjs 300`).
- Conteúdo validado (`node ferramentas/validar-conteudo.mjs`): fichas, manual, BNCC, COMO-JOGAR.md, BNCC.md.
- Guia de arte (docs/GUIA-DE-ARTE.md), Fundação (css/base.css, index.html), Ilustração (img/arte, js/arte.js, css/arte.css),
  Mundo 3D (js/mapa3d.js), Bonecos e cenas, Som e créditos, Telas, Dilemas, Manual.
- Logo oficial aplicada (img/marca/, logo() em js/icones.js, mascote com as cores da marca).
- Otimizações de desempenho já aplicadas: ver docs/trabalho/DESEMPENHO.md (FPS no PC escolar simulado, mandato 6: 27 → 47;
  draw calls 811 → 407; Three.js 1089 → 886 KB).

## Interrompido no meio (arquivos válidos, mas incompletos)
- Partida (js/jogo.js, js/hud.js, css/jogo.css, teste.mjs), Plantão (js/plantao.js), ONU (js/onu.js), Relatórios (js/relatorios.js).
- Agente de desempenho: faltou terminar e aplicar as recomendações nos módulos.

## Próximos passos
1. Terminar Partida, Plantão, ONU e Relatórios.
2. Integração: ligar tudo, aplicar docs/trabalho/PENDENCIAS-LOGO.md e as recomendações de DESEMPENHO.md, `node teste.mjs` sem erros.
3. Refinamento visual com o crítico de estúdio (até 3 rodadas) e verificação final.
O roteiro da construção (workflow) é retomável: as etapas prontas voltam do cache.
