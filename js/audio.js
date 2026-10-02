'use strict';
/* Geografia Irada — som e música (dono: Som e créditos). Momentos, volumes e mixagem: guia de arte §10.
   Música: 4 trilhas CC0 em <audio loop> (funciona até no file://), troca de humor com crossfade de igual potência,
   "ducking" sob alarme e plantão; se um arquivo falhar, a trilha vira a música procedural de reserva.
   Efeitos: arquivos de som/ decodificados pelo Web Audio (http/https) ou <audio> de reserva no file://;
   reuniao, subir, descer, trovao e pincel são sintetizados. Nada toca antes do primeiro toque ou tecla.
   Créditos dos arquivos: CREDITOS.md e dados/creditos.js. */

const Som = (() => {
  const NO_DISCO = location.protocol === 'file:';   // no file:// não há fetch nem MediaElementSource (sairia mudo)
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const agora = () => performance.now() / 1000;
  const limitar = v => Math.max(0, Math.min(1, v));
  const ler = (k, padrao) => { try { const v = localStorage.getItem('gi:' + k); return v === null ? padrao : JSON.parse(v); } catch { return padrao; } };
  const gravar = (k, v) => { try { localStorage.setItem('gi:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };
  const tocaM4a = (() => { try { return !!new Audio().canPlayType('audio/mp4; codecs="mp4a.40.2"'); } catch { return false; } })();

  // ---------- Preferências (salvas) ----------
  let efeitosLigados = ler('efeitos', true), musicaLigada = ler('musica', true);
  let volEfeitos = ler('volEfeitos', 1), volMusica = ler('volMusica', 1), silenciosa = ler('silenciosa', false);
  const ganhoEfeitos = () => efeitosLigados ? volEfeitos * (silenciosa ? .45 : 1) : 0;
  const ganhoMusica = () => musicaLigada ? volMusica * (silenciosa ? .35 : 1) : 0;

  // ---------- Efeitos: nome → arquivos (sorteados sem repetir), volume da tabela §10 e variação de tom ----------
  const EFEITOS = {
    clique: { arq: ['clique.m4a'], vol: .5, varia: .04, reserva: 'tijolo' },
    tijolo: { arq: ['tijolo-1.m4a', 'tijolo-2.m4a', 'tijolo-3.m4a'], vol: .9, varia: .06 },
    'tijolo-cai': { arq: ['tijolo-cai.m4a'], vol: .85, reserva: 'tijolo' },
    construcao: { arq: ['construcao.m4a'], vol: .8, reserva: 'tijolo' },
    chuva: { arq: ['chuva-tijolos.m4a'], vol: .6, reserva: 'tijolo' },
    pop: { arq: ['pop.m4a'], vol: .55 },
    whoosh: { arq: ['whoosh.m4a'], vol: .45 },
    alarme: { arq: ['alarme.m4a'], vol: .65, abaixa: true },
    plantao: { arq: ['plantao.m4a'], vol: .7, abaixa: true },
    martelo: { arq: ['martelo.m4a'], vol: 1 },
    moeda: { arq: ['moeda.m4a'], vol: .85 },
    pino: { arq: ['pino.m4a'], vol: .85, reserva: 'moeda' },
    sucesso: { arq: ['sucesso.m4a'], vol: .7, reserva: 'subir' },
    erro: { arq: ['erro.m4a'], vol: .55, reserva: 'descer' },
    vez: { arq: ['vez.wav'], vol: .5 },
    virar: { arq: ['virar.wav'], vol: .6 },
    voto: { arq: ['voto.wav'], vol: .6 },
    tique: { arq: ['tique.wav'], vol: .45 },
    tempo: { arq: ['tempo.wav'], vol: .6 },
    vitoria: { arq: ['vinheta-vitoria.m4a'], vol: .8, reserva: 'subir' },
  };
  // Nomes do jogo anterior e do quiz: continuam funcionando, com os sons novos
  const ANTIGOS = { certo: 'sucesso', errado: 'erro', carta: 'whoosh', promocao: 'sucesso', cilada: 'erro', pergunta: 'pop', estrela: 'pop', qualificacao: 'subir' };

  const BUF = {}, POOL = {}, FALHOU = {};
  const ARQUIVOS = [...new Set(Object.values(EFEITOS).flatMap(e => e.arq))];
  const viaElemento = NO_DISCO || !Ctx || !Offline;
  if (viaElemento) ARQUIVOS.forEach(a => {
    if (a.endsWith('.m4a') && !tocaM4a) { FALHOU[a] = true; return; }
    const el = new Audio('som/' + a);
    el.preload = 'auto';
    el.addEventListener('error', () => (FALHOU[a] = true));
    POOL[a] = [el];
  });
  else { // decodifica fora do contexto real (que só nasce no primeiro toque); AudioBuffer serve em qualquer contexto
    const dec = new Offline(1, 1, 44100);
    ARQUIVOS.forEach(a => fetch('som/' + a).then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status))
      .then(b => dec.decodeAudioData(b)).then(buf => (BUF[a] = buf), () => (FALHOU[a] = true)));
  }

  // ---------- Mixagem: mestre com limitador; barramento de efeitos; filtro da música (abafa com painel aberto) ----------
  let ctx = null, destravado = false, mestre, barEfeitos, filtroMusica;
  function montarMixagem() {
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .002; lim.release.value = .1;
    mestre = ctx.createGain(); mestre.connect(lim).connect(ctx.destination);
    barEfeitos = ctx.createGain(); barEfeitos.gain.value = ganhoEfeitos(); barEfeitos.connect(mestre);
    filtroMusica = ctx.createBiquadFilter(); filtroMusica.type = 'lowpass'; filtroMusica.Q.value = .5;
    filtroMusica.frequency.value = freqFiltro(); filtroMusica.connect(mestre);
    if (!NO_DISCO && ctx.audioWorklet) emenda = ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([EMENDA], { type: 'text/javascript' })));
  }
  const freqFiltro = () => 1800 * (20000 / 1800) ** intensidade;   // 0 → 1,8 kHz (abafado) · 1 → 20 kHz (aberto)

  const ativos = [], ultimaVez = {}, anterior = {};
  const sortear = (e, nome) => {
    if (e.arq.length === 1) return e.arq[0];
    let a;
    do a = e.arq[Math.floor(Math.random() * e.arq.length)]; while (a === anterior[nome]);
    return (anterior[nome] = a);
  };

  // Toca um arquivo e devolve a duração (s). No máximo 6 efeitos ao mesmo tempo: o mais antigo é cortado.
  function tocarArquivo(arq, vol, taxa) {
    const buf = BUF[arq];
    if (buf && ctx) {
      if (ativos.length >= 6) ativos.shift().stop();
      const f = ctx.createBufferSource(), g = ctx.createGain(), t = ctx.currentTime, dur = buf.duration / taxa;
      f.buffer = buf; f.playbackRate.value = taxa;
      g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + Math.max(0, dur - .006)); g.gain.linearRampToValueAtTime(0, t + dur); // sem estalo no fim
      f.connect(g).connect(barEfeitos); f.start(t);
      ativos.push(f);
      f.onended = () => { const i = ativos.indexOf(f); if (i >= 0) ativos.splice(i, 1); };
      return dur;
    }
    const pool = POOL[arq];
    if (!pool) return 0;   // ainda carregando
    let a = pool.find(x => x.paused || x.ended);
    if (!a) a = pool.length < 4 ? pool[pool.push(pool[0].cloneNode()) - 1] : pool[0];
    a.preservesPitch = false; a.playbackRate = taxa; a.volume = limitar(vol * ganhoEfeitos());
    a.currentTime = 0; a.play().catch(() => {});
    return (a.duration || 1) / taxa;
  }

  /* efeito(nome, { i, ultimo, semitons, velocidade, vezes })
     i: n-ésima peça de uma construção (tom sobe: 0,95 + 0,03·i, teto 1,25) · ultimo: última peça (último arquivo, mais grave)
     semitons: +1 por segundo no cronômetro, +1 a cada 3 tijolos na torre · velocidade: whoosh pela distância (0,9–1,1)
     vezes: repete defasado (chuva de tijolinhos longa: 3) */
  function efeito(nome, o = {}) {
    nome = ANTIGOS[nome] || nome;
    if (!destravado || !ganhoEfeitos()) return;
    const ms = performance.now();
    if (ms - (ultimaVez[nome] || 0) < 35) return;   // o mesmo som em menos de 35 ms vira eco
    ultimaVez[nome] = ms;
    const e = EFEITOS[nome];
    if (!e) { if (ctx && SINT[nome]) SINT[nome](); return; }
    const arq = o.ultimo ? e.arq[e.arq.length - 1] : sortear(e, nome);
    let taxa = o.ultimo ? .9 : o.i != null ? Math.min(1.25, .95 + .03 * o.i) : 1 + (Math.random() * 2 - 1) * (e.varia || 0);
    taxa *= 2 ** ((o.semitons || 0) / 12) * (o.velocidade || 1);
    if (FALHOU[arq]) { const r = SINT[e.reserva || nome]; if (ctx && r) r(); return; }
    const dur = tocarArquivo(arq, e.vol, taxa);
    if (e.abaixa) abaixarAte = Math.max(abaixarAte, agora() + dur + .3);
    if (nome === 'alarme') alarmeAte = agora() + dur;
    for (let k = 1; k < (o.vezes || 1); k++) setTimeout(() => tocarArquivo(arq, e.vol, taxa * (k % 2 ? .97 : 1.03)), k * 450);
  }

  // ---------- Instrumentos sintetizados (efeitos próprios e reservas) ----------
  let ruido = null;
  function bufferRuido() {
    if (ruido) return ruido;
    ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = ruido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ruido;
  }
  const hz = midi => 440 * 2 ** ((midi - 69) / 12);

  function tom(saida, { t = ctx.currentTime, nota = 60, dur = .25, tipo = 'sine', vol = .3, ataque = .005, deslize = 0, filtro = 0 }) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(hz(nota), t);
    if (deslize) o.frequency.exponentialRampToValueAtTime(hz(nota + deslize), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + ataque);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let no = o;
    if (filtro) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filtro; o.connect(f); no = f; }
    no.connect(g).connect(saida);
    o.start(t); o.stop(t + dur + .05);
  }
  function chiado(saida, { t = ctx.currentTime, dur = .08, vol = .2, passaAlta = 6000, passaBaixa = 0 }) {
    const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    s.buffer = bufferRuido();
    f.type = passaBaixa ? 'lowpass' : 'highpass';
    f.frequency.value = passaBaixa || passaAlta;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f).connect(g).connect(saida);
    s.start(t, Math.random() * .5); s.stop(t + dur + .02);
  }
  // marimba: fundamental + parciais agudos que somem rápido + toque da baqueta
  function marimba(saida, t, nota, vol = .22, dur = .5) {
    tom(saida, { t, nota, dur, vol, tipo: 'sine' });
    tom(saida, { t, nota: nota + 24, dur: dur * .25, vol: vol * .3, tipo: 'sine' });
    tom(saida, { t, nota: nota + 40, dur: dur * .08, vol: vol * .12, tipo: 'sine' });
  }
  const bumbo = (s, t, vol = .9) => tom(s, { t, nota: 52, deslize: -24, dur: .28, vol, tipo: 'sine' });
  const caixa = (s, t, vol = .35) => { chiado(s, { t, dur: .14, vol, passaAlta: 1800 }); tom(s, { t, nota: 62, deslize: -8, dur: .1, vol: vol * .5, tipo: 'triangle' }); };
  const chimbal = (s, t, vol = .12) => chiado(s, { t, dur: .035, vol, passaAlta: 8000 });
  const palma = (s, t, vol = .25) => [0, .012, .024].forEach(d => chiado(s, { t: t + d, dur: .05, vol, passaAlta: 1500 }));

  const SINT = {
    tijolo: () => { const t = ctx.currentTime; chiado(barEfeitos, { t, dur: .03, vol: .5, passaAlta: 2500 }); tom(barEfeitos, { t, nota: 84, dur: .06, vol: .25, tipo: 'square', filtro: 3000 }); },
    pop: () => tom(barEfeitos, { nota: 72, deslize: 12, dur: .12, vol: .3, tipo: 'sine' }),
    moeda: () => { const t = ctx.currentTime; tom(barEfeitos, { t, nota: 83, dur: .08, vol: .2, tipo: 'square', filtro: 5000 }); tom(barEfeitos, { t: t + .07, nota: 88, dur: .3, vol: .2, tipo: 'square', filtro: 5000 }); },
    whoosh: () => { const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = bufferRuido(); f.type = 'bandpass'; f.Q.value = 2;
      f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(3500, t + .35);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.4, t + .15); g.gain.exponentialRampToValueAtTime(.001, t + .45);
      s.connect(f).connect(g).connect(barEfeitos); s.start(t); s.stop(t + .5); },
    plantao: () => { const t = ctx.currentTime; [0, .28, .56].forEach((d, i) => { tom(barEfeitos, { t: t + d, nota: 79, dur: .22, vol: .18, tipo: 'square', filtro: 2600 }); tom(barEfeitos, { t: t + d + .12, nota: i === 2 ? 86 : 74, dur: .16, vol: .16, tipo: 'square', filtro: 2600 }); }); },
    alarme: () => { const t = ctx.currentTime; for (let i = 0; i < 4; i++) tom(barEfeitos, { t: t + i * .3, nota: i % 2 ? 77 : 82, dur: .28, vol: .16, tipo: 'sawtooth', filtro: 1800 }); },
    martelo: () => { const t = ctx.currentTime; bumbo(barEfeitos, t, .8); chiado(barEfeitos, { t, dur: .09, vol: .5, passaBaixa: 900 }); },
    reuniao: () => { const t = ctx.currentTime; [67, 71, 74, 79].forEach((n, i) => tom(barEfeitos, { t: t + i * .07, nota: n, dur: .5, vol: .14, tipo: 'square', filtro: 2200 })); bumbo(barEfeitos, t + .3, 1); },
    subir: () => { const t = ctx.currentTime; [72, 76, 79, 84].forEach((n, i) => marimba(barEfeitos, t + i * .07, n, .25, .35)); },
    descer: () => { const t = ctx.currentTime; [76, 72, 67, 64].forEach((n, i) => marimba(barEfeitos, t + i * .09, n, .22, .4)); },
    trovao: () => { const t = ctx.currentTime; chiado(barEfeitos, { t, dur: 1.4, vol: .5, passaBaixa: 300 }); bumbo(barEfeitos, t, .6); },
    pincel: () => chiado(barEfeitos, { dur: .05, vol: .06, passaAlta: 3000 }),
  };

  // ---------- Música procedural (reserva se o arquivo de uma trilha falhar) ----------
  // Cada humor: andamento, acordes (um por compasso, notas MIDI) e melodia (16 passos por compasso, null = pausa).
  const _ = null;
  const RESERVA = {
    menu: { bpm: 112, acordes: [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48]], bateria: 'pop', timbre: 'marimba',
      melodia: [76, _, 79, _, 84, _, 79, _, 81, _, 79, _, 76, _, _, _, 74, _, 79, _, 83, _, 79, _, 74, _, _, _, 71, _, 74, _,
        72, _, 76, _, 81, _, 76, _, 79, _, 76, _, 72, _, _, _, 69, _, 72, _, 77, _, 81, _, 79, _, 77, _, 76, _, 74, _] },
    jogo: { bpm: 104, acordes: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]], bateria: 'leve', timbre: 'marimba',
      melodia: [72, _, _, 76, _, _, 79, _, _, _, 76, _, 74, _, 72, _, 69, _, _, 72, _, _, 76, _, 74, _, _, _, _, _, _, _,
        65, _, _, 69, _, _, 72, _, 74, _, 72, _, 69, _, 67, _, 67, _, _, 71, _, _, 74, _, 79, _, _, _, 77, _, 74, _] },
    tensao: { bpm: 122, acordes: [[45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50]], bateria: 'tensa', timbre: 'serra',
      melodia: [69, _, 72, _, 76, _, 72, _, 69, _, 72, _, 77, _, 76, _, 65, _, 69, _, 72, _, 69, _, 65, _, 69, _, 74, _, 72, _,
        67, _, 72, _, 76, _, 72, _, 67, _, 72, _, 79, _, 76, _, 67, _, 71, _, 74, _, 71, _, 67, _, 71, _, 74, _, 71, _] },
    assembleia: { bpm: 90, acordes: [[45, 52, 57], [44, 52, 56], [45, 52, 57], [41, 48, 53]], bateria: 'relogio', timbre: 'sino',
      melodia: [81, _, _, _, _, _, _, _, 76, _, _, _, _, _, _, _, 80, _, _, _, _, _, _, _, 76, _, _, _, _, _, _, _,
        81, _, _, _, _, _, _, _, 76, _, _, _, 77, _, _, _, 76, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _] },
  };

  function tocarPasso(s, h, p, t) {
    const compasso = Math.floor(p / 16) % h.acordes.length, k = p % 16, acorde = h.acordes[compasso];
    const nota = h.melodia[p % h.melodia.length];
    if (k === 0 || k === 8) tom(s, { t, nota: acorde[0] - 12, dur: .32, vol: .32, tipo: 'triangle' });   // baixo
    if (h.bateria !== 'relogio' && (k === 6 || k === 14)) tom(s, { t, nota: acorde[0], dur: .14, vol: .16, tipo: 'triangle' });
    if (h.timbre === 'sino') { if (k === 0) acorde.forEach(n => tom(s, { t, nota: n + 12, dur: 2.2, vol: .05, tipo: 'sine', ataque: .3 })); }
    else if (k === 4 || k === 12) acorde.forEach(n => marimba(s, t, n + 12, .07, .3));
    if (nota !== null) {
      if (h.timbre === 'serra') tom(s, { t, nota, dur: .22, vol: .07, tipo: 'sawtooth', filtro: 1600 });
      else if (h.timbre === 'sino') { tom(s, { t, nota, dur: 1.4, vol: .12, tipo: 'sine' }); tom(s, { t, nota: nota + 12, dur: .5, vol: .03, tipo: 'sine' }); }
      else marimba(s, t, nota, .2, .45);
    }
    const b = h.bateria;
    if (b === 'relogio') { if (k % 4 === 0) chiado(s, { t, dur: .03, vol: k === 0 ? .14 : .07, passaAlta: 5000 }); if (k === 0 && compasso % 2 === 0) bumbo(s, t, .45); return; }
    if (k === 0 || (k === 8 && b !== 'leve') || (b === 'tensa' && k === 10)) bumbo(s, t, b === 'tensa' ? .8 : .7);
    if (k === 4 || k === 12) (b === 'pop' ? palma : caixa)(s, t, b === 'leve' ? .16 : .26);
    if (k % 2 === 0) chimbal(s, t, k % 4 ? .05 : .09);
    if (b === 'tensa' && k % 4 === 2) tom(s, { t, nota: acorde[0] + 12, dur: .1, vol: .05, tipo: 'square', filtro: 900 });
  }
  function agendar(tr) {
    const h = RESERVA[tr.h], dur16 = 60 / h.bpm / 4;
    while (tr.proximo < ctx.currentTime + .15) {
      tocarPasso(tr.ganho, h, tr.passo, tr.proximo);
      tr.proximo += dur16 * (tr.passo % 2 ? .92 : 1.08);   // leve swing
      tr.passo++;
    }
  }

  // ---------- Trilhas em <audio loop> ----------
  const VOL_TRILHA = { menu: .45, jogo: .35, tensao: .42, assembleia: .30 };
  const TRILHAS = {};
  let humor = null, intensidade = 1, duck = 1, abaixarAte = 0, alarmeAte = 0, discurso = false, fundo = 1;
  let naVinheta = false, depoisDaVinheta = 'menu', ultimoTique = 0;

  function trilha(h) {
    if (TRILHAS[h]) return TRILHAS[h];
    const tr = TRILHAS[h] = { h, base: VOL_TRILHA[h], p: 0, alvo: 0, vel: 1, inicio: 0, tocando: false, el: null };
    if (!tocaM4a) { reserva(tr); return tr; }
    const el = tr.el = new Audio(`som/trilha-${h}.m4a`);
    el.loop = true; el.preload = 'auto';
    el.addEventListener('error', () => reserva(tr));
    if (ctx && !NO_DISCO) {
      try {
        const fonte = ctx.createMediaElementSource(el);
        fonte.connect(filtroMusica);
        tr.roteada = true;
        emenda?.then(() => { const no = new AudioWorkletNode(ctx, 'emenda', { outputChannelCount: [2] }); fonte.disconnect(); fonte.connect(no).connect(filtroMusica); tr.emenda = true; }, () => {});
      } catch { /* toca direto */ }
    }
    return tr;
  }
  /* Emenda do loop: na volta, o <audio loop> do navegador deixa 3 a 6 ms de silêncio digital. No http/https a trilha passa
     por este AudioWorklet, que atrasa 21 ms, vê o silêncio chegando e faz fade de 10 ms antes e depois: sem estalo.
     (No file:// não há Web Audio na trilha: fica a micro-pausa.) */
  const EMENDA = `registerProcessor('emenda', class extends AudioWorkletProcessor {
    constructor() { super(); this.D = 1024; this.F = 512; this.anel = [new Float32Array(1024), new Float32Array(1024)]; this.n = 0; this.zeros = 0; this.marcas = []; }
    process(entradas, saidas) {
      const e = entradas[0], s = saidas[0], D = this.D, F = this.F, M = this.marcas;
      for (let k = 0; k < s[0].length; k++, this.n++) {
        const l = e.length ? e[0][k] : 0, r = e.length > 1 ? e[1][k] : l, n = this.n, o = n - D, j = n % D;
        if (Math.abs(l) < 1e-6 && Math.abs(r) < 1e-6) { if (++this.zeros === 32) M.push([n - 31, 0]); }
        else { if (this.zeros >= 32) M.push([n, 1]); this.zeros = 0; }
        let g = 1;
        for (const [t, volta] of M) g = Math.min(g, volta ? (o >= t && o < t + F ? (o - t) / F : 1) : (o >= t - F && o < t ? (t - o) / F : 1));
        while (M.length && o >= M[0][0] + F) M.shift();
        s[0][k] = this.anel[0][j] * g; s[1][k] = this.anel[1][j] * g;
        this.anel[0][j] = l; this.anel[1][j] = r;
      }
      return true;
    }
  });`;
  let emenda = null;
  function reserva(tr) {   // o arquivo falhou: a trilha vira a música procedural (se houver Web Audio)
    if (tr.el) tr.el.pause();
    tr.el = null; tr.tocando = false;
    if (!ctx) return;
    tr.ganho = ctx.createGain(); tr.ganho.gain.value = 0; tr.ganho.connect(filtroMusica);
  }
  function comecar(tr) {
    tr.tocando = true;
    if (tr.el) tr.el.play().catch(() => {});
    else if (tr.ganho) { tr.passo = 0; tr.proximo = ctx.currentTime + .05; tr.relogio = setInterval(() => agendar(tr), 40); }
  }
  function pausar(tr, doInicio) {
    tr.tocando = false;
    if (tr.el) { tr.el.pause(); if (doInicio) tr.el.currentTime = 0; }
    else if (tr.ganho) { clearInterval(tr.relogio); tr.ganho.gain.setTargetAtTime(0, ctx.currentTime, .01); }
  }
  function aplicar(tr) {
    let v = tr.base * Math.sin(tr.p * Math.PI / 2) * duck * ganhoMusica() * (tr.h === 'menu' ? fundo : 1);
    if (tr.ganho) { tr.ganho.gain.setTargetAtTime(v, ctx.currentTime, .02); return; }
    if (!tr.roteada) v *= .6 + .4 * intensidade;   // sem o filtro (file://), abafa baixando o volume
    v = limitar(v);
    if (Math.abs(tr.el.volume - v) > .001 || (v === 0 && tr.el.volume)) tr.el.volume = v;
  }
  // Relógio da mixagem (100 Hz): fades, ducking, emenda do loop e play/pause de cada trilha
  function tique() {
    const t0 = agora(), dt = Math.min(.1, t0 - ultimoTique);
    ultimoTique = t0;
    const alvoDuck = discurso || t0 < abaixarAte ? .4 : 1;   // ducking: desce em 0,15 s, volta em 0,8 s
    duck = alvoDuck < duck ? Math.max(alvoDuck, duck - dt * 4) : Math.min(alvoDuck, duck + dt * .75);
    for (const tr of Object.values(TRILHAS)) {
      const pronto = !tr.el || tr.el.readyState >= 3 || tr.alvo < tr.p;   // conexão lenta: o fade só sobe quando o áudio chega
      if (t0 >= tr.inicio && tr.p !== tr.alvo && pronto) tr.p = tr.alvo > tr.p ? Math.min(tr.alvo, tr.p + dt * tr.vel) : Math.max(tr.alvo, tr.p - dt * tr.vel);
      const quer = (tr.p > 0 || (tr.alvo > 0 && t0 >= tr.inicio)) && ganhoMusica() > 0 && (tr.el || tr.ganho);
      if (quer && !tr.tocando) comecar(tr);
      else if (!quer && tr.tocando) pausar(tr, tr.alvo === 0);
      if (tr.tocando) aplicar(tr);
    }
  }
  // Tempos de troca (s): [saída da trilha atual, entrada da nova]
  function tempos(de, para) {
    if (para === 'assembleia') return [.3, 1];   // depois do alarme
    if (de === 'assembleia') return [1.5, 1.5];   // martelo e a trilha anterior volta
    if ((de === 'jogo' && para === 'tensao') || (de === 'tensao' && para === 'jogo')) return [1.5, 1.5];
    if (de === 'menu' && para === 'jogo') return [.6, .6];
    if (!de) return [.3, 1];
    return [para ? 1 : .6, 1];
  }
  function trocar(novo) {
    const de = humor;
    humor = novo;
    if (!destravado) return;   // começa no primeiro toque
    const [saida, entrada] = tempos(de, novo);
    for (const tr of Object.values(TRILHAS)) if (tr.h !== novo && tr.alvo) Object.assign(tr, { alvo: 0, vel: 1 / saida, inicio: 0 });
    if (!VOL_TRILHA[novo]) return;
    Object.assign(trilha(novo), { alvo: 1, vel: 1 / entrada, inicio: novo === 'assembleia' ? Math.max(agora(), alarmeAte) : agora() });
  }

  // musica(humor, { intensidade }): 'menu' | 'jogo' | 'tensao' | 'assembleia' | null. Mesmo humor: só ajusta a intensidade.
  function musica(novo, { intensidade: i } = {}) {
    if (i !== undefined) ajustarIntensidade(i);
    if (novo === undefined) return;
    if (naVinheta) { depoisDaVinheta = novo; return; }
    if (novo === humor) return;
    fundo = 1;
    trocar(novo);
  }
  function ajustarIntensidade(i) {
    intensidade = limitar(i);
    if (filtroMusica) filtroMusica.frequency.setTargetAtTime(freqFiltro(), ctx.currentTime, .12);
  }

  // ---------- Vinhetas: a trilha sai em 0,3 s; a vinheta toca sozinha; 1,5 s depois, o menu volta baixinho (pódio) ----------
  const VINHETAS = { vitoria: .8, derrota: .75 }, VINH = {};
  function vinheta(nome) {
    if (!destravado || !ganhoMusica()) return;
    if (nome === 'rodada') { if (ctx) floreio('rodada'); return; }
    if (!VINHETAS[nome]) return;
    for (const tr of Object.values(TRILHAS)) Object.assign(tr, { alvo: 0, vel: 1 / .3, inicio: 0 });
    humor = null; naVinheta = true; depoisDaVinheta = 'menu';
    let solta = false;
    const soltar = () => { if (solta) return; solta = true; setTimeout(() => { naVinheta = false; fundo = .3 / .45; trocar(depoisDaVinheta); }, 1500); };
    setTimeout(soltar, 9000);   // garantia: se a vinheta travar ou for pausada, a música nunca fica presa
    const el = VINH[nome];
    if (!el || FALHOU['vinheta-' + nome]) { if (ctx) floreio(nome); soltar(); return; }
    el.currentTime = 0; el.volume = limitar(VINHETAS[nome] * ganhoMusica());
    el.onended = el.onerror = soltar;
    el.play().catch(soltar);
  }
  function floreio(nome) {   // vinhetas sintetizadas: 'rodada' e reserva de vitória e derrota
    const s = ctx.createGain(), t = ctx.currentTime + .05;
    s.gain.value = ganhoMusica(); s.connect(mestre);
    if (nome === 'vitoria') [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => { marimba(s, t + i * .1, n, .3, .8); if (i % 2 === 0) chimbal(s, t + i * .1, .1); });
    if (nome === 'derrota') [67, 63, 60, 55].forEach((n, i) => tom(s, { t: t + i * .35, nota: n, dur: .6, vol: .15, tipo: 'triangle' }));
    if (nome === 'rodada') { [72, 79, 84].forEach((n, i) => marimba(s, t + i * .12, n, .25, .5)); palma(s, t + .36); }
  }

  // ---------- Primeiro toque: cria o contexto, começa a música pedida e pré-carrega as trilhas ----------
  function destravar() {
    if (destravado) return;
    destravado = true;
    removeEventListener('pointerdown', destravar, true);
    removeEventListener('keydown', destravar, true);
    if (Ctx) { try { ctx = new Ctx(); montarMixagem(); } catch { ctx = null; } }
    ultimoTique = agora();
    setInterval(tique, 10);
    Object.keys(VINHETAS).forEach(n => {
      if (!tocaM4a) { FALHOU['vinheta-' + n] = true; return; }
      const el = VINH[n] = new Audio(`som/vinheta-${n}.m4a`);
      el.preload = 'auto';
      el.addEventListener('error', () => (FALHOU['vinheta-' + n] = true));
    });
    const h = humor;
    humor = null;
    if (h) trocar(h);
    Object.keys(VOL_TRILHA).forEach(trilha);
  }
  addEventListener('pointerdown', destravar, true);
  addEventListener('keydown', destravar, true);

  // ---------- Preferências ----------
  const aplicarEfeitos = () => { if (barEfeitos) barEfeitos.gain.setTargetAtTime(ganhoEfeitos(), ctx.currentTime, .02); };
  function alternarEfeitos() { efeitosLigados = !efeitosLigados; gravar('efeitos', efeitosLigados); aplicarEfeitos(); return efeitosLigados; }
  function alternarMusica() {
    musicaLigada = !musicaLigada; gravar('musica', musicaLigada);
    if (!musicaLigada) Object.values(VINH).forEach(el => el.pause());
    return musicaLigada;
  }
  // volume('musica' | 'efeitos', v?) → valor atual (0 a 1)
  function volume(tipo, v) {
    if (v !== undefined) {
      v = limitar(+v || 0);
      if (tipo === 'musica') { volMusica = v; gravar('volMusica', v); } else { volEfeitos = v; gravar('volEfeitos', v); aplicarEfeitos(); }
    }
    return tipo === 'musica' ? volMusica : volEfeitos;
  }
  // Sala silenciosa: efeitos a 45% e música a 35%, para turmas ao lado ou prova na sala vizinha
  function salaSilenciosa(v) {
    if (v !== undefined) { silenciosa = !!v; gravar('silenciosa', silenciosa); aplicarEfeitos(); }
    return silenciosa;
  }

  return {
    efeito, musica, vinheta, alternarEfeitos, alternarMusica, volume, salaSilenciosa,
    abafar: ligado => ajustarIntensidade(ligado ? 0 : 1),   // painel aberto: a trilha fica abafada
    abaixarTrilha: ligado => { discurso = !!ligado; },       // discurso na ONU: trilha a ×0,4
    get efeitosLigados() { return efeitosLigados; }, get musicaLigada() { return musicaLigada; }, get humor() { return humor; },
    EFEITOS: [...Object.keys(EFEITOS), ...Object.keys(SINT).filter(n => !EFEITOS[n])], ANTIGOS, HUMORES: Object.keys(VOL_TRILHA),
    VINHETAS: [...Object.keys(VINHETAS), 'rodada'],
    // ganchos da vitrine e dos testes (ferramentas/vitrine-som.html)
    _tabela: { efeitos: EFEITOS, trilhas: VOL_TRILHA, vinhetas: VINHETAS }, _trilhas: TRILHAS, _mixagem: () => ({ ctx, mestre }),
    _estado: () => ({
      destravado, humor, duck: +duck.toFixed(3), intensidade, naVinheta, viaElemento, roteada: !!TRILHAS.jogo?.roteada, emenda: !!TRILHAS.jogo?.emenda,
      carregados: Object.keys(BUF).length + Object.keys(POOL).length, falhas: Object.keys(FALHOU),
      trilhas: Object.fromEntries(Object.values(TRILHAS).map(tr => [tr.h, { p: +tr.p.toFixed(3), alvo: tr.alvo, tocando: tr.tocando,
        reserva: !!tr.ganho, volume: tr.el ? +tr.el.volume.toFixed(3) : null, tempo: tr.el ? +tr.el.currentTime.toFixed(2) : null }])),
    }),
  };
})();
