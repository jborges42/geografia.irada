'use strict';
/* ESQUELETO da Fundação: o dono da frente substitui.
   Dilemas de governo (js/dilemas.js, css/dilemas.css): o gabinete com os conselheiros. No esqueleto, a vez não mostra
   dilema (resolve null) e a jogada do computador não anima.
   Contrato: Dilemas.vez(e, pid) → Promise; Dilemas.mostrarIA(e, pid, { id, opcao }) → Promise curta; data-teste opcao-<n>. */

const Dilemas = (() => {
  const vez = async () => null;
  const mostrarIA = async () => {};
  return { vez, mostrarIA };
})();
