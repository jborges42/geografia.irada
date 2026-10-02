'use strict';
/* ESQUELETO da Fundação: o dono da frente substitui.
   HUD da partida (frente Partida): ano e os indicadores globais em contadores simples, manchete no rodapé e "Sair".
   Contrato: Hud.montar(), Hud.atualizar(e, { mudancas, vez }), Hud.manchete(texto). */

const Hud = (() => {
  const IND = [['comercio', '🚢', 'Comércio'], ['cooperacao', '🕊️', 'Cooperação'], ['temperatura', '🌡️', 'Temperatura'],
    ['tensao', '⚠️', 'Tensão'], ['deslocados', '🧳', 'Deslocados'], ['energia', '🛢️', 'Energia']];
  const icone = e => (typeof imgIcone === 'function' ? imgIcone(e, 40) : '');
  const valor = (k, v) => (k === 'temperatura' ? fmtGraus(v) : k === 'deslocados' ? fmtMilhoes(v, true) : fmt(v));

  function montar() {
    $('#tela-partida').innerHTML = `<div class="esq-hud">
      <div class="esq-ano peca amarela pinos"><b class="marca" id="esq-ano"></b><span id="esq-mandato"></span></div>
      <ul class="esq-inds">${IND.map(([k, e, nome]) => `<li class="contador peca" title="${nome}"><span class="soquete">${icone(e)}</span>
        <span><span class="rot">${nome}</span><br><b id="esq-${k}">–</b></span></li>`).join('')}</ul>
      <button class="btn btn-perigo peca esq-sair" data-teste="sair">Sair</button>
      <p class="esq-manchete" id="esq-manchete" aria-live="polite"></p></div>`;
    $('.esq-sair').onclick = () => Jogo.sair();
  }
  function atualizar(e) {
    if (!$('#esq-ano')) montar();
    $('#esq-ano').textContent = fmtAno(e.ano);
    $('#esq-mandato').textContent = `Mandato ${e.rodada}/${e.config.rodadas}`;
    IND.forEach(([k]) => { const el = $('#esq-' + k); if (el) el.textContent = valor(k, e.global[k]); });
  }
  const manchete = texto => { const el = $('#esq-manchete'); if (el) el.textContent = texto; };

  return { montar, atualizar, manchete };
})();
