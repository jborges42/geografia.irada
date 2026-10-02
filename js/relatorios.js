'use strict';
/* ESQUELETO da Fundação: o dono da frente substitui.
   Relatórios (js/relatorios.js, css/relatorios.css): balanço do mandato, fim, pódio e gráficos em SVG.
   No esqueleto, o balanço é uma faixa e o fim volta ao início.
   Contrato: Relatorios.balanco(e, rel) → Promise · Relatorios.fim(e, avatares) → 'revanche' | 'novo' | 'inicio' ·
   Relatorios.linha(...), Relatorios.barras(...) → SVG. */

const Relatorios = (() => {
  const balanco = async (e, rel) => splash({ pre: 'Balanço do mandato', titulo: fmtAno(rel?.ano ?? e.ano), sub: 'O mundo mudou', cor: 'anil' });
  const fim = async () => 'inicio';
  const vazio = () => '<svg class="grafico" viewBox="0 0 100 50" role="img" aria-label="Gráfico"></svg>';
  return { balanco, fim, linha: vazio, barras: vazio };
})();
