'use strict';
/* Geografia Irada — Telas (frente Telas): início, lobby (modo, delegações, provador, ajustes), revelação secreta,
   "Para o professor" e créditos. Guia de arte §5.13, §5.16, §5.17, §8. Aparência: css/telas.css.
   Contrato: Telas.inicio(), Telas.lobby() → Jogo.comecar(config, avatares), Telas.revelar(e, avatares) → Promise,
   Telas.professor(), Telas.creditos(). Usa Mapa3D, Cenas3D, Bonecos e Mascote pelos contratos (todos opcionais). */

const Telas = (() => {
  const tenta = fn => { try { return fn(); } catch { return undefined; } };   // módulos 3D são opcionais (sem WebGL, a tela segue)
  const ico = (e, px = 40) => imgIcone(e, px);
  const icoBtn = nome => `<img class="ico-btn" src="${ICONES_BOTAO[nome]}" alt="" draggable="false">`;
  const nomePais = pid => (typeof POTENCIAS !== 'undefined' && POTENCIAS.find(p => p.id === pid)?.nome) || nomeCurto(pid);
  const comIcones = t => esc(t).replace(/\p{Extended_Pictographic}️?/gu, e => ico(e, 40));   // emoji do texto → ícone Fluent
  const digitando = ev => ev.target.closest?.('input, textarea, [contenteditable]');
  const painelAberto = () => !!document.querySelector('#camada > .painel');

  // ============================== DADOS DAS TELAS ==============================
  const porExtenso = n => ['zero', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze'][n] ?? String(n);
  const MODOS = [
    { id: 'competitivo', nome: 'Cada nação por si', arte: 'trofeu', cor: 'ouro', quem: `2 a ${PIDS.length} equipes`,
      texto: 'Cada equipe puxa para o seu lado. Vence o maior índice em 2050 — se o planeta aguentar.' },
    { id: 'blocos', nome: 'Em blocos', arte: 'aperto-maos', cor: 'cat-diplomacia', quem: `2 a ${PIDS.length} equipes`,
      texto: 'Alianças de equipes somam forças. Vence o bloco com a melhor média.' },
    { id: 'cooperativo', nome: 'Todos pelo planeta', arte: 'globo', cor: 'cat-natureza', quem: `1 a ${PIDS.length} equipes`,
      texto: 'A turma inteira contra a crise: cumpram 4 das 5 Metas 2050 juntos.' },
    { id: 'solo', nome: 'Solo', arte: 'maleta', cor: 'cat-ciencia', quem: '1 equipe',
      texto: `Uma equipe governa; as outras ${porExtenso(PIDS.length - 1)} potências ficam com o computador.` },
  ];
  const RODADAS = [
    { n: 4, nome: 'Rápida', anos: 6, min: 30 }, { n: 6, nome: 'Aula', anos: 4, min: 45 }, { n: 8, nome: 'Completa', anos: 3, min: 60 },
  ];
  const TEMPOS = [[0, 'Livre'], [60, '60 s'], [90, '90 s'], [120, '2 min']];
  const TEMAS = [
    { id: 'territorio', nome: 'Território e soberania', icone: '🗺' }, { id: 'ordem', nome: 'Ordem mundial', icone: '🌐' },
    { id: 'globalizacao', nome: 'Globalização e economia', icone: '🚢' }, { id: 'natureza', nome: 'Natureza, clima e energia', icone: '🌱' },
    { id: 'conflitos', nome: 'Conflitos e paz', icone: '🕊' }, { id: 'pessoas', nome: 'Pessoas e direitos', icone: '👥' },
  ];
  const BLOCOS = [{ id: 'sol', nome: 'Bloco Sol', icone: '☀' }, { id: 'onda', nome: 'Bloco Onda', icone: '🌊' }, { id: 'folha', nome: 'Bloco Folha', icone: '🌿' }];
  const FALAS = ['E aí, diplomata? O mundo de 2050 conta com a sua equipe!', 'Aqui não tem guerra: a disputa é por influência.',
    'Cada decisão mexe no mundo inteiro — e o porquê aparece na hora.', 'Se cada um só pensar em si, o planeta não aguenta!'];

  // ============================== INÍCIO ==============================
  let ini = null;   // { tl, laco, falas, tecla }
  function inicio() {
    sairDoInicio();
    sairDoLobby();
    tenta(() => Cenas3D.esconder());
    const t = $('#tela-inicio');
    const salvo = (typeof Jogo !== 'undefined') && tenta(() => Jogo.temSalvo());
    const musica = !(typeof Som !== 'undefined') || Som.musicaLigada, efeitos = !(typeof Som !== 'undefined') || Som.efeitosLigados;
    t.innerHTML = `<div class="ini">
      <div class="ini-veu" aria-hidden="true"></div>
      <div class="ini-marca">
        <h1 class="ini-h1">${logo('ini-logo')}</h1>
        <p class="ini-missao peca amarela pinos">${arte('selo-missao-2050', { classe: 'ini-selo' })}
          <span class="ini-missao-textos"><b class="marca">Missão 2050</b><span>Governe uma potência e mude o mundo inteiro — sem guerra.</span></span></p>
      </div>
      <nav class="ini-menu" aria-label="Menu principal">
        <button class="btn btn-principal peca pinos grandes ini-jogar" data-teste="jogar">Jogar ${GLIFOS.seta}</button>
        ${salvo ? `<button class="btn btn-neutro peca ini-item" data-teste="continuar">${arte('maleta', { classe: 'ini-arte' })}<span>Continuar a partida</span></button>` : ''}
        <button class="btn btn-neutro peca ini-item" data-teste="manual">${arte('manual', { classe: 'ini-arte' })}<span>Manual do Diplomata</span></button>
        <button class="btn btn-neutro peca ini-item" data-teste="professor">${arte('prancheta', { classe: 'ini-arte' })}<span>Para o professor</span></button>
      </nav>
      <div class="ini-ajustes" role="group" aria-label="Som e tela">
        <button class="btn btn-neutro btn-mini peca ini-som" data-acao="musica" aria-pressed="${musica}">${icoBtn(musica ? 'som' : 'mudo')}<span>Música</span></button>
        <button class="btn btn-neutro btn-mini peca ini-som" data-acao="efeitos" aria-pressed="${efeitos}">${icoBtn(efeitos ? 'som' : 'mudo')}<span>Efeitos</span></button>
        <button class="btn btn-neutro btn-mini peca" data-acao="tela-cheia">${icoBtn('cheia')}<span>Tela cheia</span></button>
      </div>
      <div class="ini-mascote" aria-hidden="true"><div class="ini-palco"></div>
        <p class="ini-balao balao peca flutua fala"><span>${FALAS[0]}</span></p></div>
      <footer class="ini-rodape">
        <button class="btn btn-neutro btn-mini peca" data-acao="creditos">${arte('pilha-tijolos', { classe: 'ini-arte-mini' })}<span>Créditos</span></button>
        <span class="ini-nota letra-bolha pequena">Feito para o telão da sala · funciona sem internet</span>
      </footer>
    </div>`;
    mostrarTela('inicio');
    if ((typeof Mapa3D !== 'undefined')) tenta(() => { Mapa3D.iniciar($('#mundo')); Mapa3D.pausar(false); Mapa3D.modo('inicio'); });
    if ((typeof Mascote !== 'undefined')) tenta(() => Mascote.iniciar(t.querySelector('.ini-palco')));
    if (!tenta(() => document.createElement('canvas').getContext('webgl2'))) t.querySelector('.ini').insertAdjacentHTML('afterbegin',
      '<p role="alert" style="position:absolute;z-index:9;right:2vh;top:2vh;max-width:46vh;padding:1.4vh;border-radius:1.2vh;background:#FFE14D;color:#222;font:700 1.8vh system-ui">O 3D não abriu: o navegador está sem WebGL. No Chrome, ative \'Usar aceleração de hardware\' em Configurações › Sistema, reinicie e confira em chrome://gpu.</p>');
    if ((typeof Som !== 'undefined')) tenta(() => Som.musica('menu'));
    t.querySelector('.ini').addEventListener('click', cliqueInicio);
    ini = { tl: entradaInicio(t), falas: 0 };
    ini.tl?.eventCallback('onComplete', () => posEntrada(t));
    if (!ini.tl) posEntrada(t);
    const pular = () => ini?.tl?.progress(1);
    t.addEventListener('pointerdown', pular, { once: true });
    document.addEventListener('keydown', ini.tecla = ev => {
      if (document.body.dataset.tela !== 'inicio' || painelAberto() || digitando(ev)) return;
      pular();
      const k = ev.key.toLowerCase();
      if (k === 'm') alternarSom(t.querySelector('[data-acao="musica"]'));
      if (k === 'f') telaCheia();
    });
    anunciar('Geografia Irada. Missão 2050.');
  }
  function entradaInicio(t) {
    const q = s => t.querySelectorAll(s), u = uPx();
    if (RM) { gsap.fromTo(q('.ini-marca, .ini-menu, .ini-ajustes, .ini-mascote, .ini-rodape'), { opacity: 0 }, { opacity: 1, duration: .2 }); return null; }
    const tl = gsap.timeline();
    const svg = t.querySelector('.logo');
    if (svg && typeof animarLogo === 'function') { const l = animarLogo(svg); if (l) tl.add(l, .1); }
    tl.fromTo(q('.ini-mascote'), { y: 14 * u, opacity: 0, scale: .82 }, { y: 0, opacity: 1, scale: 1, duration: .62, ease: 'back.out(1.6)' }, .35)
      .fromTo(q('.ini-missao'), { scale: .3, opacity: 0, rotation: -14 }, { scale: 1, opacity: 1, rotation: 0, duration: .5, ease: 'back.out(2.2)',
        onStart: () => efeitoSom('pop') }, 1.05)
      .fromTo(q('.ini-menu > *'), { y: 5 * u, opacity: 0 }, { y: 0, opacity: 1, duration: .4, stagger: .07, ease: 'back.out(1.8)' }, 1.2)
      .fromTo(q('.ini-balao'), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: .45, ease: 'back.out(2.4)' }, 1.7)
      .fromTo(q('.ini-ajustes > *, .ini-rodape > *'), { y: -1.6 * u, opacity: 0 }, { y: 0, opacity: 1, duration: .3, stagger: .05, ease: 'power2.out' }, 1.45);
    return tl;
  }
  // Depois da entrada: o botão Jogar "respira" e o mascote troca de fala a cada 7 s
  function posEntrada(t) {
    if (!ini) return;
    const jogar = t.querySelector('.ini-jogar');
    ini.laco = RM ? null : gsap.to(jogar, { scale: 1.04, duration: 1, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    const balao = t.querySelector('.ini-balao');
    const trocar = () => {
      if (!ini || !balao.isConnected) return;
      ini.falas = (ini.falas + 1) % FALAS.length;
      const span = balao.querySelector('span'), fala = FALAS[ini.falas];
      if (RM) span.textContent = fala;
      else ini.troca = gsap.timeline().to(balao, { scale: .9, opacity: 0, duration: .16, ease: 'power2.in' })
        .call(() => (span.textContent = fala))
        .to(balao, { scale: 1, opacity: 1, duration: .4, ease: 'back.out(2.4)' });
      ini.falas_t = setTimeout(trocar, 7000);
    };
    ini.falas_t = setTimeout(trocar, 7000);
  }
  function sairDoInicio() {
    if (!ini) return;
    ini.tl?.kill(); ini.laco?.kill(); ini.troca?.kill(); clearTimeout(ini.falas_t);
    document.removeEventListener('keydown', ini.tecla);
    ini = null;
    if ((typeof Mascote !== 'undefined')) tenta(() => Mascote.parar());
  }
  function cliqueInicio(ev) {
    const b = ev.target.closest('button');
    if (!b) return;
    efeitoSom('clique');
    const acao = b.dataset.teste || b.dataset.acao;
    if (acao === 'jogar') lobby();
    else if (acao === 'continuar') continuar();
    else if (acao === 'manual') (typeof Manual !== 'undefined') && Manual.abrir();
    else if (acao === 'professor') professor();
    else if (acao === 'creditos') creditos();
    else if (acao === 'musica' || acao === 'efeitos') alternarSom(b);
    else if (acao === 'tela-cheia') telaCheia();
  }
  async function continuar() {
    sairDoInicio();
    if ((typeof Mapa3D !== 'undefined')) tenta(() => Mapa3D.modo('jogo'));
    const ok = await Promise.resolve(tenta(() => Jogo.continuar())).catch(() => false);
    if (ok === false) { aviso('Não deu para abrir a partida salva.', { tipo: 'ruim' }); inicio(); }
  }
  function alternarSom(b) {
    if (!b || !(typeof Som !== 'undefined')) return;
    const musica = b.dataset.acao === 'musica';
    const ligado = musica ? Som.alternarMusica() : Som.alternarEfeitos();
    if (musica && ligado) Som.musica('menu');
    b.setAttribute('aria-pressed', ligado);
    b.querySelector('.ico-btn').src = ICONES_BOTAO[ligado ? 'som' : 'mudo'];
    anunciar(`${musica ? 'Música' : 'Efeitos'} ${ligado ? 'ligados' : 'desligados'}`.replace('Música ligados', 'Música ligada').replace('Música desligados', 'Música desligada'));
  }
  function telaCheia() {
    const d = document;
    if (d.fullscreenElement) d.exitFullscreen?.().catch(() => {});
    else d.documentElement.requestFullscreen?.().catch(() => aviso('O navegador não deixou abrir a tela cheia.', { tipo: 'neutro' }));
  }

  // ============================== LOBBY ==============================
  let S = null;        // configuração do lobby (fica entre partidas da mesma aula)
  let lob = null;      // { tela, tecla, redim }
  function estadoLobby() {
    if (S) return S;
    const pref = lerPref('lobby', {}) || {};
    const avs = (typeof Bonecos !== 'undefined') ? Bonecos.avataresIniciais(PIDS) : PIDS.map(pid => ({ pid, cor: corDe(pid), forma: corDe(pid, 'forma'), comemoracao: 'comemorar' }));
    S = {
      passo: 1, modo: MODOS.some(m => m.id === pref.modo) ? pref.modo : 'competitivo', rodadas: [4, 6, 8].includes(pref.rodadas) ? pref.rodadas : 6,
      missoes: pref.missoes ?? true, infiltrado: !!pref.infiltrado, tempo: TEMPOS.some(([s]) => s === pref.tempo) ? pref.tempo : 0,
      mediador: !!pref.mediador, foco: Array.isArray(pref.foco) ? pref.foco.filter(f => TEMAS.some(x => x.id === f)) : [],
      vagas: PIDS.map((pid, i) => ({ pid, humano: Array.isArray(pref.humanos) ? pref.humanos.includes(pid) : true, nome: '', bloco: BLOCOS[i % 2].id })),
      avatares: avs.map(a => ({ ...a, comemoracao: a.comemoracao || 'comemorar' })),
    };
    return S;
  }
  const vaga = pid => S.vagas.find(v => v.pid === pid);
  const humanos = () => S.vagas.filter(v => v.humano);
  const nomeDe = v => (v.humano ? v.nome.trim() || nomeEquipe(v.pid) : 'Computador');
  const avatares = () => S.avatares.map(a => ({ ...a, humano: vaga(a.pid).humano, nome: nomeDe(vaga(a.pid)) }));
  const modoAtual = () => MODOS.find(m => m.id === S.modo);
  // faixa do palco 3D em frações da altura, casada com o layout em u (16:9, 16:10 e 4:3)
  const faixaLobby = () => {
    const u = uPx() / innerHeight, passo2 = S?.passo === 2;   // passo 1: bonecos mais baixos, acima dos cartões de modo; passo 2: palco curto, o carrossel ocupa o meio
    return retratoTela() ? (passo2 ? [12.6 * u, 24.4 * u] : [11 * u, 27 * u]) : (passo2 ? [3.4 * u, 31 * u] : [8.6 * u, 46 * u]);
  };
  // celular e tablet em pé: o lobby troca a unidade por uma que segue a largura (css/telas.css, html.retrato)
  const retratoTela = () => innerWidth / innerHeight <= .9;
  const ajustarRetrato = () => document.documentElement.classList.toggle('retrato', retratoTela());

  function lobby() {
    sairDoInicio();
    estadoLobby();
    ajustarRetrato();
    S.passo = 1;
    const t = $('#tela-lobby');
    t.innerHTML = `<div class="lob" data-passo="1">
      <header class="lob-topo">
        <button class="btn btn-neutro btn-mini peca lob-voltar" data-acao="voltar">${GLIFOS.voltar}<span>Início</span></button>
        <h1 class="lob-titulo letra-bolha relevo" tabindex="-1"></h1>
        <ol class="lob-passos">
          <li><button class="lob-passo peca" data-acao="passo-1"><b class="num">1</b><span>Modo</span></button></li>
          <li class="lob-trilho" aria-hidden="true"></li>
          <li><button class="lob-passo peca" data-acao="passo-2"><b class="num">2</b><span>Delegações</span></button></li>
        </ol>
      </header>
      <section class="lob-modos" aria-label="Modos de jogo">${MODOS.map(cartaoModo).join('')}</section>
      <section class="lob-vagas" aria-roledescription="carrossel" aria-label="Delegações: uma nação por vez">
        <div class="car-fichas" role="tablist" aria-label="Escolha a nação (setas do teclado passam de uma para outra)">${PIDS.map(fichaMini).join('')}</div>
        <div class="car-palco">
          <button class="car-seta car-ant btn-seta peca" data-acao="anterior" data-teste="nacao-anterior" aria-label="Nação anterior">${GLIFOS.voltar}</button>
          <div class="car-trilho">${PIDS.map(cartaoVaga).join('')}</div>
          <button class="car-seta car-prox btn-seta peca" data-acao="proxima" data-teste="nacao-proxima" aria-label="Próxima nação">${GLIFOS.seta}</button>
        </div>
      </section>
      <section class="lob-bancada" aria-label="Duração, ajustes e começar">
        <div class="banc-grupo" role="radiogroup" aria-labelledby="banc-rod">
          <h2 class="banc-rotulo letra-bolha" id="banc-rod">Duração da partida</h2>
          <div class="banc-tijolos">${RODADAS.map(cartaoRodada).join('')}</div>
        </div>
        <hr class="divisoria vertical">
        <div class="banc-grupo banc-ajustes">
          <h2 class="banc-rotulo letra-bolha">Ajustes</h2>
          <ul class="banc-resumo" aria-live="polite"></ul>
          <button class="btn btn-neutro btn-mini peca banc-mudar" data-acao="ajustes">${arte('engrenagem', { classe: 'ini-arte-mini' })}<span>Mudar ajustes</span></button>
        </div>
        <div class="banc-comecar">
          <button class="btn btn-principal peca pinos grandes lob-comecar" data-teste="comecar"><span>Começar!</span>${GLIFOS.seta}</button>
          <p class="lob-motivo" id="lob-motivo" aria-live="polite"></p>
        </div>
      </section>
    </div>`;
    const raiz = t.querySelector('.lob');
    raiz.addEventListener('click', cliqueLobby);
    mostrarTela('lobby');
    lob = { tela: t };
    document.addEventListener('keydown', lob.tecla = teclaLobby);
    addEventListener('resize', lob.redim = () => requestAnimationFrame(() => { ajustarRetrato(); atualizarCena(); centrar(false); }));
    if ((typeof Cenas3D !== 'undefined')) tenta(() => Cenas3D.lobby(avatares(), { faixa: faixaLobby() }));
    PIDS.forEach(pintarVaga);
    pintarModos(); pintarRodadas(); pintarResumo(); validar();
    ligarCarrossel();
    irPara(1, { primeira: true });
    if ((typeof Som !== 'undefined')) tenta(() => Som.musica('menu'));
  }
  function sairDoLobby() {
    if (!lob) return;
    document.removeEventListener('keydown', lob.tecla);
    removeEventListener('resize', lob.redim);
    document.documentElement.classList.remove('retrato');
    lob = null;
  }

  // ---------- peças do lobby ----------
  const cartaoModo = m => `<button class="modo peca pinos ${m.cor}" data-teste="modo-${m.id}" data-modo="${m.id}" aria-pressed="false">
      <span class="modo-arte">${arte(m.arte, { classe: 'modo-objeto' })}</span>
      <span class="modo-tela"><span class="modo-nome">${m.nome}</span><span class="modo-texto">${m.texto}</span>
        <span class="pilula modo-quem">${ico('👥')}${m.quem}</span></span>
      <span class="selo ok modo-ok" aria-hidden="true">${GLIFOS.ok}</span></button>`;
  const cartaoRodada = r => `<button class="tijolo peca pinos rodada" role="radio" data-teste="rodadas-${r.n}" data-n="${r.n}" aria-checked="false"
      aria-label="${r.nome}: ${r.n} mandatos de ${r.anos} anos, cerca de ${r.min} minutos">
      <span class="rod-nome">${r.nome}</span><span class="rod-num"><b class="num">${r.n}</b>mandatos</span>
      <span class="rod-tempo num">≈ ${r.min} min</span></button>`;
  // Ficha pequena da fileira de cima: cor + forma da equipe e, embaixo, quem joga (ícone de pessoas = equipe, de computador = computador)
  function fichaMini(pid) {
    return `<button class="ficha-mini peca" role="tab" id="ficha-${pid}" data-pid="${pid}" data-acao="nacao" data-teste="nacao-${pid}" data-equipe="${pid}" aria-controls="vaga-${pid}" aria-selected="false" tabindex="-1">
      ${formaDe(pid, { branca: true, classe: 'ficha-forma' })}<span class="ficha-quem" aria-hidden="true"></span><span class="so-leitor ficha-txt"></span></button>`;
  }
  // Ficha grande da nação: boneco, força e fraqueza (de conteudo/potencias.js) e os controles de quem joga
  function cartaoVaga(pid) {
    const d = POTENCIAS.find(p => p.id === pid) || {};
    return `<article class="vaga" id="vaga-${pid}" role="tabpanel" aria-labelledby="ficha-${pid}" aria-roledescription="nação" data-pid="${pid}" data-atual="false">
      <div class="vaga-peca peca pinos" data-equipe="${pid}">
        <header class="vaga-aba" data-equipe="${pid}">${formaDe(pid, { branca: true, classe: 'vaga-forma' })}<h2 class="vaga-pais letra-bolha">${esc(nomePais(pid))}</h2>
          <span class="vaga-pos pilula num" aria-hidden="true">${PIDS.indexOf(pid) + 1} de ${PIDS.length}</span></header>
        <div class="vaga-corpo">
          <span class="vaga-foto" data-equipe="${pid}">${formaDe(pid, { classe: 'vaga-foto-forma' })}</span>
          <div class="vaga-info">
            <p class="vaga-ponto vaga-forca"><b>Força: ${comIcones(d.forca?.titulo || '')}.</b> ${comIcones(d.forca?.texto || '')}</p>
            <p class="vaga-ponto vaga-fraqueza"><b>Fraqueza: ${comIcones(d.fraqueza?.titulo || '')}.</b> ${comIcones(d.fraqueza?.texto || '')}</p>
          </div>
          <div class="vaga-controles">
            <button class="vaga-nome" data-acao="editar"><span class="vaga-nome-txt"></span>${icoBtn('editar')}</button>
            <button class="vaga-quem peca" data-teste="potencia-${pid}" data-acao="quem"></button>
            <div class="vaga-blocos" role="radiogroup" aria-label="Bloco: ${nomePais(pid)}">${BLOCOS.map(b =>
              `<button class="vaga-bloco" role="radio" data-acao="bloco" data-bloco="${b.id}" aria-checked="false" aria-label="${b.nome}">${ico(b.icone, 32)}<span>${b.nome.replace('Bloco ', '')}</span></button>`).join('')}</div>
          </div>
        </div>
      </div>
    </article>`;
  }
  function pintarVaga(pid) {
    const el = lob?.tela.querySelector(`.vaga[data-pid="${pid}"]`);
    if (!el) return;
    const v = vaga(pid), nome = el.querySelector('.vaga-nome'), quem = el.querySelector('.vaga-quem');
    el.dataset.humano = v.humano;
    nome.disabled = !v.humano;
    nome.querySelector('.vaga-nome-txt').textContent = v.humano ? nomeDe(v) : 'Decide sozinho';
    nome.setAttribute('aria-label', v.humano ? `${nomeDe(v)}: editar o nome e o boneco (${nomePais(pid)})` : `${nomePais(pid)}: o computador decide sozinho`);
    quem.setAttribute('aria-pressed', v.humano);
    quem.setAttribute('aria-label', `${nomePais(pid)}: ${v.humano ? 'jogado por uma equipe' : 'jogado pelo computador'}. Clique para trocar.`);
    quem.innerHTML = v.humano ? `${ico('👥', 40)}<span>Equipe</span>${icoBtn('trocar')}` : `${ico('💻', 40)}<span>Computador</span>${icoBtn('trocar')}`;
    el.querySelectorAll('.vaga-bloco').forEach(b => b.setAttribute('aria-checked', b.dataset.bloco === v.bloco));
    const f = lob.tela.querySelector(`.ficha-mini[data-pid="${pid}"]`);
    if (f) {
      f.dataset.humano = v.humano;
      f.querySelector('.ficha-quem').innerHTML = ico(v.humano ? '👥' : '💻', 32);
      f.querySelector('.ficha-txt').textContent = `${nomePais(pid)}: ${v.humano ? 'equipe' : 'computador'}`;
      f.setAttribute('aria-label', `${nomePais(pid)}: ${v.humano ? 'equipe' : 'computador'}`);
    }
    if (el.dataset.atual === 'true') pintarFoto(pid);
  }
  function pintarModos() {
    lob?.tela.querySelectorAll('.modo').forEach(b => b.setAttribute('aria-pressed', b.dataset.modo === S.modo));
    const raiz = lob?.tela.querySelector('.lob');
    if (raiz) raiz.dataset.modo = S.modo;
    const passo1 = lob?.tela.querySelector('[data-acao="passo-1"] span');
    if (passo1) passo1.textContent = S.passo === 2 ? modoAtual().nome : 'Modo';
  }
  function pintarRodadas() {
    lob?.tela.querySelectorAll('.rodada').forEach(b => b.setAttribute('aria-checked', +b.dataset.n === S.rodadas));
  }
  function pintarResumo() {
    const ul = lob?.tela.querySelector('.banc-resumo');
    if (!ul) return;
    const coop = S.modo === 'cooperativo', itens = [];
    if (coop) itens.push(['🎯', 'Metas 2050 da turma']);
    else itens.push(['🎯', S.missoes ? 'Missões secretas' : 'Sem missões secretas']);
    if (coop && S.infiltrado && infiltradoPossivel()) itens.push(['🕵', 'Agente infiltrado']);
    itens.push(['⏳', S.tempo ? `${TEMPOS.find(([s]) => s === S.tempo)[1]} por vez` : 'Tempo livre']);
    if (S.mediador) itens.push(['🎓', 'Professor mediador']);
    if (S.modo === 'blocos') BLOCOS.forEach(b => { const n = humanos().filter(v => v.bloco === b.id).length; if (n) itens.push([b.icone, `${b.nome}: ${n} ${n === 1 ? 'equipe' : 'equipes'}`]); });
    const foco = S.foco.map(id => TEMAS.find(x => x.id === id)?.nome).filter(Boolean);
    itens.push(['📍', foco.length ? `Foco: ${foco.length > 1 ? foco.length + ' temas' : foco[0]}` : 'Foco: mundo todo']);
    ul.innerHTML = itens.map(([e, txt]) => `<li class="pilula">${ico(e, 32)}${esc(txt)}</li>`).join('');
  }
  const infiltradoPossivel = () => S.modo === 'cooperativo' && humanos().length >= 3;

  // ---------- passos (1: modo · 2: delegações e ajustes) ----------
  function irPara(passo, { primeira = false } = {}) {
    const raiz = lob?.tela.querySelector('.lob');
    if (!raiz) return;
    const antes = S.passo;
    S.passo = passo;
    raiz.dataset.passo = passo;
    pintarModos();
    const titulo = raiz.querySelector('.lob-titulo');
    titulo.textContent = passo === 1 ? 'Como a turma vai jogar?' : 'Quem governa cada potência?';
    raiz.querySelectorAll('.lob-passo').forEach((b, i) => {
      b.classList.toggle('atual', i + 1 === passo);
      b.classList.toggle('feito', i + 1 < passo);
      b.querySelector('b').innerHTML = i + 1 < passo ? GLIFOS.ok : i + 1;
      b.toggleAttribute('aria-current', i + 1 === passo);
      if (i + 1 === passo) b.setAttribute('aria-current', 'step');
    });
    raiz.querySelector('.lob-voltar span').textContent = passo === 1 ? 'Início' : 'Modo';
    if (!primeira) atualizarCena();   // a faixa do palco 3D muda de um passo para o outro
    const entram = passo === 1 ? raiz.querySelectorAll('.modo') : raiz.querySelectorAll('.car-fichas, .car-palco, .lob-bancada');
    const u = uPx();
    if (passo === 2) requestAnimationFrame(() => { centrar(false); tenta(() => Cenas3D.focoLobby(PIDS[S.atual ?? 0], { animar: antes !== 2 })); });
    else tenta(() => Cenas3D.focoLobby(null));
    if (RM) gsap.fromTo(entram, { opacity: 0 }, { opacity: 1, duration: .18 });
    else gsap.fromTo(entram, { y: 7 * u, opacity: 0 }, { y: 0, opacity: 1, duration: .42, stagger: .06, ease: 'back.out(1.6)', delay: primeira ? .5 : 0, clearProps: 'transform' });
    if (!primeira && antes !== passo) { efeitoSom('whoosh'); titulo.focus({ preventScroll: true }); }
    anunciar(passo === 1 ? 'Passo 1: escolha o modo de jogo.' : `Passo 2: delegações e ajustes. Modo ${modoAtual().nome}.`);
  }

  // ---------- Carrossel de nações: uma em destaque, as vizinhas menores dos lados (rolagem horizontal com encaixe) ----------
  // Rolar com o dedo, ◀ ▶, setas do teclado ou clicar numa ficha da fileira de cima: tudo leva ao mesmo S.atual.
  const trilho = () => lob?.tela.querySelector('.car-trilho');
  const cartaoDe = pid => lob?.tela.querySelector(`.vaga[data-pid="${pid}"]`);
  function centrar(animar = true) {
    const t = trilho(), c = cartaoDe(PIDS[S.atual ?? 0]);
    if (!t || !c || !t.clientWidth) return;
    const alvo = c.offsetLeft - (t.clientWidth - c.offsetWidth) / 2;
    if (Math.abs(t.scrollLeft - alvo) < 2) return;
    t.scrollTo({ left: alvo, behavior: animar && !RM && !RAPIDO ? 'smooth' : 'instant' });
  }
  function selecionarNacao(i, { rolar = true, anunciando = true, foco = null } = {}) {
    i = (i + PIDS.length) % PIDS.length;
    const pid = PIDS[i], mudou = S.atual !== i;
    S.atual = i;
    lob?.tela.querySelectorAll('.vaga').forEach(c => {
      const eh = c.dataset.pid === pid;
      c.dataset.atual = eh;
      c.querySelector('.vaga-peca').inert = !eh;   // as vizinhas só enfeitam: nada nelas recebe foco nem clique até virarem a central
    });
    lob?.tela.querySelectorAll('.ficha-mini').forEach(f => { const eh = f.dataset.pid === pid; f.setAttribute('aria-selected', eh); f.tabIndex = eh ? 0 : -1; if (eh) { if (foco) f.focus({ preventScroll: true }); f.parentElement.scrollTo?.({ left: f.offsetLeft - (f.parentElement.clientWidth - f.offsetWidth) / 2, behavior: RM || RAPIDO ? 'instant' : 'smooth' }); } });
    pintarFoto(pid);
    if (S.passo === 2) tenta(() => Cenas3D.focoLobby(pid));   // a câmera anda até o boneco, ele sobe no pedestal e ganha o holofote
    if (rolar) centrar();
    if (mudou && anunciando) { efeitoSom('clique'); anunciar(`${nomePais(pid)}, nação ${i + 1} de ${PIDS.length}: ${vaga(pid).humano ? 'jogada por uma equipe' : 'jogada pelo computador'}.`); }
  }
  // Rolou (dedo, roda do mouse, teclado): a central é a que estiver mais perto do meio do trilho
  function ligarCarrossel() {
    const t = trilho();
    if (!t) return;
    let espera = 0;
    t.addEventListener('scroll', () => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        const meio = t.scrollLeft + t.clientWidth / 2, cartoes = [...t.children];
        const perto = cartoes.reduce((m, c, i) => (Math.abs(c.offsetLeft + c.offsetWidth / 2 - meio) < Math.abs(cartoes[m].offsetLeft + cartoes[m].offsetWidth / 2 - meio) ? i : m), 0);
        if (perto !== S.atual) selecionarNacao(perto, { rolar: false });
      }, 90);
    }, { passive: true });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => centrar(false)).observe(t);   // o trilho nasce escondido (passo 1): centra quando ganhar largura
    selecionarNacao(Math.min(S.atual ?? 0, PIDS.length - 1), { rolar: false, anunciando: false });
    requestAnimationFrame(() => centrar(false));
  }
  // Retrato do boneco na ficha central (só da nação em destaque: cada retrato é uma foto 3D)
  function pintarFoto(pid) {
    const el = cartaoDe(pid)?.querySelector('.vaga-foto');
    if (!el || typeof Cenas3D === 'undefined' || !Cenas3D.retrato) return;
    const av = avatares().find(a => a.pid === pid);
    if (!av) return;
    const chave = chaveAv(av);
    if (el.dataset.chave === chave) return;
    el.dataset.chave = chave;
    tenta(() => Cenas3D.retrato(av, { tamanho: 120, enquadramento: 'rosto' })).then?.(url => {
      if (!url || el.dataset.chave !== chave) return;
      let img = el.querySelector('img');
      if (!img) { img = document.createElement('img'); img.alt = ''; img.draggable = false; el.prepend(img); }
      img.src = url;
      el.classList.add('pronta');
    }, () => {});
  }
  const chaveAv = a => JSON.stringify([a.cor, a.forma, a.pele, a.cabelo, a.penteado, a.chapeu, a.acessorio, a.humano]);

  // ---------- ações do lobby ----------
  function cliqueLobby(ev) {
    if (S.passo === 2 && !ev.target.closest?.('button, .car-palco, .lob-bancada, .car-fichas, .lob-topo')) {   // clique no boneco: o mais perto do toque, dentro da faixa do palco 3D
      const [topo, base] = faixaLobby(), y = ev.clientY / innerHeight;
      if (y >= topo && y <= base) {
        const pts = PIDS.map((pid, i) => [i, tenta(() => Cenas3D.ancora(pid))]).filter(([, a]) => a?.visivel);
        const [melhor] = pts.sort((a, b) => Math.abs(a[1].x - ev.clientX) - Math.abs(b[1].x - ev.clientX))[0] || [];
        if (melhor !== undefined && Math.abs(pts.find(([i]) => i === melhor)[1].x - ev.clientX) < 6 * uPx()) return selecionarNacao(melhor);
      }
    }
    const vizinha = ev.target.closest?.('.vaga[data-atual="false"]');
    if (vizinha) return selecionarNacao(PIDS.indexOf(vizinha.dataset.pid), { foco: false });
    const b = ev.target.closest('button');
    if (!b || b.disabled) return;
    const acao = b.dataset.acao || (b.dataset.modo && 'modo') || (b.dataset.n && 'rodadas') || b.dataset.teste;
    const pid = b.closest('.vaga')?.dataset.pid || b.dataset.pid;
    if (acao !== 'quem' && acao !== 'comecar') efeitoSom('clique');
    if (acao === 'anterior') return selecionarNacao(S.atual - 1);
    if (acao === 'proxima') return selecionarNacao(S.atual + 1);
    if (acao === 'nacao') return selecionarNacao(PIDS.indexOf(pid), { foco: true });
    if (acao === 'voltar') return S.passo === 2 ? irPara(1) : inicio();
    if (acao === 'passo-1') return S.passo !== 1 && irPara(1);
    if (acao === 'passo-2') return S.passo !== 2 && irPara(2);
    if (acao === 'modo') return escolherModo(b.dataset.modo);
    if (acao === 'rodadas') {
      S.rodadas = +b.dataset.n; pintarRodadas(); validar();
      const r = RODADAS.find(x => x.n === S.rodadas);
      if (!RM) gsap.fromTo(b, { scaleY: .86, scaleX: 1.06 }, { scaleY: 1, scaleX: 1, duration: .35, ease: 'back.out(3)' });
      return anunciar(`Partida ${r.nome}: ${r.n} mandatos de ${r.anos} anos, cerca de ${r.min} minutos.`);
    }
    if (acao === 'quem') return alternarQuem(pid, b);
    if (acao === 'bloco') { vaga(pid).bloco = b.dataset.bloco; pintarVaga(pid); pintarResumo(); validar(); return anunciar(`${nomePais(pid)} no ${BLOCOS.find(x => x.id === b.dataset.bloco).nome}`); }
    if (acao === 'editar') return provador(pid);
    if (acao === 'ajustes') return abrirAjustes();
    if (acao === 'comecar') return comecar(b);
  }
  function teclaLobby(ev) {
    if (document.body.dataset.tela !== 'lobby' || painelAberto() || digitando(ev)) return;
    if (ev.key === 'Escape') { ev.preventDefault(); S.passo === 2 ? irPara(1) : inicio(); }
    else if (S.passo === 2 && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(ev.key) && !ev.target.closest?.('.vaga-blocos, .ajustes, [role="dialog"]')) {
      ev.preventDefault();
      const d = { ArrowLeft: S.atual - 1, ArrowRight: S.atual + 1, Home: 0, End: PIDS.length - 1 }[ev.key];
      selecionarNacao(d, { foco: !!ev.target.closest?.('.ficha-mini') });
    }
    else if (ev.key.toLowerCase() === 'f') telaCheia();
  }
  function escolherModo(id) {
    const mudou = S.modo !== id;
    S.modo = id;
    pintarModos();
    const card = lob.tela.querySelector(`.modo[data-modo="${id}"]`);
    efeitoSom('pop');
    if (id === 'solo' && humanos().length !== 1) {   // Solo: só uma equipe; as outras ficam com o computador
      const fica = humanos()[0] || vaga('brasil');
      S.vagas.forEach(v => (v.humano = v === fica));
      PIDS.forEach(pintarVaga);
      atualizarCena();
      if (mudou) setTimeout(() => aviso(`No Solo, só a ${nomeEquipe(fica.pid)} joga. As outras potências ficam com o computador.`, { tipo: 'neutro', icone: arte('maleta', { classe: 'aviso-arte' }) }), 500);
    }
    if (id === 'blocos') distribuirBlocos();
    pintarResumo(); validar();
    anunciar(`Modo escolhido: ${modoAtual().nome}.`);
    if (RM || RAPIDO) return irPara(2);   // teste automático e movimento reduzido: troca na hora
    gsap.timeline().fromTo(card, { scale: 1 }, { scale: 1.06, duration: .12, ease: 'power2.out' }).to(card, { scale: 1, duration: .3, ease: 'back.out(3)' })
      .to(lob.tela.querySelectorAll('.modo'), { y: 6 * uPx(), opacity: 0, duration: .22, stagger: .03, ease: 'power2.in' }, '+=.05')
      .call(() => { gsap.set(lob?.tela.querySelectorAll('.modo') || [], { clearProps: 'all' }); irPara(2); });
  }
  // Em blocos: humanos alternam Sol/Onda se ainda estão todos no mesmo bloco
  function distribuirBlocos() {
    const hs = humanos();
    if (new Set(hs.map(v => v.bloco)).size < 2) hs.forEach((v, i) => (v.bloco = BLOCOS[i % 2].id));
    PIDS.forEach(pintarVaga);
  }
  function alternarQuem(pid, botao) {
    const v = vaga(pid);
    if (S.modo === 'solo' && !v.humano) S.vagas.forEach(x => (x.humano = false));   // Solo: troca a equipe que joga
    v.humano = !v.humano;
    efeitoSom(v.humano ? 'subir' : 'descer');
    if (S.modo === 'blocos' && v.humano) {   // entra no bloco com menos equipes
      const conta = BLOCOS.slice(0, 2).map(b => [b.id, humanos().filter(x => x !== v && x.bloco === b.id).length]).sort((a, b) => a[1] - b[1]);
      v.bloco = conta[0][0];
    }
    PIDS.forEach(pintarVaga);
    pintarResumo(); validar();
    atualizarCena();
    if (!RM) gsap.fromTo(botao, { scaleY: .84, scaleX: 1.08 }, { scaleY: 1, scaleX: 1, duration: .36, ease: 'back.out(3)' });
    anunciar(`${nomePais(pid)}: ${v.humano ? 'equipe' : 'computador'}.`);
  }
  const atualizarCena = () => (typeof Cenas3D !== 'undefined') && tenta(() => Cenas3D.lobby(avatares(), { faixa: faixaLobby() }));

  // ---------- validação amigável ----------
  function problema() {
    const hs = humanos();
    if (!hs.length) return { texto: 'Falta escolher quem joga: troque pelo menos uma potência para “Equipe”.', curto: 'Falta uma equipe', alvo: '.vaga-quem' };
    if (S.modo === 'solo' && hs.length !== 1) return { texto: 'No Solo, só uma equipe joga. Deixe as outras com o computador.', curto: 'Só 1 equipe no Solo', alvo: '.vaga[data-humano="true"] .vaga-quem' };
    if (S.modo === 'blocos' && hs.length < 2) return { texto: 'Em blocos, são pelo menos 2 equipes. Troque mais uma potência para “Equipe”.', curto: 'Faltam equipes', alvo: '.vaga[data-humano="false"] .vaga-quem' };
    if (S.modo === 'blocos' && new Set(hs.map(v => v.bloco)).size < 2) return { texto: 'Separe as equipes em pelo menos 2 blocos diferentes.', curto: 'Faltam 2 blocos', alvo: '.vaga[data-humano="true"] .vaga-blocos' };
    const nomes = hs.map(v => nomeDe(v).toLocaleLowerCase('pt-BR'));
    const rep = hs.find((v, i) => nomes.indexOf(nomes[i]) !== i);
    if (rep) return { texto: `Duas equipes com o nome “${nomeDe(rep)}”: troque um deles.`, curto: 'Nomes repetidos', alvo: `.vaga[data-pid="${rep.pid}"] .vaga-nome` };
    return null;
  }
  function validar() {
    const b = lob?.tela.querySelector('.lob-comecar'), m = lob?.tela.querySelector('.lob-motivo');
    if (!b) return;
    const p = problema();
    b.classList.toggle('bloqueado', !!p);
    b.toggleAttribute('aria-disabled', !!p);
    if (p) b.setAttribute('aria-describedby', 'lob-motivo'); else b.removeAttribute('aria-describedby');
    m.textContent = p ? p.curto : '';
    m.hidden = !p;
    const n = humanos().length;
    if (!p) { m.hidden = false; m.textContent = `${n} ${n === 1 ? 'equipe' : 'equipes'} · ${RODADAS.find(r => r.n === S.rodadas).n} mandatos`; }
    m.classList.toggle('ok', !p);
  }

  // ---------- começar ----------
  async function comecar(botao) {
    const p = problema();
    if (p) {
      efeitoSom('erro');
      aviso(p.texto, { tipo: 'ruim' });
      const alvo = lob.tela.querySelector(p.alvo);
      const dono = alvo?.closest('.vaga')?.dataset.pid;
      if (dono && PIDS.indexOf(dono) !== S.atual) { selecionarNacao(PIDS.indexOf(dono), { anunciando: false }); await new Promise(r => setTimeout(r, RM || RAPIDO ? 30 : 380)); }
      if (alvo) { alvo.focus({ preventScroll: true }); if (!RM) gsap.fromTo(alvo, { x: -1.2 * uPx() }, { x: 0, duration: .5, ease: 'elastic.out(1.2, .3)', clearProps: 'transform' }); }
      return;
    }
    efeitoSom('sucesso');
    botao.disabled = true;
    const hs = humanos(), coop = S.modo === 'cooperativo';
    const config = {
      modo: S.modo === 'solo' ? 'competitivo' : S.modo, solo: S.modo === 'solo', rodadas: S.rodadas,
      missoes: !coop && S.missoes, infiltrado: coop && S.infiltrado && hs.length >= 3, foco: [...S.foco],
      tempoResposta: S.tempo, mediador: S.mediador,
      jogadores: hs.map(v => ({ potencia: v.pid, nome: nomeDe(v), bloco: S.modo === 'blocos' ? BLOCOS.find(b => b.id === v.bloco).nome : null })),
    };
    gravarPref('lobby', { modo: S.modo, rodadas: S.rodadas, missoes: S.missoes, infiltrado: S.infiltrado, tempo: S.tempo, mediador: S.mediador,
      foco: S.foco, humanos: hs.map(v => v.pid) });
    const avs = avatares();
    // as delegações comemoram e o mapa volta para o jogo
    tenta(() => Object.values(Cenas3D.palco?.bonecos || {}).forEach((b, i) => setTimeout(() => tenta(() => b.acao('comemorar')), i * 70)));
    if (!RM) gsap.to(lob.tela.querySelectorAll('.car-fichas, .car-palco, .lob-bancada, .lob-topo'), { y: 3 * uPx(), opacity: 0, duration: .3, stagger: .03, delay: .45, ease: 'power2.in' });
    await new Promise(r => setTimeout(r, RAPIDO ? 80 : RM ? 400 : 950));
    sairDoLobby();
    tenta(() => Cenas3D.esconder());
    if ((typeof Mapa3D !== 'undefined')) tenta(() => Mapa3D.modo('jogo'));
    Jogo.comecar(config, avs);
  }

  // ---------- ajustes da partida ----------
  function abrirAjustes() {
    const p = document.createElement('section');
    p.className = 'painel peca pinos painel-g lob-ajustes amarela';
    p.setAttribute('aria-labelledby', 'aj-titulo');
    p.innerHTML = `<header class="painel-cab">${arte('engrenagem', { classe: 'painel-objeto' })}
        <h2 class="painel-titulo" id="aj-titulo">Ajustes da partida<small class="painel-sub">Valem para esta partida e ficam guardados para a próxima.</small></h2>
        <button class="btn btn-ic peca" data-acao="fechar" aria-label="Fechar os ajustes">${GLIFOS.fechar}</button></header>
      <div class="tela"></div>
      <footer class="painel-rodape"><button class="btn btn-principal peca pinos" data-acao="fechar">Pronto ${GLIFOS.ok}</button></footer>`;
    const tela = p.querySelector('.tela');
    const linha = (id, icone, titulo, texto, controle, motivo = '') => `<div class="aj-linha${motivo ? ' bloqueada' : ''}" id="aj-${id}">
        <span class="aj-ico soquete">${ico(icone, 48)}</span>
        <span class="aj-textos"><b class="aj-titulo">${titulo}</b><span class="aj-texto">${motivo ? `<span class="aj-motivo">${esc(motivo)}</span>` : esc(texto)}</span></span>
        ${controle}</div>`;
    const chave = (id, ligado, rotulo, desligado = false) => `<button class="interruptor" role="switch" data-aj="${id}" aria-checked="${ligado}" aria-label="${rotulo}"${desligado ? ' disabled' : ''}><span>Não</span><span>Sim</span></button>`;
    const pintar = () => {
      const coop = S.modo === 'cooperativo', inf = infiltradoPossivel();
      tela.innerHTML = '<div class="aj-col">' + linha('missoes', '🎯', 'Missões secretas', 'Cada equipe recebe um objetivo escondido: cumprir vale +12 no índice.',
        chave('missoes', !coop && S.missoes, 'Missões secretas', coop), coop ? 'No “Todos pelo planeta”, a missão é de todos: as Metas 2050.' : '') +
        linha('infiltrado', '🕵', 'Agente infiltrado', 'Uma equipe recebe uma agenda oculta e tenta não ser descoberta.',
          chave('infiltrado', inf && S.infiltrado, 'Agente infiltrado', !inf), inf ? '' : 'Só no modo “Todos pelo planeta”, com 3 equipes ou mais.') +
        linha('tempo', '⏳', 'Tempo de decisão', 'Cronômetro para a vez de cada equipe. Dilemas sem pressa.',
          `<span class="alternador" role="radiogroup" aria-label="Tempo de decisão">${TEMPOS.map(([s, r]) =>
            `<button role="radio" data-aj="tempo" data-v="${s}" aria-checked="${S.tempo === s}">${r}</button>`).join('')}</span>`) +
        linha('mediador', '🎓', 'Professor mediador', 'O jogo espera você liberar cada vez, para a turma conversar.',
          chave('mediador', S.mediador, 'Professor mediador')) + '</div>' +
        `<div class="aj-foco"><div class="aj-linha sem-controle"><span class="aj-ico soquete">${ico('📍', 48)}</span>
          <span class="aj-textos"><b class="aj-titulo">Foco da aula</b><span class="aj-texto">Dilemas e eventos dos temas marcados saem 2,5 vezes mais. Nenhum marcado: o mundo todo.</span></span></div>
          <div class="aj-temas" role="group" aria-label="Temas do foco da aula">${TEMAS.map(x =>
            `<button class="aj-tema peca" data-aj="foco" data-v="${x.id}" aria-pressed="${S.foco.includes(x.id)}">${ico(x.icone, 40)}<span>${x.nome}</span><span class="aj-marca" aria-hidden="true">${GLIFOS.ok}</span></button>`).join('')}</div>
          <p class="aj-dica">${arte('globo-irado-pensando', { classe: 'aj-mascote' })}<span class="balao peca" data-ponta="nenhuma">Turma começando? Partida <b>Rápida</b> no modo <b>Todos pelo planeta</b>. Turma competitiva? Experimente <b>Em blocos</b>.</span></p></div>`;
    };
    pintar();
    p.addEventListener('click', ev => {
      const b = ev.target.closest('button');
      if (!b || b.disabled) return;
      if (b.dataset.acao === 'fechar') { efeitoSom('clique'); return fecharPainel(p); }
      const aj = b.dataset.aj;
      if (!aj) return;
      efeitoSom('clique');
      const foco = `[data-aj="${aj}"]${b.dataset.v ? `[data-v="${b.dataset.v}"]` : ''}`;
      if (aj === 'missoes' || aj === 'infiltrado' || aj === 'mediador') S[aj] = !S[aj];
      if (aj === 'tempo') S.tempo = +b.dataset.v;
      if (aj === 'foco') S.foco = S.foco.includes(b.dataset.v) ? S.foco.filter(x => x !== b.dataset.v) : [...S.foco, b.dataset.v];
      pintar(); pintarResumo();
      tela.querySelector(foco)?.focus({ preventScroll: true });
    });
    abrirPainel(p, { esc: true });
  }

  // ---------- provador (editor do boneco) ----------
  const ABAS_PROV = [
    { id: 'pele', nome: 'Pele', lista: () => Bonecos.PELES, frase: 'Seis tons humanos — nenhum é o “normal” — e o amarelo de brinquedo.' },
    { id: 'cabelo', nome: 'Cabelo', lista: () => Bonecos.CABELOS, frase: 'A cor do cabelo. O corte fica na aba Penteado.' },
    { id: 'penteado', nome: 'Penteado', lista: () => Bonecos.PENTEADOS, quadro: 'busto' },
    { id: 'chapeu', nome: 'Chapéu', lista: () => Bonecos.CHAPEUS, quadro: 'busto' },
    { id: 'acessorio', nome: 'Acessório', lista: () => Bonecos.ACESSORIOS, quadro: 'corpo' },
    { id: 'comemoracao', nome: 'Comemoração', lista: () => Bonecos.COMEMORACOES, quadro: 'corpo', frase: 'É assim que o boneco festeja no pódio.' },
  ];
  function provador(pid) {
    if (!(typeof Bonecos !== 'undefined')) return;
    const av = S.avatares.find(a => a.pid === pid), hist = [];
    let aba = 'chapeu', geracao = 0;
    const p = document.createElement('section');
    p.className = 'painel peca pinos painel-g provador';
    p.dataset.equipe = pid;
    p.setAttribute('aria-labelledby', 'prov-titulo');
    p.innerHTML = `<header class="painel-cab"><span class="prov-forma">${formaDe(pid, { branca: true })}</span>
        <h2 class="painel-titulo" id="prov-titulo">Boneco: ${esc(nomeDe(vaga(pid)))}<small class="painel-sub">${nomePais(pid)} · ${nomeEquipe(pid)}</small></h2>
        <button class="btn btn-ic peca" data-acao="pronto" aria-label="Fechar o provador">${GLIFOS.fechar}</button></header>
      <div class="tela prov-tela">
        <div class="prov-palco"><div class="prov-cena"></div><span class="prov-dica pilula escura">${icoBtn('trocar')}Arraste para girar</span></div>
        <div class="prov-lado">
          <label class="campo prov-campo"><span class="campo-rotulo">Nome da equipe <span class="campo-conta" aria-hidden="true"></span></span>
            <input class="entrada prov-nome" maxlength="14" autocomplete="off" spellcheck="false" placeholder="${nomeEquipe(pid)}" value="${esc(vaga(pid).nome)}"></label>
          <div class="abas" role="tablist" aria-label="Partes do boneco">${ABAS_PROV.map(a =>
            `<button class="peca" role="tab" id="prov-aba-${a.id}" aria-controls="prov-grade" aria-selected="${a.id === aba}" data-aba="${a.id}">${a.nome}</button>`).join('')}</div>
          <div class="prov-grade rebaixo-claro" id="prov-grade" role="tabpanel" tabindex="-1"></div>
          <div class="prov-item"><b class="prov-item-nome"></b><span class="prov-item-frase"></span></div>
        </div>
      </div>
      <footer class="painel-rodape">
        <button class="btn btn-neutro peca" data-acao="desfazer">${icoBtn('desfazer')}<span>Desfazer</span></button>
        <button class="btn btn-neutro peca" data-acao="sortear">${icoBtn('dado')}<span>Sortear</span></button>
        <button class="btn btn-principal peca pinos" data-acao="pronto">Pronto! ${GLIFOS.ok}</button>
      </footer>`;
    const grade = p.querySelector('.prov-grade'), cena = p.querySelector('.prov-cena'), campo = p.querySelector('.prov-nome');
    const conta = () => (p.querySelector('.campo-conta').textContent = `${campo.value.length}/14`);
    campo.addEventListener('input', () => {
      vaga(pid).nome = campo.value.slice(0, 14).replace(/\s+/g, ' ');
      conta();
      p.querySelector('#prov-titulo').firstChild.textContent = `Boneco: ${nomeDe(vaga(pid))}`;
    });
    campo.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); p.querySelector('[role="tab"][aria-selected="true"]').focus(); } });
    conta();
    const daAba = () => ABAS_PROV.find(a => a.id === aba);
    const previa = acao => tenta(() => Cenas3D.previa({ ...av, humano: true }, { el: cena, acao }));
    function pintarGrade() {
      const a = daAba(), lista = a.lista(), g = ++geracao;
      grade.setAttribute('aria-labelledby', 'prov-aba-' + a.id);
      grade.innerHTML = lista.map(o => `<button class="prov-op peca${o.cor ? ' cor' : ''}" data-id="${o.id}" aria-pressed="${av[a.id] === o.id}" aria-label="${esc(o.nome)}">
        ${o.cor ? `<span class="prov-cor" style="--c:${o.cor}"></span>` : '<span class="prov-mini carregando"></span>'}<span class="selo ok prov-ok" aria-hidden="true">${GLIFOS.ok}</span></button>`).join('');
      const sel = lista.find(o => o.id === av[a.id]) || lista[0];
      p.querySelector('.prov-item-nome').textContent = sel.nome;
      p.querySelector('.prov-item-frase').textContent = sel.frase || a.frase || '';
      if (lista[0].cor || !(typeof Cenas3D !== 'undefined')) return;
      (async () => {   // miniaturas renderizadas (3/4, fundo transparente), uma de cada vez
        for (const o of lista) {
          const url = await Promise.resolve(tenta(() => Cenas3D.retrato({ ...av, humano: true, [a.id]: o.id }, { tamanho: 160, enquadramento: a.quadro,
            acao: a.id === 'comemoracao' ? o.id : 'parado', expressao: a.id === 'comemoracao' ? 'alegre' : 'feliz' }))).catch(() => null);
          if (g !== geracao || !p.isConnected) return;
          const vaga_ = grade.querySelector(`[data-id="${o.id}"] .prov-mini`);
          if (url && vaga_) { vaga_.classList.remove('carregando'); vaga_.innerHTML = `<img src="${url}" alt="" draggable="false">`; if (!RM) gsap.from(vaga_.firstChild, { scale: .6, opacity: 0, duration: .3, ease: 'back.out(2)' }); }
          await new Promise(r => setTimeout(r, 0));
        }
      })();
    }
    function mudar(campo, valor, acao) {
      hist.push({ ...av });
      av[campo] = valor;
      previa(acao);
      pintarGrade();
    }
    const fechar = async () => {
      efeitoSom('clique');
      await fecharPainel(p).catch(() => {});
      await Promise.resolve(tenta(() => Cenas3D.previa(null))).catch(() => {});
      atualizarCena();
      pintarVaga(pid); validar();
      lob?.tela.querySelector(`.vaga[data-pid="${pid}"] .vaga-nome`)?.focus({ preventScroll: true });
    };
    p.addEventListener('click', ev => {
      const b = ev.target.closest('button');
      if (!b) return;
      const op = b.closest('.prov-op');
      if (op) { efeitoSom('clique'); mudar(aba, op.dataset.id, aba === 'comemoracao' ? op.dataset.id : null); grade.querySelector(`[data-id="${op.dataset.id}"]`)?.focus({ preventScroll: true }); return; }
      if (b.dataset.acao === 'pronto') return fechar();
      if (b.dataset.acao === 'desfazer') {
        efeitoSom('clique');
        if (!hist.length) return aviso('Nada para desfazer ainda.', { tipo: 'neutro' });
        Object.assign(av, hist.pop()); previa(); pintarGrade();
      }
      if (b.dataset.acao === 'sortear') {
        efeitoSom('clique');
        hist.push({ ...av });
        const novo = Bonecos.avataresIniciais([pid])[0];
        ['pele', 'cabelo', 'penteado', 'chapeu', 'acessorio'].forEach(k => (av[k] = novo[k]));
        av.comemoracao = sortear(Bonecos.COMEMORACOES).id;
        previa('pular'); pintarGrade();
      }
    });
    ativarAbas(p.querySelector('[role="tablist"]'), b => { aba = b.dataset.aba; grade.hidden = false; pintarGrade(); });
    abrirPainel(p, { esc: fechar, foco: '.prov-nome' });
    previa();
    anunciar(`Provador do boneco: ${nomePais(pid)}.`);
  }

  // ============================== REVELAÇÃO SECRETA ==============================
  const COR_PAPEL = { diplomata: '#8FE3FF', infiltrado: '#FF6B6B', missao: '#FFD21F' };
  function segredoDe(e, pid) {
    const p = e.potencias[pid];
    const temInfiltrado = e.config?.modo === 'cooperativo' && Object.values(e.potencias).some(x => x.papel === 'infiltrado');
    if (temInfiltrado) {
      if (p.papel === 'infiltrado') {
        const ag = typeof AGENDAS !== 'undefined' ? AGENDAS.find(a => a.id === p.agenda) : null;
        return { papel: 'infiltrado', pre: 'Seu papel é', palavra: 'Infiltrado', objeto: 'envelope-secreto', titulo: ag ? `Agenda secreta: ${ag.nome}` : 'Agenda secreta',
          texto: ag?.texto || 'Faça a turma falhar nas Metas 2050.', nota: 'Disfarce bem: se a reunião de emergência descobrir você, a agenda falha.' };
      }
      return { papel: 'diplomata', pre: 'Seu papel é', palavra: 'Diplomata', objeto: 'dossie', titulo: 'Missão da turma: Metas 2050',
        texto: 'Ajude a turma a cumprir 4 das 5 Metas 2050.', nota: 'Fique de olho: há um infiltrado entre as delegações.' };
    }
    if (!p.missao) return null;
    const m = typeof MISSOES !== 'undefined' ? MISSOES.find(x => x.id === p.missao) : null;
    return { papel: 'missao', pre: 'Sua missão secreta é', palavra: m?.nome || 'Missão secreta', objeto: 'dossie', titulo: 'Objetivo até 2050',
      texto: m?.texto || '', nota: 'Cumprir vale +12 no índice. Não conte para as outras equipes!' };
  }
  async function revelar(e, avs = []) {
    const lista = PIDS.filter(pid => e?.potencias?.[pid]?.humano).map(pid => ({ pid, s: segredoDe(e, pid) })).filter(x => x.s);
    if (!lista.length) return;
    sairDoLobby(); sairDoInicio();
    const t = $('#tela-revelacao');
    const avDe = pid => avs.find(a => a.pid === pid) || { pid, cor: corDe(pid), forma: corDe(pid, 'forma'), humano: true };
    t.innerHTML = `<div class="rev" data-fase="chamada">
      <header class="rev-topo"></header>
      <footer class="rev-base"></footer>
      <div class="rev-cortina" hidden><div class="rev-cortina-miolo">${arte('cadeado', { classe: 'rev-cadeado' })}
        <p class="rev-cortina-titulo letra-bolha relevo"></p><p class="rev-cortina-sub letra-bolha"></p></div></div>
    </div>`;
    mostrarTela('revelacao');
    if ((typeof Som !== 'undefined')) tenta(() => Som.musica('menu'));
    try {
      for (let i = 0; i < lista.length; i++) await revelarUm(t, lista[i], avDe(lista[i].pid), i, lista.length);
      await cortina(t, 'Tudo guardado!', 'Que comece o mandato.', true);
    } finally {
      tenta(() => Cenas3D.esconder());
      t.innerHTML = '';
    }
  }
  async function revelarUm(t, { pid, s }, av, i, total) {
    const raiz = t.querySelector('.rev'), topo = raiz.querySelector('.rev-topo'), base = raiz.querySelector('.rev-base');
    const equipe = nomeEquipe(pid), nome = av.nome && av.nome !== equipe ? ` (${esc(av.nome)})` : '';
    raiz.dataset.fase = 'chamada';
    raiz.dataset.equipe = pid;
    raiz.style.setProperty('--brilho', '#FFFFFF');
    topo.innerHTML = `<span class="pilula escura rev-conta"><b class="num">${i + 1}</b>&nbsp;de&nbsp;<b class="num">${total}</b></span>
      <p class="rev-chamada letra-bolha relevo">${formaDe(pid, { classe: 'rev-forma' })}Só a ${equipe} olha!</p>
      <p class="rev-sub letra-bolha">Delegação ${prepDe(pid)} ${nomePais(pid)}${nome}, venha até o computador. Turma: olhos no professor!</p>`;
    base.innerHTML = `<button class="rev-segurar peca pinos" data-teste="revelacao-ok" aria-describedby="rev-dica">
        <svg class="rev-anel" viewBox="0 0 48 48" aria-hidden="true"><circle class="trilho" cx="24" cy="24" r="20"/><circle class="enche" cx="24" cy="24" r="20" pathLength="100"/></svg>
        ${icoBtn('olho')}<span>Segure para ver</span></button>
      <p class="rev-dica letra-bolha" id="rev-dica">Segure o botão — ou a barra de espaço — por 2 segundos.</p>`;
    tenta(() => Cenas3D.revelacao({ ...av, humano: true }, 'chamada'));
    if (i > 0) await cortina(t, null);   // a cortina sobe e mostra a próxima equipe
    entrar(raiz.querySelectorAll('.rev-topo > *, .rev-base > *'));
    anunciar(`Só a ${equipe} olha! Delegação ${prepDe(pid)} ${nomePais(pid)}: segure o botão para ver o segredo.`);
    await segurar(base.querySelector('.rev-segurar'), RAPIDO ? 0 : 2000);

    // revelado: mesmo som, mesmo tempo e mesmo layout para qualquer papel
    efeitoSom('virar');
    raiz.dataset.fase = 'revelado';
    raiz.style.setProperty('--brilho', COR_PAPEL[s.papel]);
    topo.innerHTML = `<p class="rev-pre letra-bolha">${s.pre}</p><p class="rev-palavra marca">${esc(s.palavra)}</p>`;
    base.innerHTML = `<div class="rev-dossie peca">${arte(s.objeto, { classe: 'rev-objeto' })}
        <div class="rev-dossie-textos"><b class="rev-dossie-titulo">${esc(s.titulo)}</b><p class="rev-dossie-texto">${comIcones(s.texto)}</p><p class="rev-dossie-nota">${esc(s.nota)}</p></div></div>
      <button class="btn btn-principal peca pinos rev-ok" data-teste="revelacao-ok">Entendi ${GLIFOS.ok}</button>`;
    caberNaLargura(topo.querySelector('.rev-palavra'));
    tenta(() => Cenas3D.revelacao({ ...av, humano: true }, s.papel));
    const palavra = topo.querySelector('.rev-palavra');
    if (RM) gsap.fromTo(raiz.querySelectorAll('.rev-topo > *, .rev-base > *'), { opacity: 0 }, { opacity: 1, duration: .2 });
    else gsap.timeline().fromTo(topo.querySelector('.rev-pre'), { y: -2 * uPx(), opacity: 0 }, { y: 0, opacity: 1, duration: .3, ease: 'power2.out' })
      .fromTo(palavra, { scale: 1.8, opacity: 0 }, { scale: 1, opacity: 1, duration: .42, ease: 'back.out(2)' }, .12)
      .fromTo(base.children, { y: 5 * uPx(), opacity: 0 }, { y: 0, opacity: 1, duration: .4, stagger: .1, ease: 'back.out(1.6)' }, .35);
    anunciar(`${s.pre} ${s.palavra}. ${s.titulo}: ${s.texto} ${s.nota}`);
    const ok = base.querySelector('.rev-ok');
    ok.focus({ preventScroll: true });
    await aguardar(new Promise(r => ok.addEventListener('click', r, { once: true })));
    efeitoSom('clique');
    await cortina(t, 'Guardado!', i + 1 < total ? 'Passe o computador para a próxima equipe.' : '', false);
  }
  function entrar(els) {
    if (RM) return gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: .18 });
    return gsap.fromTo(els, { y: 3 * uPx(), opacity: 0 }, { y: 0, opacity: 1, duration: .38, stagger: .07, ease: 'back.out(1.6)' });
  }
  // Cortina: desce (fecha e esconde o segredo) ou sobe (titulo = null)
  async function cortina(t, titulo, sub = '', ultima = false) {
    const c = t.querySelector('.rev-cortina');
    if (titulo === null) {
      if (c.hidden) return;
      await fim(RM ? gsap.to(c, { opacity: 0, duration: .2 }) : gsap.to(c, { yPercent: -100, duration: .45, ease: 'power2.inOut' }));
      c.hidden = true; gsap.set(c, { clearProps: 'all' });
      return;
    }
    c.querySelector('.rev-cortina-titulo').textContent = titulo;
    c.querySelector('.rev-cortina-sub').textContent = sub;
    c.hidden = false;
    efeitoSom('virar');
    anunciar([titulo, sub].filter(Boolean).join(' '));
    await fim(RM ? gsap.fromTo(c, { opacity: 0 }, { opacity: 1, duration: .2 }) : gsap.fromTo(c, { yPercent: -100 }, { yPercent: 0, duration: .5, ease: 'power2.inOut' }));
    if (!RM) gsap.fromTo(c.querySelector('.rev-cadeado'), { scale: .4, rotation: -20 }, { scale: 1, rotation: 0, duration: .5, ease: 'back.out(2.4)' });
    await espera(ultima ? 1100 : 1300);
  }
  // Botão "Segure para ver": segurar (mouse, toque, Espaço ou Enter) por ms enche o anel; soltar antes esvazia
  function segurar(btn, ms) {
    const anel = btn.querySelector('.enche');
    return aguardar(new Promise(fimOk => {
      let tw = null, feito = false;
      const pintar = v => anel.style.setProperty('stroke-dashoffset', 100 - v * 100);
      const comeca = () => {
        if (feito || tw) return;
        btn.classList.add('segurando');
        if (!ms) return acabar();
        efeitoSom('tique');
        const o = { v: 0 };
        tw = gsap.to(o, { v: 1, duration: ms / 1000, ease: 'none', onUpdate: () => pintar(o.v), onComplete: acabar });
      };
      const solta = () => {
        if (feito || !tw) return;
        const o = { v: tw.targets()[0].v };
        tw.kill(); tw = null; btn.classList.remove('segurando');
        gsap.to(o, { v: 0, duration: .25, ease: 'power2.out', onUpdate: () => pintar(o.v) });
      };
      const tecla = ev => {
        if (ev.key !== ' ' && ev.key !== 'Enter') return;
        ev.preventDefault();
        if (ev.type === 'keydown' && !ev.repeat) comeca();
        if (ev.type === 'keyup') solta();
      };
      function acabar() {
        feito = true;
        btn.removeEventListener('pointerdown', comeca);
        removeEventListener('pointerup', solta); removeEventListener('pointercancel', solta);
        document.removeEventListener('keydown', tecla, true); document.removeEventListener('keyup', tecla, true);
        pintar(1);
        fimOk();
      }
      btn.addEventListener('pointerdown', comeca);
      btn.addEventListener('click', ev => ev.preventDefault());
      addEventListener('pointerup', solta); addEventListener('pointercancel', solta);
      document.addEventListener('keydown', tecla, true); document.addEventListener('keyup', tecla, true);
      btn.focus({ preventScroll: true });
    }));
  }

  // ============================== PARA O PROFESSOR ==============================
  const COMPETENCIAS = ['Analisar o mundo com argumentos e fontes', 'Territórios, fronteiras e o poder dos Estados', 'Sociedade, natureza e consumo responsável',
    'Produção, capital e trabalho', 'Justiça, Direitos Humanos e combate ao preconceito', 'Debate público e cidadania'];
  const TECLAS = [[['Espaço', 'Enter'], 'Continuar e pular animação'], [['P'], 'Pausar a partida'], [['H'], 'Esconder o painel e ver só o mapa'],
    [['M'], 'Música liga e desliga'], [['F'], 'Tela cheia'], [['Esc'], 'Fechar o painel ou abrir o menu'], [['Page Down'], 'Passador de slides: avança']];
  function professor() {
    const p = document.createElement('section');
    p.className = 'painel peca pinos painel-g professor anil';
    p.setAttribute('aria-labelledby', 'prof-titulo');
    const habs = typeof BNCC !== 'undefined' ? BNCC.habilidades || [] : [];
    const passos = [
      ['0 a 5 min', 'Preparação', 'mapa-enrolado', `Divida a turma em equipes (de 1 a ${PIDS.length}), uma por potência; as outras ficam com o computador. Nomes, bonecos e a revelação das missões secretas.`],
      ['5 a 35 min', 'Partida Rápida', 'globo', '4 mandatos de 6 anos. A equipe da vez lê o dilema em voz alta e diz, numa frase, por que escolheu aquela saída.'],
      ['35 a 50 min', 'Conversa final', 'jornal', 'O relatório de 2050 traz gráficos, manchetes e as habilidades da BNCC vividas. Cada equipe explica uma decisão que mudou o mundo.'],
    ];
    const mediar = [
      ['🗣', 'Dê a palavra', 'Alterne quem fala: quem lê o dilema, quem cuida do mapa, quem fala na ONU.'],
      ['🔍', 'Peça evidências', '“O que no mapa mostra isso?” Os números que saltaram são a prova.'],
      ['⚖', 'Avalie o argumento', 'Não existe saída certa: vale usar o conceito, um dado e pensar em quem fica do outro lado.'],
      ['🤝', 'Conduza os segredos', 'Nas crises, cada equipe decide em segredo; na ONU, os votos também são secretos.'],
      ['🎭', 'Troque de lado', 'Peça a alguém que defenda a saída que a equipe rejeitou.'],
      ['💬', 'Cuide do tom', 'Como na diplomacia: critica-se a ideia, nunca a pessoa.'],
    ];
    p.innerHTML = `<header class="painel-cab">${arte('prancheta', { classe: 'painel-objeto' })}
        <h2 class="painel-titulo" id="prof-titulo">Para o professor<small class="painel-sub">Sem perguntas e sem gabarito: a turma aprende vivendo as decisões.</small></h2>
        <button class="btn btn-ic peca" data-acao="fechar" aria-label="Fechar">${GLIFOS.fechar}</button></header>
      <div class="abas prof-abas" role="tablist" aria-label="Assuntos">
        <button class="peca" role="tab" id="prof-a1" aria-controls="prof-p1" aria-selected="true">${ico('⏳', 40)}Aula de 50 min</button>
        <button class="peca" role="tab" id="prof-a2" aria-controls="prof-p2" aria-selected="false">${ico('🎓', 40)}Mediação</button>
        <button class="peca" role="tab" id="prof-a3" aria-controls="prof-p3" aria-selected="false">${ico('🎮', 40)}Teclas</button>
        <button class="peca" role="tab" id="prof-a4" aria-controls="prof-p4" aria-selected="false">${ico('📚', 40)}BNCC</button>
      </div>
      <div class="tela prof-tela">
        <div id="prof-p1" role="tabpanel" aria-labelledby="prof-a1" tabindex="0" class="prof-aula">
          <ol class="prof-passos">${passos.map(([quando, titulo, obj, txt], i) => `<li class="prof-passo">
            <span class="prof-num marca">${i + 1}</span>${arte(obj, { classe: 'prof-objeto' })}
            <span class="pilula amarela prof-quando">${ico('⏳', 32)}${quando}</span><b class="prof-passo-tit">${titulo}</b><p>${txt}</p></li>`).join('')}</ol>
          <ul class="prof-dicas">
            <li>${ico('💾', 40)}<span>O jogo salva sozinho a cada mandato: termine na aula seguinte com <b>Continuar</b>, no mesmo computador.</span></li>
            <li>${ico('⏰', 40)}<span>Aula dupla? Use a partida <b>Aula</b>, com 6 mandatos, ou a <b>Completa</b>, com 8.</span></li>
          </ul>
        </div>
        <div id="prof-p2" role="tabpanel" aria-labelledby="prof-a2" tabindex="0" hidden>
          <p class="prof-lead">Você conduz a partida: lê os dilemas (ou pede que a equipe da vez leia), organiza as escolhas secretas e conduz a ONU.</p>
          <ul class="prof-cartoes">${mediar.map(([e, tit, txt]) => `<li class="prof-cartao"><span class="soquete">${ico(e, 48)}</span><span><b>${tit}</b>${txt}</span></li>`).join('')}</ul>
          <p class="prof-nota">${ico('🎓', 32)}Com o ajuste <b>Professor mediador</b> ligado, o jogo espera você liberar cada vez.</p>
        </div>
        <div id="prof-p3" role="tabpanel" aria-labelledby="prof-a3" tabindex="0" hidden>
          <ul class="prof-teclas">${TECLAS.map(([ks, txt]) => `<li><span class="prof-ks">${ks.map(k => `<kbd class="tecla${k.length > 1 ? ' larga' : ''}">${k}</kbd>`).join('<span class="ou">ou</span>')}</span><span>${txt}</span></li>`).join('')}</ul>
          <p class="prof-nota">${ico('💡', 32)}Um passador de slides funciona como controle remoto: o Page Down avança.</p>
        </div>
        <div id="prof-p4" role="tabpanel" aria-labelledby="prof-a4" tabindex="0" hidden>
          <p class="prof-lead">A BNCC define os conteúdos. As 6 competências de Ciências Humanas e Sociais Aplicadas e onde o jogo mais trabalha:</p>
          <ol class="prof-bncc">${COMPETENCIAS.map((tit, i) => {
            const hs = habs.filter(h => h.competencia === i + 1);
            return `<li class="prof-comp"><span class="prof-num marca">${i + 1}</span><b>${tit}</b><span class="prof-habs">${hs.map(h =>
              `<span class="hab ${h.relacao}" title="${esc(h.relacao)}">${h.codigo.replace('EM13', '')}</span>`).join('')}</span></li>`;
          }).join('')}</ol>
          <p class="prof-legenda"><span class="hab central">central</span><span class="hab forte">forte</span><span class="hab complementar">complementar</span>
            <span>Códigos EM13CHS… · o relatório final conta as habilidades vividas nas decisões.</span></p>
        </div>
      </div>
      <footer class="painel-rodape"><span class="dica">Roteiro completo, ideias de debate e como editar o conteúdo estão no Manual.</span>
        <button class="btn btn-neutro peca" data-acao="manual">${arte('manual', { classe: 'ini-arte' })}<span>Guia no Manual</span></button>
        <button class="btn btn-principal peca pinos" data-acao="fechar">Fechar</button></footer>`;
    p.addEventListener('click', ev => {
      const b = ev.target.closest('[data-acao]');
      if (!b) return;
      efeitoSom('clique');
      if (b.dataset.acao === 'fechar') fecharPainel(p);
      if (b.dataset.acao === 'manual' && (typeof Manual !== 'undefined')) fecharPainel(p).then(() => Manual.abrir('professor'));
    });
    ativarAbas(p.querySelector('[role="tablist"]'));
    return abrirPainel(p, { esc: true });
  }

  // ============================== CRÉDITOS ==============================
  function creditos() {
    const lista = typeof CREDITOS !== 'undefined' ? CREDITOS : [];
    const grupos = [...new Set(lista.map(c => c.grupo || 'Outros'))];
    const ICONE_GRUPO = { Bibliotecas: '🧰', Mapa: '🗺', Fontes: '✏', 'Ícones': '⭐', 'Modelos 3D': '🧱', 'Música': '🎤', 'Efeitos sonoros': '🔊' };
    const p = document.createElement('section');
    p.className = 'painel peca pinos painel-g creditos anil';
    p.setAttribute('aria-labelledby', 'cred-titulo');
    p.innerHTML = `<header class="painel-cab">${arte('pilha-tijolos', { classe: 'painel-objeto' })}
        <h2 class="painel-titulo" id="cred-titulo">Créditos<small class="painel-sub">As peças abertas que montaram este jogo. Obrigado a quem compartilha!</small></h2>
        <button class="btn btn-ic peca" data-acao="fechar" aria-label="Fechar os créditos">${GLIFOS.fechar}</button></header>
      <div class="cred-corpo">
        <div class="abas verticais" role="tablist" aria-orientation="vertical" aria-label="Grupos">${grupos.map((g, i) =>
          `<button class="peca" role="tab" id="cred-a${i}" aria-controls="cred-p${i}" aria-selected="${i === 0}">${ico(ICONE_GRUPO[g] || '🧱', 40)}<span>${esc(g)}</span><b class="num cred-conta">${lista.filter(c => (c.grupo || 'Outros') === g).length}</b></button>`).join('')}</div>
        <div class="tela">${grupos.map((g, i) => `<ul id="cred-p${i}" role="tabpanel" aria-labelledby="cred-a${i}" tabindex="0" class="cred-lista"${i ? ' hidden' : ''}>${lista
          .filter(c => (c.grupo || 'Outros') === g).map(c => `<li class="cred-item"><b class="cred-nome">${esc(c.item)}</b><span class="cred-autor">${esc(c.autor)}</span>
            <span class="cred-uso">${esc(c.uso || '')}</span><span class="cred-pe"><span class="pilula amarela">${esc(c.licenca)}</span><span class="cred-url">${esc(String(c.url || '').replace(/^https?:\/\//, ''))}</span></span></li>`).join('')}</ul>`).join('')}</div>
      </div>
      <footer class="painel-rodape"><span class="dica">Textos completos das licenças: arquivo CREDITOS.md, junto do jogo.</span>
        <button class="btn btn-principal peca pinos" data-acao="fechar">Fechar</button></footer>`;
    p.addEventListener('click', ev => { if (ev.target.closest('[data-acao="fechar"]')) { efeitoSom('clique'); fecharPainel(p); } });
    ativarAbas(p.querySelector('[role="tablist"]'));
    return abrirPainel(p, { esc: true });
  }

  return { inicio, lobby, revelar, professor, creditos };
})();
