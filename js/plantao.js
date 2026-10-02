'use strict';
/* ESQUELETO da Fundação: o dono da frente substitui.
   Plantão Global (js/plantao.js, css/plantao.css): telejornal dos eventos. No esqueleto, só um aviso com a manchete.
   Contrato: Plantao.noticia(e, { id, local }, mudancas) → Promise. */

const Plantao = (() => {
  async function noticia(e, { id, local } = {}) {
    const ev = typeof EVENTOS !== 'undefined' ? EVENTOS.find(x => x.id === id) : null;
    aviso(ev?.titulo || 'Plantão Global', { tipo: 'neutro' });
    return { id, local };
  }
  return { noticia };
})();
