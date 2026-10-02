'use strict';
/* ESQUELETO da Fundação: o dono da frente substitui.
   Partida (js/jogo.js, js/hud.js, css/jogo.css): cria o estado, mostra a partida e a faixa do ano. O laço completo
   (plantão, dilemas, ações, ONU, balanço, salvar) é da frente Partida.
   Contrato: Jogo.comecar(config, avatares), continuar(), temSalvo(), estado, config, avatarDe(pid), atualizarHUD({ mudancas }),
   pausar(), sair(). */

const Jogo = (() => {
  let estado = null, config = null, avatares = [];

  async function comecar(cfg, avs = []) {
    novaPartidaUI();
    config = cfg;
    avatares = avs;
    estado = Simulacao.criarEstado(cfg);
    try {
      await Telas.revelar(estado, avatares);
      mostrarTela('partida');
      Hud.montar();
      Hud.atualizar(estado);
      await splash({ pre: 'Começa o mandato', titulo: fmtAno(estado.ano), sub: 'Missão 2050', cor: 'anil', raios: true });
    } catch (erro) { if (erro !== CANCELADA) throw erro; }
  }
  const continuar = async () => false;
  const temSalvo = () => false;
  const avatarDe = pid => avatares.find(a => a.pid === pid) || null;
  const atualizarHUD = ({ mudancas } = {}) => estado && Hud.atualizar(estado, { mudancas });
  const pausar = () => aviso('Pausa: chega com a partida definitiva.', { tipo: 'neutro' });
  function sair() {
    novaPartidaUI();
    fecharPaineis();
    estado = null;
    Telas.inicio();
  }

  return { comecar, continuar, temSalvo, avatarDe, atualizarHUD, pausar, sair,
    get estado() { return estado; }, get config() { return config; } };
})();
