'use strict';
/* ESQUELETO da Fundação: o dono da frente substitui.
   ONU (js/onu.js, css/onu.css): sessões, votação secreta, COP, doações, reunião de emergência e negociação.
   No esqueleto não há tela: o computador decide por todas as potências com o próprio motor e o resultado volta pronto.
   Contrato: proporResolucao(e, pid) → { id, alvo } | null · votacao(e, { id, alvo, proponente }) → resultado de
   Simulacao.votacao · cop(e) → resolverCop · doacao(e, evento, local) → resolverDoacao · reuniaoEmergencia(e, pid) ·
   negociar(e, pid) → resultado | null. */

const ONU = (() => {
  const pids = e => Object.keys(e.potencias);
  const proporResolucao = async () => null;
  const votacao = async (e, res) => Simulacao.votacao(e, res, Object.fromEntries(pids(e).map(p => [p, Simulacao.iaVoto(e, p, res)])));
  const cop = async e => Simulacao.resolverCop(e, Object.fromEntries(pids(e).map(p => [p, Simulacao.iaCop(e, p)])));
  async function doacao(e, evento, local) {
    const ev = typeof EVENTOS !== 'undefined' ? EVENTOS.find(x => x.id === (evento?.id ?? evento)) : null;
    const recurso = ev?.escolha?.recurso;
    const doacoes = recurso ? Object.fromEntries(pids(e).map(p => [p, Simulacao.iaDoacao(e, p, recurso)])) : {};
    return Simulacao.resolverDoacao(e, ev?.id ?? evento, local, doacoes);
  }
  const reuniaoEmergencia = async () => ({ acusado: null, acertou: false });
  const negociar = async () => null;
  return { proporResolucao, votacao, cop, doacao, reuniaoEmergencia, negociar };
})();
