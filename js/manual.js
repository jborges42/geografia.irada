'use strict';
/* ESQUELETO da Fundação: o dono da frente substitui.
   Manual do Diplomata (js/manual.js, css/manual.css, manual.html): no esqueleto, um painel com uma aba por capítulo de
   conteudo/manual.js (marcadores {{...}} trocados pelos valores de Simulacao.PARAM).
   Contrato: Manual.abrir(aba?). */

const Manual = (() => {
  const valor = chave => {
    const v = chave.split('.').reduce((o, k) => o?.[k], typeof Simulacao !== 'undefined' ? Simulacao.PARAM : null);
    return typeof v === 'number' ? fmt(v, Number.isInteger(v) ? 0 : 1) : v ?? '';
  };
  const html = h => String(h).replace(/\{\{([\w.]+)\}\}/g, (_, k) => valor(k));

  function abrir(aba) {
    const caps = typeof MANUAL !== 'undefined' ? MANUAL : [];
    const p = document.createElement('section');
    p.className = 'painel peca pinos painel-g esq-manual';
    p.setAttribute('aria-labelledby', 'esq-manual-titulo');
    p.innerHTML = `<header class="painel-cab"><h2 class="painel-titulo" id="esq-manual-titulo">Manual do Diplomata</h2>
      <button class="btn btn-ic peca" aria-label="Fechar o manual">${GLIFOS.fechar}</button></header>
      <div class="esq-manual-corpo">
        <div class="abas verticais" role="tablist" aria-orientation="vertical" aria-label="Capítulos">${caps.map((c, i) =>
          `<button class="peca" role="tab" id="esq-aba-${c.id}" aria-controls="esq-cap-${c.id}" aria-selected="${c.id === aba || (!aba && i === 0)}">${esc(c.titulo)}</button>`).join('')}</div>
        <div class="tela">${caps.map(c => `<article id="esq-cap-${c.id}" role="tabpanel" aria-labelledby="esq-aba-${c.id}" tabindex="0" hidden>${html(c.html)}</article>`).join('')}</div>
      </div>`;
    p.querySelector('.btn-ic').onclick = () => fecharPainel(p);
    ativarAbas(p.querySelector('[role="tablist"]'));
    return abrirPainel(p, { esc: true });
  }
  return { abrir };
})();
