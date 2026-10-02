'use strict';
/* Geografia Irada — a partida (frente Partida): o laço dos mandatos, a vez de cada equipe, as ações com alvo no mapa,
   a vez do computador (animada e pulável), salvar/continuar, pausa, atalhos do professor e cronômetro opcional.
   Contrato (docs/ARQUITETURA.md): Jogo.comecar(config, avatares), continuar(), temSalvo(), estado, config, avatarDe(pid),
   atualizarHUD({ mudancas }), pausar(), sair(). O HUD mora em js/hud.js; o motor em js/simulacao.js.
   Laço: abertura (ano, Plantão, COP) → vez de cada potência (dilema + ações | computador) → balanço → … → fim. */

const Jogo = (() => {
  const PIDS = ['brasil', 'eua', 'china', 'ue', 'india', 'russia'];
  const SALVO = 'gi:partida';
  const carta = id => POLITICAS.find(c => c.id === id);
  const tem = (modulo, f) => typeof modulo?.[f] === 'function';   // módulos de outras frentes podem estar incompletos
  const mapa = () => (typeof Mapa3D !== 'undefined' ? Mapa3D : null);
  let estado = null, config = null, avatares = [], passo = null;
  let vez = null;          // vez humana em andamento: { pid, mao, sel, alvo, alvos, multi, modo, ocupado, fim }
  let pularIA = null;      // pula a animação da vez do computador
  let pausado = false, retomar = null, cron = null;

  // ============================== ESPERAS (canceláveis e com pausa) ==============================
  const semPausa = () => (pausado ? aguardar(new Promise(r => (retomar = r))) : Promise.resolve());
  const dormir = ms => new Promise(r => setTimeout(r, RAPIDO ? ms / 10 : ms));
  // Uma animação do mundo com teto de tempo: o WebGL lento de uma escola não segura a partida
  const comTeto = (p, ms = 2500) => aguardar(Promise.race([Promise.resolve(p).catch(() => {}), dormir(ms)]));

  const avatarDe = pid => avatares.find(a => a.pid === pid) || null;
  const avatarCompleto = pid => ({ pid, cor: corDe(pid), forma: corDe(pid, 'forma'), ...avatarDe(pid), humano: !!estado?.potencias[pid]?.humano });

  // ============================== COMEÇAR, CONTINUAR, SAIR ==============================
  async function comecar(cfg, avs = []) {
    novaPartidaUI(); fecharPaineis(); limpar();
    config = { ...cfg };
    avatares = avs;
    estado = Simulacao.criarEstado(config);
    passo = { rodada: 1, abertura: false, feitas: [] };
    try {
      if (tem(Telas, 'revelar')) await aguardar(Promise.resolve(Telas.revelar(estado, avatares)));
      await entrarNaPartida(true);
      salvar();
      await laco();
    } catch (erro) { if (erro !== CANCELADA) throw erro; }
  }
  async function continuar() {
    const d = lerSalvo();
    if (!d) { aviso('Não há partida salva neste navegador.', { tipo: 'neutro' }); return false; }
    novaPartidaUI(); fecharPaineis(); limpar();
    ({ estado, config, avatares, passo } = d);
    try {
      await entrarNaPartida(false);
      aviso(`Partida retomada: ${fmtAno(estado.ano)}, mandato ${Math.min(estado.rodada, estado.config.rodadas)}.`, { tipo: 'bom', icone: imgIcone('💾') });
      await laco();
    } catch (erro) { if (erro !== CANCELADA) throw erro; }
    return true;
  }
  async function entrarNaPartida(animar) {
    mostrarTela('partida');
    Hud.limparRetratos();
    Hud.montar();
    Hud.lembrarBalanco(passo?.balanco);
    ligarHud();
    Hud.fase('abertura');
    Hud.atualizar(estado, { vez: null });
    const m = mapa();
    if (m) {
      m.iniciar($('#mundo'));
      m.modo('jogo');
      m.bonecos(PIDS.map(avatarCompleto));
      m.aoClicar(cliqueMapa);
      m.aoPassar(passarMapa);
      m.destacarAlvos(null);
      m.vez(null);
      if (lerPref('graficos', null)) m.graficos(lerPref('graficos'));
      await comTeto(m.atualizarMundo(estado, { animar }), 4000);
    }
    musica();
  }
  // Sair salvando: o jogo já salvou no fim da última vez (ou balanço); regravar no meio de uma vez deixaria a equipe
  // jogar de novo com CP novo e as ações já feitas. Continuar retoma do começo desta vez.
  function sair() {
    novaPartidaUI(); fecharPaineis(); limpar();
    estado = null;
    mapa()?.destacarAlvos(null);
    mapa()?.vez(null);
    if (typeof Telas !== 'undefined') Telas.inicio();
  }
  function limpar() {
    pararCronometro();
    const v = vez;
    vez = null; pularIA = null;
    v?.fim?.();
    pausado = false;
    const r = retomar; retomar = null; r?.();
  }

  // ============================== SALVAR (localStorage gi:partida) ==============================
  function salvar() {
    if (!estado) return;
    try { localStorage.setItem(SALVO, JSON.stringify({ versao: 1, quando: Date.now(), estado, config, avatares, passo })); }
    catch { /* armazenamento cheio ou bloqueado: a partida segue sem salvar */ }
  }
  const apagarSalvo = () => { try { localStorage.removeItem(SALVO); } catch { /* indisponível */ } };
  function lerSalvo() {
    try { const d = JSON.parse(localStorage.getItem(SALVO)); return d?.versao === 1 && d.estado && d.passo ? d : null; } catch { return null; }
  }
  const temSalvo = () => !!lerSalvo();

  // ============================== O LAÇO DOS MANDATOS ==============================
  async function laco() {
    while (!estado.fim) {
      if (!passo.abertura) { await abertura(); passo.abertura = true; salvar(); }
      for (const pid of Simulacao.ordemDaRodada(estado)) {
        if (passo.feitas.includes(pid)) continue;
        await semPausa();
        if (estado.potencias[pid].humano) await vezHumana(pid); else await vezComputador(pid);
        passo.feitas.push(pid);
        salvar();
      }
      await fimDoMandato();
    }
    await fimDaPartida();
  }

  // Abertura do mandato: faixa do ano → Plantão Global (1 ou 2 eventos) → Cúpula do Clima nas rodadas certas
  async function abertura() {
    Hud.fase('abertura');
    Hud.atualizar(estado, { vez: null });
    mapa()?.vez(null);
    mapa()?.visaoGeral();
    musica();
    try { if (typeof Som !== 'undefined') Som.vinheta?.('rodada'); } catch { /* sem som */ }
    await splash({ pre: estado.rodada === 1 ? 'Começa a Missão 2050' : 'Começa o mandato', titulo: fmtAno(estado.ano),
      sub: `Mandato ${estado.rodada} de ${estado.config.rodadas}`, cor: 'anil', raios: true, icone: arte('globo', { px: 192 }) });
    for (const ev of Simulacao.sortearEventos(estado)) {
      await semPausa();
      Hud.fase('plantao');
      const r = Simulacao.aplicarEvento(estado, ev.id, ev.local);
      if (tem(Plantao, 'noticia')) await aguardar(Promise.resolve(Plantao.noticia(estado, ev, r.mudancas)));
      atualizarHUD();
    }
    if (Simulacao.copNestaRodada(estado) && tem(ONU, 'cop')) {
      await semPausa();
      Hud.fase('cena');
      const r = await aguardar(Promise.resolve(ONU.cop(estado)));
      atualizarHUD();
    }
    Hud.fase('abertura');
  }

  // ============================== VEZ DE UMA EQUIPE ==============================
  async function vezHumana(pid) {
    const { cp } = Simulacao.iniciarVez(estado, pid);
    Hud.comecarVez(pid, cp);
    Hud.fase('dilema');
    Hud.atualizar(estado, { vez: pid });
    mapa()?.vez(pid);
    mapa()?.acaoBoneco(pid, 'acenar');
    musica();
    if (config.mediador) await liberarVez(pid);
    const url = Hud.retratoUrl(pid);
    await splash({ pre: 'Agora é a vez', titulo: Simulacao.nome(pid), sub: nomeEquipe(pid), cor: pid,
      icone: url ? `<img class="splash-retrato" src="${url}" alt="">` : formaDe(pid) });
    if (tem(Dilemas, 'vez')) {
      await semPausa();
      await aguardar(Promise.resolve(Dilemas.vez(estado, pid)));
      Hud.fase('dilema');
      atualizarHUD();
    }
    await semPausa();
    Hud.fase('decisoes');
    mapa()?.visaoGeral();
    const v = vez = { pid, mao: [...estado.potencias[pid].mao], sel: null, alvo: undefined, alvos: [], multi: [], modo: 'livre', ocupado: false };
    const fimVez = new Promise(r => (v.fim = r));
    Hud.doca(estado, pid, v.mao, { entrar: true });
    Hud.atualizar(estado, { vez: pid });
    anunciar(`Vez ${Simulacao.com(pid, 'de')}. Escolham as ações na barra de baixo e depois encerrem a vez.`);
    Hud.focar(Hud.raiz.querySelector('.hud-doca .tijolo:not(.bloqueado)'));
    iniciarCronometro();
    await aguardar(fimVez);
    pararCronometro();
    limparSelecao();
    vez = null;
    Simulacao.encerrarVez(estado, pid);
    Hud.doca(estado, null);
    Hud.atualizar(estado);
    mapa()?.vez(null);
  }

  // Professor mediador: o jogo espera o professor liberar a vez (tempo para a turma conversar)
  async function liberarVez(pid) {
    const p = document.createElement('section');
    p.className = 'painel peca pinos painel-p hud-liberar';
    p.dataset.equipe = pid;
    p.setAttribute('aria-labelledby', 'hud-liberar-tit');
    p.innerHTML = `<header class="painel-cab">${Hud.retratoHTML(pid, 'medio')}
        <h2 class="painel-titulo" id="hud-liberar-tit">Próxima: ${esc(nomeEquipe(pid))}<small class="painel-sub">${esc(Simulacao.nome(pid))}</small></h2></header>
      <div class="tela"><p class="liberar-texto">${imgIcone('🎓', 48)} Professor: libere a vez quando a turma estiver pronta para decidir.</p></div>
      <footer class="painel-rodape"></footer>`;
    abrirPainel(p);
    await esperarContinuar(p.querySelector('.painel-rodape'), 'Liberar a vez');
    await fecharPainel(p);
  }

  // ---------- Escolher uma ação: passar o mouse mostra a ficha; clicar seleciona; com alvo, o mapa brilha ----------
  function passarAcao(cid) { if (vez && !vez.sel && !vez.ocupado) Hud.ficha(estado, vez.pid, cid, 'previa'); }
  function sairAcao() { if (vez && !vez.sel) Hud.ficha(null); }
  function escolherAcao(cid) {
    if (!vez || vez.ocupado) return;
    if (vez.sel === cid && vez.modo !== 'bloqueada') { confirmar(); return; }
    limparSelecao();
    const st = Hud.estadoAcao(estado, vez.pid, cid);
    if (st.usado) { aviso('Essa ação já foi usada nesta vez.', { tipo: 'neutro' }); return; }
    vez.sel = cid;
    vez.modo = st.ok ? 'escolha' : 'bloqueada';
    Hud.selecionar(cid);
    mostrarFicha();
    if (!st.ok) { efeitoSom('erro'); anunciar(st.motivo); }
  }
  function mostrarFicha() {
    const c = carta(vez.sel), op = { aoConfirmar: confirmar, aoCancelar: cancelar };
    if (vez.alvo !== undefined) {
      op.alvo = vez.alvo;
      if (c.especial === 'mediacao' && tem(Simulacao, 'chanceMediacao')) op.chance = Simulacao.chanceMediacao(estado, vez.pid, vez.alvo);
    }
    Hud.ficha(estado, vez.pid, vez.sel, vez.modo === 'bloqueada' ? 'bloqueada' : vez.alvo !== undefined ? 'confirmar' : 'escolha', op);
    Hud.raiz.querySelector('.hud-ficha [data-teste="confirmar"]')?.focus({ preventScroll: true });
  }
  function confirmar() {
    if (!vez?.sel || vez.ocupado || vez.modo === 'bloqueada') return;
    const c = carta(vez.sel);
    if (c.alvo !== 'nenhum' && vez.alvo === undefined) entrarModoAlvo(); else executar();
  }
  function cancelar() {
    if (!vez) return;
    const cid = vez.sel;
    limparSelecao();
    Hud.focar(Hud.tijoloEl(cid));
  }
  function limparSelecao() {
    if (!vez) return;
    sairModoAlvo();
    mapa()?.destacarAlvos(null);
    Object.assign(vez, { sel: null, alvo: undefined, alvos: [], multi: [], modo: 'livre' });
    Hud.selecionar(null);
    Hud.ficha(null);
  }
  function entrarModoAlvo() {
    vez.modo = 'alvo';
    vez.alvos = Hud.alvosDe(estado, vez.pid, vez.sel);
    vez.multi = [];
    Hud.ficha(null);
    mapa()?.destacarAlvos(vez.alvos);
    instrucaoAlvo();
  }
  function instrucaoAlvo() {
    const c = carta(vez.sel), multi = c.alvo === 'territorios3';
    const texto = c.alvo === 'potencia' ? 'Clique na casa de uma potência que brilha'
      : multi ? `Clique em até 3 lugares que brilham · ${vez.multi.length} de 3` : 'Clique num território que brilha';
    Hud.instrucao({ texto, contagem: multi ? vez.multi.length : null, aoLista: abrirListaAlvos, aoCancelar: cancelar,
      aoPronto: multi ? () => { if (vez.multi.length) escolherAlvo([...vez.multi]); } : null });
  }
  function sairModoAlvo() { Hud.instrucao(null); }
  function escolherAlvo(id) {
    sairModoAlvo();
    vez.alvo = id;
    vez.modo = 'confirmar';
    mapa()?.destacarAlvos(Array.isArray(id) ? id : [id]);
    mostrarFicha();
  }
  function motivoAlvo(id) {
    if (id === vez.pid) return 'Escolha outro lugar: essa é a sua casa.';
    const r = Simulacao.podeJogar(estado, vez.pid, vez.sel, carta(vez.sel).alvo === 'territorios3' ? [id] : id);
    return r.ok ? 'Esse lugar não serve para esta ação.' : r.motivo;
  }
  function alternarMulti(id) {
    const i = vez.multi.indexOf(id);
    if (i >= 0) vez.multi.splice(i, 1);
    else if (vez.multi.length < 3) vez.multi.push(id);
    else { aviso('Até 3 lugares: tire um antes de escolher outro.', { tipo: 'neutro' }); return; }
    efeitoSom('pop');
    instrucaoAlvo();
  }

  // ---------- Mapa: clique escolhe o alvo (ou abre a ficha do lugar); passar o mouse mostra a ficha ----------
  function cliqueMapa({ id, x, y }) {
    if (!estado || document.body.dataset.tela !== 'partida') return;
    if (vez?.modo === 'alvo') {
      if (!vez.alvos.includes(id)) { aviso(motivoAlvo(id), { tipo: 'neutro' }); return; }
      if (carta(vez.sel).alvo === 'territorios3') { alternarMulti(id); return; }
      efeitoSom('clique');
      escolherAlvo(id);
      return;
    }
    Hud.balao(id, x, y);
  }
  const passarMapa = info => { if (estado && document.body.dataset.tela === 'partida') Hud.balao(info?.id, info?.x, info?.y); };

  // Lista acessível dos alvos válidos (a alternativa ao mapa), com dados úteis para decidir
  const ICO_CONT = { an: '🌎', as: '🌎', eu: '🌍', af: '🌍', ai: '🌏', oc: '🌏', po: '🧊' };
  const CONT = { an: 'América do Norte', as: 'América do Sul', eu: 'Europa', af: 'África', ai: 'Ásia', oc: 'Oceania', po: 'Polos' };
  function itemAlvo(c, id, multi) {
    const pid = vez.pid;
    let soq, det, fim = '';
    if (estado.potencias[id] && id !== pid) {
      const p = estado.potencias[id];
      soq = formaDe(id);
      det = `IGI ${Simulacao.igi(estado, id).total} · ${p.humano ? nomeEquipe(id) : 'Computador'}${estado.aliancas.some(a => a.includes(pid) && a.includes(id)) ? ' · já é sua aliada' : ''}`;
    } else if (id === pid) {
      soq = formaDe(pid);
      det = 'Na própria casa: mais minerais, mas o ambiente sofre';
    } else {
      const t = estado.territorios[id], inf = t.influencia[pid] || 0;
      soq = t.parceiro ? formaDe(t.parceiro) : t.conflito ? imgIcone('⚠️', 48) : imgIcone(ICO_CONT[t.continente] || '📍', 48);
      det = [CONT[t.continente], `sua influência ${inf}`, t.parceiro ? (t.parceiro === pid ? 'já é seu parceiro' : `parceiro ${Simulacao.com(t.parceiro, 'de')}`) : 'neutro',
        ['', 'conflito leve', 'conflito intenso', 'guerra aberta'][t.conflito] || ''].filter(Boolean).join(' · ');
      if (c.especial === 'mediacao' && tem(Simulacao, 'chanceMediacao')) fim = `<span class="pilula amarela num">${Math.round(Simulacao.chanceMediacao(estado, pid, id).chance * 100)}%</span>`;
    }
    return `<button class="opcao peca" role="${multi ? 'checkbox' : 'radio'}" aria-checked="false" data-teste="alvo" data-id="${id}">
      <span class="soquete">${soq}</span><span><span class="opcao-nome">${esc(id === pid ? 'Em casa' : Simulacao.nome(id))}</span><span class="opcao-detalhe">${esc(det)}</span></span>
      <span class="opcao-fim">${fim}<span class="marcador">${GLIFOS.ok}</span></span></button>`;
  }
  function abrirListaAlvos() {
    if (!vez?.sel) return;
    const c = carta(vez.sel), multi = c.alvo === 'territorios3', pid = vez.pid;
    const ordem = [...vez.alvos].sort((a, b) => (c.especial === 'mediacao' && tem(Simulacao, 'chanceMediacao')
      ? Simulacao.chanceMediacao(estado, pid, b).chance - Simulacao.chanceMediacao(estado, pid, a).chance
      : (estado.territorios[b]?.influencia[pid] || 0) - (estado.territorios[a]?.influencia[pid] || 0)) || Simulacao.nome(a).localeCompare(Simulacao.nome(b)));
    const p = document.createElement('section');
    p.className = `painel peca pinos painel-m cat-${c.categoria} hud-alvos`;
    p.setAttribute('aria-labelledby', 'hud-alvos-tit');
    p.innerHTML = `<header class="painel-cab">${arte(c.alvo === 'potencia' ? 'aperto-maos' : 'globo', { classe: 'painel-objeto' })}
        <h2 class="painel-titulo" id="hud-alvos-tit">${esc(c.nome)}<small class="painel-sub">${multi ? 'Escolham até 3 lugares' : c.alvo === 'potencia' ? 'Escolham uma potência' : 'Escolham um lugar'}</small></h2>
        <button class="btn btn-ic peca alvos-fechar" aria-label="Fechar a lista"><img src="${ICONES_BOTAO.fechar}" alt=""></button></header>
      <div class="tela"><div class="lista-opcoes" role="${multi ? 'group' : 'radiogroup'}" aria-label="Alvos possíveis">${ordem.map(id => itemAlvo(c, id, multi)).join('')}</div></div>
      <footer class="painel-rodape"><span class="dica">${ordem.length} ${ordem.length === 1 ? 'opção' : 'opções'}: os mesmos lugares que brilham no mapa</span>
        ${multi ? `<button class="btn btn-principal peca pinos" data-teste="confirmar" disabled>Pronto</button>` : ''}</footer>`;
    const fechar = () => fecharPainel(p);
    p.querySelector('.alvos-fechar').onclick = fechar;
    p.querySelectorAll('[data-teste="alvo"]').forEach(b => (b.onclick = () => {
      efeitoSom('clique');
      if (!multi) { b.setAttribute('aria-checked', 'true'); fechar(); escolherAlvo(b.dataset.id); return; }
      const marcado = b.getAttribute('aria-checked') === 'true', n = p.querySelectorAll('[aria-checked="true"]').length;
      if (!marcado && n >= 3) { aviso('Até 3 lugares.', { tipo: 'neutro' }); return; }
      b.setAttribute('aria-checked', String(!marcado));
      p.querySelector('[data-teste="confirmar"]').disabled = !p.querySelector('[aria-checked="true"]');
    }));
    p.querySelector('[data-teste="confirmar"]')?.addEventListener('click', () => {
      const ids = [...p.querySelectorAll('[aria-checked="true"]')].map(b => b.dataset.id);
      fechar(); escolherAlvo(ids);
    });
    abrirPainel(p, { esc: true });
  }

  // ---------- Executar: jogarCarta → construção no mapa + números saltando + manchete + porquê ----------
  async function executar() {
    const v = vez, pid = v.pid, cid = v.sel, c = carta(cid), alvo = v.alvo ?? null;
    v.ocupado = true;
    Hud.raiz?.setAttribute('aria-busy', 'true');   // ação animando: a doca ignora cliques até terminar
    sairModoAlvo();
    Hud.ficha(null);
    try {
      const opcoes = {};
      let prop = null;
      if (c.especial === 'alianca' && estado.potencias[alvo]?.humano) opcoes.aceita = await perguntarAlianca(pid, alvo);
      if (c.especial === 'votacao') {
        if (!tem(ONU, 'proporResolucao')) return;
        Hud.fase('cena');
        prop = await aguardar(Promise.resolve(ONU.proporResolucao(estado, pid)));
        Hud.fase('decisoes');
        if (!prop) { aviso('Nenhuma resolução proposta: o Capital Político continua com vocês.', { tipo: 'neutro' }); return; }
      }
      const antes = estado.construcoes.length;
      const res = Simulacao.jogarCarta(estado, pid, cid, alvo, opcoes);
      if (!res.ok) { aviso(res.motivo || 'Não deu para fazer isso agora.', { tipo: 'ruim' }); efeitoSom('erro'); return; }
      efeitoSom('pino');
      mapa()?.destacarAlvos(null);
      await mostrarResultado(pid, c, res, antes, alvo);
      if (res.abrirVotacao && prop) {
        Hud.fase('cena');
        const r = await aguardar(Promise.resolve(ONU.votacao(estado, { ...prop, proponente: pid })));
        Hud.fase('decisoes');
        atualizarHUD();
      }
    } finally {
      Hud.raiz?.removeAttribute('aria-busy');
      if (vez === v) {
        v.ocupado = false;
        limparSelecao();
        Hud.doca(estado, pid, v.mao);
        Hud.atualizar(estado, { vez: pid });
        Hud.focar(Hud.tijoloEl(cid));
      }
    }
  }
  async function mostrarResultado(pid, c, res, antes, alvo) {
    const m = mapa(), novas = estado.construcoes.slice(antes);
    const montagem = novas.map(k => m?.construir(k, { animar: true }));
    if (c.especial === 'mediacao' && res.sucesso) montagem.push(m?.efeito('paz', alvo));
    m?.acaoBoneco(pid, (c.especial === 'mediacao' && !res.sucesso) || (c.especial === 'alianca' && !res.aceita) ? 'triste' : 'comemorar');
    mostrarMudancasNoMapa(res.mudancas, pid);
    // causa → efeito: pecinhas voam do lugar da ação até os indicadores do topo, que contam ao recebê-las
    await comTeto(Hud.voo((Array.isArray(alvo) ? alvo[0] : alvo) || pid, estado), 1600);
    atualizarHUD();
    Hud.manchete(res.manchete);
    if (c.especial === 'mediacao') {
      aviso(res.sucesso ? 'A mediação deu certo: o conflito perdeu força!' : 'A mediação não avançou desta vez. Tentar também aproxima.',
        { tipo: res.sucesso ? 'bom' : 'neutro', icone: imgIcone('🕊️') });
      efeitoSom(res.sucesso ? 'sucesso' : 'erro');
    } else if (c.especial === 'alianca') {
      aviso(res.aceita ? `Aliança fechada com ${Simulacao.com(alvo)}!` : `${Simulacao.nome(alvo)} recusou a aliança.`, { tipo: res.aceita ? 'bom' : 'neutro', icone: imgIcone('🤝') });
      efeitoSom(res.aceita ? 'sucesso' : 'erro');
    } else if (c.especial !== 'votacao') {
      aviso(res.manchete, { tipo: 'bom', icone: imgIcone(c.icone) });
      efeitoSom('sucesso');
    }
    await comTeto(Promise.all(montagem), 1800);
  }
  // Aliança com outra equipe humana: a equipe convidada aceita ou recusa na tela
  function perguntarAlianca(de, para) {
    const p = document.createElement('section');
    p.className = 'painel peca pinos painel-p hud-convite';
    p.dataset.equipe = para;
    p.innerHTML = `<header class="painel-cab">${arte('aperto-maos', { classe: 'painel-objeto' })}
        <h2 class="painel-titulo">Proposta de aliança<small class="painel-sub">${esc(nomeEquipe(para))}, decidam juntos</small></h2></header>
      <div class="tela"><p class="convite-texto"><b>${esc(Simulacao.nome(de))}</b> propõe uma aliança estratégica ${esc(Simulacao.com(para, 'a'))}.</p>
        <p class="convite-porque">Os dois ganham segurança, mas quem fica de fora pode se sentir ameaçado: é o dilema de segurança.</p></div>
      <footer class="painel-rodape"><button class="btn btn-perigo peca pinos" data-teste="recusar">${GLIFOS.nao} Recusar</button>
        <button class="btn btn-confirmar peca pinos" data-teste="aceitar">${GLIFOS.ok} Aceitar</button></footer>`;
    abrirPainel(p);
    return aguardar(new Promise(r => {
      p.querySelector('[data-teste="aceitar"]').onclick = () => { efeitoSom('clique'); fecharPainel(p); r(true); };
      p.querySelector('[data-teste="recusar"]').onclick = () => { efeitoSom('clique'); fecharPainel(p); r(false); };
    }));
  }

  // ---------- Ações fixas da doca ----------
  function trocarAcoes() {
    if (!vez || vez.ocupado) return;
    limparSelecao();
    const r = Simulacao.trocarMao(estado, vez.pid);
    if (!r.ok) { aviso(r.motivo, { tipo: 'neutro' }); efeitoSom('erro'); return; }
    vez.mao = [...r.mao];
    efeitoSom('pino');
    Hud.doca(estado, vez.pid, vez.mao, { entrar: true });
    Hud.atualizar(estado, { vez: vez.pid });
    anunciar('Novas ações sorteadas.');
  }
  async function negociar() {
    if (!vez || vez.ocupado || !tem(ONU, 'negociar')) return;
    const v = vez;
    limparSelecao();
    v.ocupado = true;
    try {
      const r = await aguardar(Promise.resolve(ONU.negociar(estado, v.pid)));
      if (r?.ok === false && r.motivo) aviso(r.motivo, { tipo: 'neutro' });
      else if (!r) aviso('Nenhuma troca fechada desta vez.', { tipo: 'neutro', icone: imgIcone('🤝') });
      atualizarHUD();
    } finally { if (vez === v) { v.ocupado = false; Hud.doca(estado, v.pid, v.mao); Hud.atualizar(estado, { vez: v.pid }); } }
  }
  async function reuniao() {
    if (!vez || vez.ocupado || !tem(ONU, 'reuniaoEmergencia')) return;
    const v = vez, p = estado.potencias[v.pid];
    if (estado.reuniaoUsada) { aviso('A reunião de emergência já foi usada nesta partida.', { tipo: 'neutro' }); return; }
    if (p.cp < 2) { aviso('A reunião de emergência custa 2 de Capital Político.', { tipo: 'neutro' }); return; }
    limparSelecao();
    v.ocupado = true;
    try {
      Hud.fase('cena');
      const r = await aguardar(Promise.resolve(ONU.reuniaoEmergencia(estado, v.pid)));
      Hud.fase('decisoes');
      atualizarHUD();
    } finally { if (vez === v) { v.ocupado = false; Hud.fase('decisoes'); Hud.doca(estado, v.pid, v.mao); Hud.atualizar(estado, { vez: v.pid }); } }
  }
  function encerrar() {
    if (!vez || vez.ocupado) return;
    efeitoSom('vez');
    vez.fim();
  }

  // ============================== VEZ DO COMPUTADOR (iaJogarVez já aplica; a tela só anima, pulável) ==============================
  async function vezComputador(pid) {
    Hud.comecarVez(pid, 0);
    Hud.fase('computador');
    Hud.atualizar(estado, { vez: pid });
    mapa()?.vez(pid);
    let pular = false;
    const pulou = new Promise(r => (pularIA = () => { if (!pular) { pular = true; efeitoSom('whoosh'); r(); } }));
    const pausa = ms => (pular ? Promise.resolve() : aguardar(Promise.race([dormir(ms), pulou])));
    Hud.decidindo(pid, () => pularIA?.());
    await pausa(700);
    await semPausa();
    const antes = estado.construcoes.length;
    const jogadas = Simulacao.iaJogarVez(estado, pid);
    const novas = estado.construcoes.slice(antes);
    for (const j of jogadas) {
      await semPausa();
      if (j.tipo === 'dilema') {
        if (!pular && tem(Dilemas, 'mostrarIA')) await aguardar(Promise.race([Promise.resolve(Dilemas.mostrarIA(estado, pid, j)).catch(() => {}), pulou]));
        if (!pular) { Hud.jogadaIA(pid, j); mostrarMudancasNoMapa(j.resultado?.mudancas, pid); }
        if (j.resultado?.manchete) Hud.manchete(j.resultado.manchete);
      } else {
        const k = novas.findIndex(x => x.carta === j.carta), cons = k >= 0 ? novas.splice(k, 1)[0] : null;
        if (cons) mapa()?.construir(cons, { animar: !pular });
        if (!pular) { Hud.jogadaIA(pid, j); mostrarMudancasNoMapa(j.resultado?.mudancas, pid); mapa()?.acaoBoneco(pid, 'apontar'); }
        if (j.resultado?.manchete) Hud.manchete(j.resultado.manchete);
      }
      await pausa(1100);
    }
    if (!jogadas.length) Hud.jogadaIA(pid, { tipo: 'nada' });
    Hud.atualizar(estado, { vez: pid });
    mapa()?.atualizarMundo(estado);
    await pausa(700);
    pularIA = null;
    Hud.decidindo(null);
    mapa()?.vez(null);
  }

  // ============================== FIM DO MANDATO E FIM DA PARTIDA ==============================
  async function fimDoMandato() {
    await semPausa();
    Hud.fase('balanco');
    mapa()?.vez(null);
    mapa()?.visaoGeral();
    const rel = Simulacao.balanco(estado);
    const lembrete = { ano: rel.ano, proximoAno: rel.proximoAno, antes: rel.antes?.global, depois: rel.depois?.global, causas: rel.causas };
    passo = { rodada: estado.rodada, abertura: false, feitas: [], balanco: lembrete };
    Hud.lembrarBalanco(lembrete);
    if (tem(Relatorios, 'balanco')) await aguardar(Promise.resolve(Relatorios.balanco(estado, rel)));
    salvar();
    atualizarHUD();
    Hud.fase('abertura');
  }
  async function fimDaPartida() {
    apagarSalvo();
    pararCronometro();
    Hud.fase('cena');
    mapa()?.vez(null);
    const escolha = tem(Relatorios, 'fim')
      ? await aguardar(Promise.resolve(Relatorios.fim(estado, PIDS.map(avatarCompleto)))) : 'inicio';
    if (escolha === 'revanche') return comecar(config, avatares);
    novaPartidaUI(); fecharPaineis(); limpar();
    estado = null;
    if (typeof Telas === 'undefined') return;
    if (escolha === 'novo') Telas.lobby(); else Telas.inicio();
  }

  // ============================== HUD: números, mapa e música ==============================
  // Contrato para os outros módulos (dilema, evento, ONU): os números saltam no HUD e o mundo 3D se atualiza.
  // Os números flutuantes no mapa ficam com quem mostrou a decisão (cada módulo anima a sua).
  function atualizarHUD() {
    if (!estado) return;
    Hud.atualizar(estado);
    mapa()?.atualizarMundo(estado);
  }
  function mostrarMudancasNoMapa(mudancas = [], pid) {
    const m = mapa();
    for (const x of mudancas || []) {
      if (x.v === 'parceiro' && x.depois) { aviso(x.motivo || `${Simulacao.nome(x.quem)}: nova parceria`, { tipo: 'bom', icone: imgIcone('🤝') }); efeitoSom('subir'); }
      if (!m || !estado.territorios[x.quem]) continue;
      const d = Math.round((x.depois ?? 0) - (x.antes ?? 0));
      if (!d) continue;
      if (x.v === 'influencia' && (x.de || pid)) m.numeroFlutuante(x.quem, sinal(d), x.de || pid);
      else if (x.v === 'conflito') m.numeroFlutuante(x.quem, sinal(d), d < 0 ? 'ganho' : 'perda');
    }
  }
  function musica() {
    if (typeof Som === 'undefined' || !estado) return;
    const h = estado.global.tensao >= 80 || estado.global.temperatura >= 2.0 ? 'tensao' : 'jogo';
    if (Som.humor !== h) Som.musica(h);
  }

  // ============================== CRONÔMETRO OPCIONAL (config.tempoResposta, em segundos por vez) ==============================
  const painelAberto = () => !!document.querySelector('#camada > [aria-modal="true"]');
  function iniciarCronometro() {
    pararCronometro();
    const total = +config?.tempoResposta || 0;
    if (!total) return;
    let antes = performance.now();
    cron = { total, resta: total * 1000 };
    cron.id = setInterval(() => {
      const agora = performance.now(), dt = agora - antes;
      antes = agora;
      if (!cron || pausado || painelAberto() || vez?.ocupado) return;
      cron.resta -= dt;
      Hud.cronometro(Math.max(0, cron.resta / 1000), cron.total);
      if (cron.resta <= 0) {
        pararCronometro();
        efeitoSom('tempo');
        aviso('Tempo esgotado! A vez passa para a próxima equipe.', { tipo: 'neutro', icone: imgIcone('⏳') });
        limparSelecao();
        encerrar();
      }
    }, 250);
    Hud.cronometro(total, total);
  }
  function pararCronometro() { if (cron) clearInterval(cron.id); cron = null; Hud.cronometro(null); }

  // ============================== PAUSA, SOM, TELA CHEIA ==============================
  function abrirPausa() {
    if (!estado || document.querySelector('#camada .hud-pausa')) return;
    pausado = true;
    const m = mapa(), leves = m?.qualidade === 'leves', cheia = !!document.fullscreenElement;
    const musicaOn = typeof Som === 'undefined' || Som.musicaLigada, efeitosOn = typeof Som === 'undefined' || Som.efeitosLigados;
    const p = document.createElement('section');
    p.className = 'painel peca pinos painel-m hud-pausa';
    p.setAttribute('aria-labelledby', 'hud-pausa-tit');
    const ajuste = (id, ico, rotulo, ligado) => `<div class="ajuste"><span>${imgIcone(ico, 48)} ${rotulo}</span>
      <button class="interruptor" role="switch" aria-checked="${ligado}" data-ajuste="${id}" aria-label="${rotulo}"><span>Não</span><span>Sim</span></button></div>`;
    p.innerHTML = `<header class="painel-cab">${arte('ampulheta', { classe: 'painel-objeto' })}<h2 class="painel-titulo marca" id="hud-pausa-tit">Pausa</h2>
        <span class="pausa-ano">${fmtAno(estado.ano)} · Mandato ${Math.min(estado.rodada, estado.config.rodadas)} de ${estado.config.rodadas}</span></header>
      <div class="tela pausa-tela">
        <div class="pausa-bts">
          <button class="btn btn-principal peca pinos" data-a="continuar" data-teste="continuar-jogo" autofocus>${GLIFOS.seta} Continuar</button>
          <button class="btn btn-neutro peca" data-a="manual">${imgIcone('📚', 48)} Manual do Diplomata</button>
          <button class="btn btn-neutro peca" data-a="sair" data-teste="sair">${imgIcone('💾', 48)} Salvar e sair</button>
          <div class="pausa-ajustes">${ajuste('texto', '🔍', 'Texto grande', lerPref('texto', 1) !== 1)}
            ${ajuste('contraste', '💡', 'Contraste alto', !!lerPref('contraste', false))}${ajuste('rm', '⏳', 'Menos movimento', RM)}</div>
        </div>
        <div class="pausa-dir"><div class="pausa-ajustes">${ajuste('musica', '🎤', 'Música', musicaOn)}${ajuste('efeitos', '🔊', 'Efeitos', efeitosOn)}
          ${ajuste('leves', '⚙️', 'Gráficos leves', leves)}${ajuste('cheia', '📺', 'Tela cheia', cheia)}</div>
          <div class="pausa-marca">${logo('horizontal', 'pequeno')}</div></div>
      </div>
      <footer class="painel-rodape"><span class="dica pausa-teclas">Teclas do professor:
        ${[['Espaço', 'pula'], ['P', 'pausa'], ['H', 'esconde o painel'], ['M', 'música'], ['F', 'tela cheia'], ['Esc', 'menu']].map(([k, t]) => `<span class="pausa-tecla"><kbd>${k}</kbd> ${t}</span>`).join(' ')}</span></footer>`;
    const fechar = () => { fecharPainel(p); retomarJogo(); };
    p.querySelector('[data-a="continuar"]').onclick = () => { efeitoSom('clique'); fechar(); };
    p.querySelector('[data-a="manual"]').onclick = () => { efeitoSom('clique'); if (typeof Manual !== 'undefined') Manual.abrir(); };
    p.querySelector('[data-a="sair"]').onclick = () => { efeitoSom('clique'); sair(); };
    p.querySelectorAll('[data-ajuste]').forEach(b => (b.onclick = () => {
      const k = b.dataset.ajuste;
      let lig = b.getAttribute('aria-checked') !== 'true';
      if (k === 'musica' && typeof Som !== 'undefined') lig = Som.alternarMusica();
      if (k === 'efeitos' && typeof Som !== 'undefined') lig = Som.alternarEfeitos();
      if (k === 'leves') { m?.graficos(lig ? 'leves' : 'bonitos'); gravarPref('graficos', lig ? 'leves' : 'bonitos'); }
      if (k === 'cheia') telaCheia();
      if (k === 'texto') { gravarPref('texto', lig ? 1.15 : 1); document.documentElement.style.setProperty('--texto', lig ? 1.15 : 1); }
      if (k === 'contraste') { gravarPref('contraste', lig); if (lig) document.documentElement.dataset.contraste = 'alto'; else delete document.documentElement.dataset.contraste; }
      if (k === 'rm') { gravarPref('movimento-reduzido', lig); aviso('Vale a partir da próxima vez que o jogo abrir (a partida fica salva).', { tipo: 'neutro', icone: imgIcone('⏳') }); }
      b.setAttribute('aria-checked', String(lig));
      efeitoSom('clique');
      atualizarBotaoSom();
    }));
    abrirPainel(p, { esc: retomarJogo });
  }
  function retomarJogo() {
    pausado = false;
    const r = retomar; retomar = null; r?.();
  }
  function alternarSom() {
    if (typeof Som === 'undefined') return;
    const ligar = !(Som.musicaLigada || Som.efeitosLigados);
    if (Som.musicaLigada !== ligar) Som.alternarMusica();
    if (Som.efeitosLigados !== ligar) Som.alternarEfeitos();
    atualizarBotaoSom();
    aviso(ligar ? 'Som ligado.' : 'Som desligado.', { tipo: 'neutro', icone: imgIcone(ligar ? '🔊' : '🔇') });
  }
  function atualizarBotaoSom() {
    const b = Hud.raiz?.querySelector('.hud-som img');
    if (b && typeof Som !== 'undefined') b.src = Som.musicaLigada || Som.efeitosLigados ? ICONES_BOTAO.som : ICONES_BOTAO.mudo;
  }
  function telaCheia() {
    try { (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())?.catch?.(() => {}); } catch { /* sem tela cheia */ }
  }
  // Câmera: aproximar e afastar como a rodinha do mouse no mapa
  function zoom(sentido) {
    const c = mapa()?.renderer?.domElement;
    if (!c) return;
    for (let i = 0; i < 4; i++) setTimeout(() => c.dispatchEvent(new WheelEvent('wheel', { deltaY: sentido * 120, deltaMode: 0, clientX: innerWidth / 2, clientY: innerHeight / 2, bubbles: true, cancelable: true })), i * 40);
  }

  function ligarHud() {
    Object.assign(Hud.ao, {
      acao: escolherAcao, passar: passarAcao, sair: sairAcao, trocar: trocarAcoes, negociar, encerrar, reuniao,
      menu: abrirPausa, som: alternarSom, ajuda: () => typeof Manual !== 'undefined' && Manual.abrir(),
      perto: () => zoom(-1), longe: () => zoom(1), geral: () => mapa()?.visaoGeral(), jornal: () => Hud.abrirJornal(estado),
    });
  }

  // ============================== ATALHOS DO PROFESSOR ==============================
  document.addEventListener('keydown', ev => {
    if (!estado || document.body.dataset.tela !== 'partida' || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.target.closest?.('input, textarea, select, [contenteditable]') || painelAberto() || !$('#splash').hidden) return;
    const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
    if (k === 'Escape') { ev.preventDefault(); if (vez?.sel) cancelar(); else abrirPausa(); }
    else if (k === 'p') abrirPausa();
    else if (k === 'h') Hud.ocultar();
    else if (k === 'm' && typeof Som !== 'undefined') { const on = Som.alternarMusica(); atualizarBotaoSom(); aviso(on ? 'Música ligada.' : 'Música desligada.', { tipo: 'neutro', icone: imgIcone('🎤') }); }
    else if (k === 'f') telaCheia();
    else if (k === ' ' && pularIA) { ev.preventDefault(); pularIA(); }
    else if (k === 'Enter' && vez && !vez.ocupado && !vez.sel && !ev.target.closest?.('button, a, [tabindex]')) { ev.preventDefault(); encerrar(); }
  });

  return { comecar, continuar, temSalvo, avatarDe, atualizarHUD, pausar: abrirPausa, sair,
    get estado() { return estado; }, get config() { return config; } };
})();
