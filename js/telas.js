'use strict';
/* ESQUELETO da Fundação: o dono da frente substitui.
   Telas (js/telas.js, css/telas.css): início, lobby, revelação secreta e "Para o professor", no mínimo para a página abrir
   e uma partida começar. Contrato: Telas.inicio(), Telas.lobby(), Telas.revelar(e, avatares) → Promise, Telas.professor(). */

const Telas = (() => {
  const PIDS = ['brasil', 'eua', 'china', 'ue', 'india', 'russia'];

  function inicio() {
    const t = $('#tela-inicio');
    const salvo = typeof Jogo !== 'undefined' && Jogo.temSalvo();
    t.innerHTML = `<div class="esq-inicio">
      ${typeof logo === 'function' ? logo('esq-logo') : '<h1 class="esq-titulo marca letra-bolha relevo">Geografia <span>Irada</span></h1>'}
      <p class="esq-lema letra-bolha">Missão 2050: o mundo inteiro depende das suas decisões.</p>
      <nav class="esq-menu" aria-label="Menu principal">
        <button class="btn btn-principal peca pinos" data-teste="jogar">Jogar ${GLIFOS.seta}</button>
        ${salvo ? '<button class="btn btn-neutro peca" data-teste="continuar">Continuar</button>' : ''}
        <button class="btn btn-neutro peca" data-teste="manual">Manual do Diplomata</button>
        <button class="btn btn-neutro peca" data-teste="professor">Para o professor</button>
      </nav></div>`;
    t.querySelector('[data-teste="jogar"]').onclick = lobby;
    t.querySelector('[data-teste="continuar"]')?.addEventListener('click', () => Jogo.continuar());
    t.querySelector('[data-teste="manual"]').onclick = () => typeof Manual !== 'undefined' && Manual.abrir();
    t.querySelector('[data-teste="professor"]').onclick = professor;
    mostrarTela('inicio');
    if (typeof Som !== 'undefined') Som.musica?.('menu');
  }

  // Lobby mínimo: cada potência alterna Equipe/Computador; "Começar!" chama Jogo.comecar(config, avatares)
  function lobby() {
    const t = $('#tela-lobby');
    t.innerHTML = `<section class="esq-lobby painel peca pinos painel-m">
      <header class="painel-cab"><h1 class="painel-titulo">Delegações</h1></header>
      <div class="tela"><ul class="lista-opcoes">${PIDS.map(pid => `<li class="esq-linha">
        <span class="retrato" data-equipe="${pid}">${formaDe(pid, { classe: 'vazio' })}</span>
        <span><b class="opcao-nome">${esc(nomeCurto(pid))}</b><small class="opcao-detalhe">${nomeEquipe(pid)}</small></span>
        <button class="interruptor" role="switch" aria-checked="${pid === 'brasil'}" data-teste="potencia-${pid}"
          aria-label="${esc(nomeCurto(pid))}: jogada por uma equipe"><span>Computador</span><span>Equipe</span></button></li>`).join('')}</ul></div>
      <footer class="painel-rodape"><button class="btn btn-neutro peca" data-teste="inicio">${GLIFOS.voltar} Voltar</button>
        <button class="btn btn-principal peca pinos" data-teste="comecar">Começar!</button></footer></section>`;
    t.querySelectorAll('.interruptor').forEach(b => (b.onclick = () => { b.setAttribute('aria-checked', b.getAttribute('aria-checked') !== 'true'); efeitoSom('clique'); }));
    t.querySelector('[data-teste="inicio"]').onclick = inicio;
    t.querySelector('[data-teste="comecar"]').onclick = () => {
      const humanos = PIDS.filter(pid => t.querySelector(`[data-teste="potencia-${pid}"]`).getAttribute('aria-checked') === 'true');
      const config = { modo: 'competitivo', rodadas: 6, missoes: true, infiltrado: false, foco: [], mediador: false,
        jogadores: humanos.map(pid => ({ potencia: pid, nome: nomeEquipe(pid) })) };
      const avatares = typeof Bonecos !== 'undefined' && Bonecos.avataresIniciais
        ? Bonecos.avataresIniciais(PIDS).map(a => ({ ...a, humano: humanos.includes(a.pid) }))
        : PIDS.map(pid => ({ pid, nome: nomeEquipe(pid), cor: corDe(pid), forma: corDe(pid, 'forma'), humano: humanos.includes(pid) }));
      Jogo.comecar(config, avatares);
    };
    mostrarTela('lobby');
  }

  // Revelação secreta (missões e papéis): no esqueleto, só segue em frente
  const revelar = async () => {};

  function professor() {
    const p = document.createElement('section');
    p.className = 'painel peca pinos painel-p';
    p.innerHTML = `<header class="painel-cab"><h2 class="painel-titulo">Para o professor</h2>
      <button class="btn btn-ic peca" aria-label="Fechar">${GLIFOS.fechar}</button></header>
      <div class="tela"><p>O roteiro de aula, o mapa da BNCC e as teclas do professor chegam com a tela definitiva.</p></div>`;
    p.querySelector('.btn-ic').onclick = () => fecharPainel(p);
    abrirPainel(p, { esc: true });
  }

  return { inicio, lobby, revelar, professor };
})();
