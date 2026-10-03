'use strict';
/* Geografia Irada — Mundo 3D: o mapa-múndi de peças de montar sobre a mesa anil (guia de arte §2.4–2.9, §6, §9).
   Contrato: docs/ARQUITETURA.md ("Mapa3D"). Three.js (global THREE) + GSAP. Modelos opcionais em dados/modelos.js
   (Modelos3D, GLB em base64, CC0): sem eles, cada objeto é montado só com peças geradas aqui.
   Desempenho: terra, mar, espuma, pinos, torres, cenário, navios e partículas são InstancedMesh; cada construção vira
   uma malha só depois de montada. Modo "leves": sem pós-processamento, pixel ratio 1, sombra só de torres e objetos. */

const Mapa3D = (() => {
  // ============================== PALETA E MEDIDAS (cópia do guia §2; os valores do guia mandam) ==============================
  const M = MAPA, COLS = M.colunas, LINS = M.linhas, TERR = M.territorios, NC = COLS * LINS;
  const Q = new URLSearchParams(location.search);
  // PC fraco: WebGL por software (sem GPU), poucos núcleos ou pouca memória. Começa direto nos gráficos leves, sem esperar o medidor
  const SOFT = (() => { try {
    const c = document.createElement('canvas'), g = c.getContext('webgl2') || c.getContext('webgl'), x = g?.getExtension('WEBGL_debug_renderer_info');
    const r = x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : '';
    g?.getExtension('WEBGL_lose_context')?.loseContext();
    return !g || /swiftshader|llvmpipe|software|basic render/i.test(r);
  } catch { return true; } })();
  window.PC_FRACO = SOFT || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  document.documentElement.classList.toggle('pc-fraco', window.PC_FRACO);
  // Movimento reduzido: o do jogo (js/ui.js, que também lê o ajuste do professor) ou o do sistema
  const REDUZ = typeof RM !== 'undefined' ? RM : matchMedia('(prefers-reduced-motion: reduce)').matches;
  const VEL = Q.has('rapido') ? .25 : 1;           // ?rapido (teste automático): animações mais curtas
  const ALT_TERRA = .8, ALT_MAR = .4, CASA = .4, TIJOLO = 1.2, PLACA = .4, CHANFRO = .05;
  // equipes e formas: fonte única em js/ui.js (CORES_GUIA, FORMAS, PIDS)
  const EQUIPES = Object.fromEntries(PIDS.map(p => [p, { cor: CORES_GUIA[p].cor, sombra: CORES_GUIA[p].lado, clara: CORES_GUIA[p].clara, contorno: CORES_GUIA[p].contorno, forma: CORES_GUIA[p].forma }]));
  const CONTINENTES = { an: ['#F6DECB', '#ECCFB8'], as: ['#DCE6C4', '#CEDBB2'], eu: ['#E0E1EC', '#D2D4E3'], af: ['#F4E2BA', '#EAD3A2'],
    ai: ['#F3D9D6', '#E9C8C4'], oc: ['#E6DCF0', '#D9CCE8'], po: ['#F6FAFD', '#E7F1F8'] };
  const OCEANO = ['#7FD8EC', '#58C6E4', '#38B1DC', '#2397CF', '#197DBF'];
  const C = { espuma: '#F2FDFF', rejunte: '#0B1F4B', moldura: '#FFF4DC', tinta: '#1A1433', amarelo: '#FFD21F', creme: '#FFF4DC',
    mastro: '#F2F2EE', aguaRasa: '#A8E9F5', seca: '#D9B26A', racha: '#B48A4A', fogo: '#FF7A1A', fogo2: '#FFD21F', cinzas: '#4A4545',
    fumacaConflito: '#5B6170', fumacaEmissao: '#8A8F9E', tempestade: '#6B7391', raio: '#FFE45C', cinzaClaro: '#A0A5A9',
    cinzaEscuro: '#6C6E68', madeira: '#B0743C', ouro: '#FFC93C', pecaPreta: '#2B2747', conflito: '#FF4B2B', alerta: '#FF3B30',
    paz: '#BFF5C9', branco: '#FFFFFF', azulCeu: '#8FD3FF', laranja: '#FF8A1F', vermelho: '#F0303A', verdeOk: '#3CD46A', lilas: '#B9A6F2' };
  const eq = pid => EQUIPES[pid] || { cor: pid || C.amarelo, sombra: C.cinzaEscuro, clara: C.branco, contorno: C.tinta, forma: 'circulo' };

  // ============================== GRADE: território de cada pino ==============================
  const IDX = new Map(TERR.map((id, i) => [id, i]));
  const idx = id => (IDX.has(id) ? IDX.get(id) : -1);
  const letra = Object.fromEntries([...M.alfabeto].map((l, i) => [l, i]));
  const terrDaCelula = new Int16Array(NC);      // -2 fora do tabuleiro, -1 mar, ≥ 0 território
  for (let k = 0; k < NC; k++) { const ch = M.celulas[k]; terrDaCelula[k] = ch === '.' ? -2 : ch === '~' ? -1 : letra[ch]; }
  const ANT = idx('antartida'), GROEN = idx('groenlandia');
  // Antártida contínua (guia §6.1): toda célula ao sul da costa vira gelo
  for (let c = 0; c < COLS; c++) {
    let gelo = false;
    for (let r = Math.floor(LINS * .8); r < LINS; r++) {
      const k = r * COLS + c;
      if (terrDaCelula[k] === ANT) gelo = true; else if (gelo && terrDaCelula[k] === -1) terrDaCelula[k] = ANT;
    }
  }
  for (let k = (LINS - 2) * COLS; k < NC; k++) if (terrDaCelula[k] === -1) terrDaCelula[k] = ANT;   // plataforma de gelo contínua
  const pinosDe = TERR.map(() => []);
  for (let k = 0; k < NC; k++) if (terrDaCelula[k] >= 0) pinosDe[terrDaCelula[k]].push(k);
  const celulaParaXZ = (c, r) => [c - COLS / 2 + .5, r - LINS / 2 + .5];
  const xzDe = k => celulaParaXZ(k % COLS, (k / COLS) | 0);
  const celulaEm = (x, z) => { const c = Math.floor(x + COLS / 2), r = Math.floor(z + LINS / 2); return c < 0 || c >= COLS || r < 0 || r >= LINS ? -1 : r * COLS + c; };
  // Âncoras (onde ficam torres, bandeira, rótulo e blocos de alerta). Territórios pequenos ganham âncora no mar ao lado,
  // ligada a eles por uma fileira de peças redondas 1×1 (guia §6.5): a fileira de torres não invade o vizinho.
  const PEQUENOS = ['america_central', 'caribe', 'balcas', 'sul_asia', 'taiwan', 'japao', 'coreia_sul', 'coreia_norte', 'pacifico', 'melanesia', 'reino_unido', 'nova_zelandia', 'levante'];
  const ANC = { ...M.ancoras }, PONTES = {};   // ponte: território → células de mar entre a âncora nova e o território
  const ancoraXZ = id => (ANC[id] ? celulaParaXZ(...ANC[id]) : [0, 0]);
  const hash = k => { let h = Math.imul(k ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const VIZ4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const ehBorda = k => { const c = k % COLS, r = (k / COLS) | 0, t = terrDaCelula[k];
    for (const [dc, dr] of VIZ4) { const rr = r + dr, cc = c + dc; if (rr < 0 || rr >= LINS || cc < 0 || cc >= COLS || terrDaCelula[rr * COLS + cc] !== t) return true; } return false; };
  const ehCosta = k => { const c = k % COLS, r = (k / COLS) | 0;
    for (const [dc, dr] of VIZ4) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < LINS && cc >= 0 && cc < COLS && terrDaCelula[rr * COLS + cc] === -1) return true; } return false; };
  // Distância (em pinos) de cada célula de mar até a terra mais próxima: dá os tons do oceano e a espuma
  const distTerra = (() => {
    const d = new Int16Array(NC).fill(999), fila = [];
    for (let k = 0; k < NC; k++) if (terrDaCelula[k] >= 0) { d[k] = 0; fila.push(k); }
    for (let i = 0; i < fila.length; i++) {
      const k = fila[i], c = k % COLS, r = (k / COLS) | 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || rr >= LINS || cc < 0 || cc >= COLS) continue;
        const kk = rr * COLS + cc;
        if (terrDaCelula[kk] === -2 || d[kk] !== 999) continue;
        d[kk] = d[k] + 1; fila.push(kk);
      }
    }
    return d;
  })();

  for (const id of PEQUENOS) {
    const t = idx(id); if (t < 0 || !pinosDe[t].length) continue;
    const [ac, ar] = M.ancoras[id], proprias = pinosDe[t];
    const ocupadas = TERR.filter(o => o !== id).map(o => ANC[o]).filter(Boolean);
    let melhor = null;
    for (let r = ar - 12; r <= ar + 12; r++) for (let c = ac - 14; c <= ac + 14; c++) {
      if (r < 3 || r > LINS - 6 || c < 5 || c > COLS - 6) continue;
      let livre = true;
      for (let dr = -1; dr <= 2 && livre; dr++) for (let dc = -4; dc <= 4; dc++) if (terrDaCelula[(r + dr) * COLS + c + dc] !== -1) { livre = false; break; }
      if (!livre || ocupadas.some(([oc, or]) => Math.abs(oc - c) < 9 && Math.abs(or - r) < 5)) continue;
      const perto = Math.min(...proprias.map(k => Math.hypot(k % COLS - c, ((k / COLS) | 0) - r)));
      const custo = perto + Math.hypot(c - ac, r - ar) * .35;
      if (!melhor || custo < melhor[0]) melhor = [custo, c, r];
    }
    if (!melhor) continue;
    const [, c, r] = melhor;
    ANC[id] = [c, r];
    // ponte de peças redondas: da âncora até o pino mais próximo do território, só sobre o mar
    const alvo = proprias.reduce((a, k) => (Math.hypot(k % COLS - c, ((k / COLS) | 0) - r) < Math.hypot(a % COLS - c, ((a / COLS) | 0) - r) ? k : a));
    const tc = alvo % COLS, tr = (alvo / COLS) | 0, passos = Math.max(Math.abs(tc - c), Math.abs(tr - r)), ponte = [];
    for (let i = 2; i < passos; i++) { const k = Math.round(r + (tr - r) * i / passos) * COLS + Math.round(c + (tc - c) * i / passos); if (terrDaCelula[k] === -1 && !ponte.includes(k)) ponte.push(k); }
    PONTES[id] = ponte;
  }

  // Dados de conteúdo (opcionais: a vitrine e o jogo carregam conteudo/*.js antes)
  const TERRS = typeof TERRITORIOS !== 'undefined' ? TERRITORIOS : [];
  const POTS = typeof POTENCIAS !== 'undefined' ? POTENCIAS : [];
  const POLS = typeof POLITICAS !== 'undefined' ? POLITICAS : [];
  const ehPotencia = id => !!EQUIPES[id];
  const CONT = Object.fromEntries(TERRS.map(t => [t.id, t.continente]));
  Object.assign(CONT, { groenlandia: 'po', antartida: 'po' });
  function nomeDe(id) {
    const d = TERRS.find(t => t.id === id) || POTS.find(p => p.id === id);
    return d?.curto || d?.nome || (typeof Simulacao !== 'undefined' ? Simulacao.nome(id) : id);
  }
  // Nomes longos em 2 linhas de até 14 letras (guia §5.7), enquanto o conteúdo não tem o campo "curto"
  function quebrar(nome) {
    if (nome.includes('\n') || nome.length <= 14) return nome;
    const meio = nome.length / 2; let melhor = -1;
    for (let i = 0; i < nome.length; i++) if (nome[i] === ' ' && (melhor < 0 || Math.abs(i - meio) < Math.abs(melhor - meio))) melhor = i;
    return melhor < 0 ? nome : nome.slice(0, melhor) + '\n' + nome.slice(melhor + 1);
  }

  // ============================== UTILIDADES ==============================
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), v3 = new THREE.Vector3(), v3b = new THREE.Vector3(), s3 = new THREE.Vector3(1, 1, 1);
  const cor = new THREE.Color(), cor2 = new THREE.Color(), eY = new THREE.Euler();
  const lerp = (a, b, t) => a + (b - a) * t, limitar = (v, a, b) => Math.max(a, Math.min(b, v));
  const som = (nome, op) => { try { if (typeof Som !== 'undefined') Som.efeito(nome, op); } catch { /* som é enfeite */ } };
  const esperar = s => new Promise(ok => gsap.delayedCall(s * VEL, ok));   // pelo relógio do GSAP (pausa e acelera junto)
  // GSAP com Promise; com movimento reduzido a animação vira troca seca (dur 0)
  const anim = (alvo, props) => new Promise(ok => gsap.to(alvo, { ...props, duration: (props.duration ?? .3) * VEL, delay: (props.delay || 0) * VEL, onComplete: ok }));
  const corLinear = hex => new THREE.Color(hex);

  // ============================== BIBLIOTECA DE PEÇAS (guia §4.3; 1 módulo = 1 pino) ==============================
  const geos = new Map();
  const geoCache = (k, criar) => { if (!geos.has(k)) geos.set(k, criar()); return geos.get(k); };
  const semIndice = g => (g.index ? g.toNonIndexed() : g);
  // Deixa só posição, normal e (se houver) cor, em Float32: tudo pode ser juntado com mergeGeometries
  function limpar(g, comCor = false) {
    g = semIndice(g);
    const out = new THREE.BufferGeometry();
    for (const nome of ['position', 'normal', 'color']) {
      const a = g.getAttribute(nome);
      if (!a) continue;
      const arr = new Float32Array(a.count * 3);
      for (let i = 0; i < a.count; i++) { arr[i * 3] = a.getX(i); arr[i * 3 + 1] = a.getY(i); arr[i * 3 + 2] = a.getZ(i); }
      out.setAttribute(nome, new THREE.BufferAttribute(arr, 3));
    }
    if (!out.getAttribute('normal')) out.computeVertexNormals();
    if (comCor && !out.getAttribute('color')) pintarGeo(out, 1, 1, 1);
    return out;
  }
  function pintarGeo(g, r, gg, b) {
    const n = g.getAttribute('position').count, arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = r; arr[i * 3 + 1] = gg; arr[i * 3 + 2] = b; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    return g;
  }
  // Tira os triângulos virados para baixo (ninguém vê o fundo das peças): menos vértices no telão
  function semFundo(g) {
    g = semIndice(g);
    const p = g.getAttribute('position'), n = g.getAttribute('normal'), manter = [];
    for (let i = 0; i < p.count; i += 3) if (!(n.getY(i) < -.9 && n.getY(i + 1) < -.9 && n.getY(i + 2) < -.9)) manter.push(i);
    const out = new THREE.BufferGeometry();
    for (const nome of Object.keys(g.attributes)) {
      const a = g.getAttribute(nome), it = a.itemSize, arr = new Float32Array(manter.length * 3 * it);
      manter.forEach((i, j) => { for (let v = 0; v < 3; v++) for (let c = 0; c < it; c++) arr[(j * 3 + v) * it + c] = a.array[(i + v) * it + c]; });
      out.setAttribute(nome, new THREE.BufferAttribute(arr, it));
    }
    return out;
  }
  // Caixa com chanfro (RoundedBox de 1 segmento), base no chão
  const caixa = (w, h, d, ch = CHANFRO) => geoCache(`cx${w}|${h}|${d}|${ch}`, () => {
    const g = new THREE.RoundedBoxGeometry(w, h, d, 1, Math.min(ch, w / 2 - .001, h / 2 - .001, d / 2 - .001));
    g.translate(0, h / 2, 0);
    return limpar(semFundo(g));
  });
  // Pino com bisel no topo (perfil do guia), 12 lados
  const pino = (lados = 12) => geoCache('pino' + lados, () => limpar(new THREE.LatheGeometry(
    [[.3, 0], [.3, .17], [.29, .19], [.265, .2], [0, .2]].map(([x, y]) => new THREE.Vector2(x, y)), lados)));
  // Junta peças [geo, x, y, z, rotY?, escala?] numa geometria só
  function juntar(lista) {
    const gs = lista.map(([g, x = 0, y = 0, z = 0, ry = 0, s = 1]) => {
      const c = g.clone();
      if (s !== 1) c.scale(...(Array.isArray(s) ? s : [s, s, s]));
      if (ry) c.rotateY(ry);
      c.translate(x, y, z);
      return c;
    });
    return THREE.mergeGeometries(gs);
  }
  // Tijolo/placa n×m com pinos; ladrilho = sem pinos (guia §4.3)
  const tijolo = (n = 1, m = 1, h = TIJOLO, comPinos = true) => geoCache(`tj${n}|${m}|${h}|${comPinos}`, () => {
    const lista = [[caixa(n - .02, h, m - .02)]];
    if (comPinos) for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) lista.push([pino(), i - (n - 1) / 2, h, j - (m - 1) / 2]);
    return juntar(lista);
  });
  const placa = (n, m) => tijolo(n, m, PLACA);
  const ladrilho = (n, m, h = PLACA) => tijolo(n, m, h, false);
  // Peça redonda (cilindro com chanfro) com pino central opcional
  const redonda = (r = .487, h = PLACA, comPino = true, lados = 20) => geoCache(`rd${r}|${h}|${comPino}|${lados}`, () => {
    const ch = Math.min(.04, h / 3), g = limpar(new THREE.LatheGeometry(
      [[0, 0], [r, 0], [r, h - ch], [r - ch, h], [0, h]].map(([x, y]) => new THREE.Vector2(x, y)), lados));
    return comPino ? juntar([[g], [pino(), 0, h]]) : g;
  });
  // Versões de longe (nível de detalhe): pino de 8 lados com o mesmo bisel (um degrau a menos) e peça redonda de 10 lados sem fundo
  const pinoLonge = () => geoCache('pinoLonge', () => limpar(new THREE.LatheGeometry([[.3, 0], [.3, .17], [.265, .2], [0, .2]].map(([x, y]) => new THREE.Vector2(x, y)), 8)));
  const redondaLonge = (r, h) => geoCache(`rdl${r}|${h}`, () => {
    const ch = Math.min(.04, h / 3), g = limpar(new THREE.LatheGeometry([[r, 0], [r, h - ch], [r - ch, h], [0, h]].map(([x, y]) => new THREE.Vector2(x, y)), 10));
    return juntar([[g], [pinoLonge(), 0, h]]);
  });
  const lod = [];   // [malha, geometria de perto, geometria de longe]
  const trocarLOD = longe => lod.forEach(([m, perto, lg]) => (m.geometry = longe ? lg : perto));
  const cone = (r0 = .48, r1 = .12, h = 1.2, lados = 16) => geoCache(`co${r0}|${r1}|${h}|${lados}`, () => limpar(new THREE.LatheGeometry(
    [[0, 0], [r0, 0], [r1, h], [0, h]].map(([x, y]) => new THREE.Vector2(x, y)), lados)));
  const barra = (r = .25, h = 1, lados = 12) => geoCache(`ba${r}|${h}|${lados}`, () => { const g = new THREE.CylinderGeometry(r, r, h, lados); g.translate(0, h / 2, 0); return limpar(g); });
  const esfera = (r = .5, w = 12, hh = 8) => geoCache(`es${r}|${w}|${hh}`, () => limpar(new THREE.SphereGeometry(r, w, hh)));
  // Telha 45° (cunha) n×m: sobe de trás (+z) para a frente? Não: a rampa desce para +z (frente), como um telhado
  const telha = (n = 2, m = 2, h = 1) => geoCache(`te${n}|${m}|${h}`, () => {
    const s = new THREE.Shape([new THREE.Vector2(-m / 2, 0), new THREE.Vector2(m / 2, 0), new THREE.Vector2(m / 2, .12), new THREE.Vector2(-m / 2 + .5, h), new THREE.Vector2(-m / 2, h)]);
    const g = new THREE.ExtrudeGeometry(s, { depth: n - .02, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 1 });
    g.rotateY(Math.PI / 2); g.translate(-(n - .02) / 2, 0, 0);
    return limpar(g);
  });
  const toro = (r = 1, t = .12, arco = Math.PI * 2, seg = 32) => geoCache(`to${r}|${t}|${arco}|${seg}`, () => limpar(new THREE.TorusGeometry(r, t, 8, seg, arco)));
  const anelChao = (r0, r1, seg = 48) => geoCache(`an${r0}|${r1}|${seg}`, () => { const g = new THREE.RingGeometry(r0, r1, seg); g.rotateX(-Math.PI / 2); return g; });

  // ---------- Materiais (cache: os mesmos objetos para todos) ----------
  const mats = new Map();
  const plastico = (c, rug = .3) => { const k = c + '|' + rug; if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: rug, metalness: 0 })); return mats.get(k); };
  const matVertice = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .3, metalness: 0 });
  const brilhante = (c, emissivo = .35) => { const k = 'e' + c + emissivo; if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: .3, metalness: 0, emissive: c, emissiveIntensity: emissivo })); return mats.get(k); };
  const translucido = (c, op = .5) => new THREE.MeshStandardMaterial({ color: c, roughness: .12, metalness: 0, transparent: true, opacity: op, depthWrite: false, envMapIntensity: 1.6 });
  const matOuro = new THREE.MeshStandardMaterial({ color: C.ouro, metalness: .55, roughness: .28 });

  // ---------- Impressões (decalques desenhados em canvas: forma da equipe, "!", coração, ✓ etc.) ----------
  const texs = new Map();
  function textura(chave, px, desenhar) {
    if (texs.has(chave)) return texs.get(chave);
    const cv = document.createElement('canvas'); cv.width = cv.height = px;
    desenhar(cv.getContext('2d'), px);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    texs.set(chave, t);
    return t;
  }
  // Forma branca contornada de índigo (sobre fundo da equipe, ou transparente)
  const texForma = (forma, fundo = null, tracoBranco = '#FFFFFF') => textura(`f${forma}|${fundo}|${tracoBranco}`, 256, (g, px) => {
    if (fundo) { g.fillStyle = fundo; g.fillRect(0, 0, px, px); }
    g.save(); g.translate(px * .18, px * .18); g.scale(px * .0064, px * .0064);
    const p = new Path2D(FORMAS[forma]);
    g.lineJoin = 'round'; g.lineWidth = 11; g.strokeStyle = C.tinta; g.stroke(p); g.fillStyle = tracoBranco; g.fill(p);
    g.restore();
  });
  // Símbolo branco com contorno índigo sobre uma cor ("!", ✓, coração, H, ?)
  function texSimbolo(simbolo, fundo, frente = '#FFFFFF') {
    return textura(`s${simbolo}|${fundo}|${frente}`, 128, (g, px) => {
      if (fundo) { g.fillStyle = fundo; g.fillRect(0, 0, px, px); }
      g.lineJoin = 'round'; g.lineCap = 'round';
      if (simbolo === 'coracao') {
        const p = new Path2D('M64 104 C30 80 18 62 22 44 C26 26 50 22 64 40 C78 22 102 26 106 44 C110 62 98 80 64 104 Z');
        g.lineWidth = 10; g.strokeStyle = C.tinta; g.stroke(p); g.fillStyle = frente; g.fill(p); return;
      }
      if (simbolo === 'check') {
        g.lineWidth = 30; g.strokeStyle = C.tinta; g.beginPath(); g.moveTo(30, 66); g.lineTo(54, 90); g.lineTo(98, 40); g.stroke();
        g.lineWidth = 16; g.strokeStyle = frente; g.stroke(); return;
      }
      if (simbolo === 'janela') {   // vidro azul-claro com brilho e caixilhos (preenche tudo: nada de borda preta)
        const v = g.createLinearGradient(0, 0, 0, px); v.addColorStop(0, '#CDEFFF'); v.addColorStop(1, '#7FC4F0');
        g.fillStyle = v; g.fillRect(0, 0, px, px);
        g.fillStyle = '#5A7FB0'; for (const x of [0, 42, 84]) g.fillRect(x, 0, 6, px); g.fillRect(122, 0, 6, px); g.fillRect(0, 0, px, 6); g.fillRect(0, 122, px, 6);
        g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 7; g.beginPath(); g.moveTo(12, 60); g.lineTo(34, 24); g.moveTo(54, 60); g.lineTo(76, 24); g.stroke(); return;
      }
      g.font = `900 ${simbolo.length > 1 ? 70 : 96}px Nunito, Fredoka, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 16; g.strokeStyle = C.tinta; g.strokeText(simbolo, px / 2, px / 2 + 6); g.fillStyle = frente; g.fillText(simbolo, px / 2, px / 2 + 6);
    });
  }
  const matImpresso = (tex, rug = .3, extra = {}) => { const k = 'i' + tex.uuid + rug; if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ map: tex, roughness: rug, metalness: 0, ...extra })); return mats.get(k); };

  // ============================== MODELOS (dados/modelos.js, opcionais) ==============================
  // Cada modelo vira { partes: [{ geo (com cor de vértice), tinta, nome, pivo }], alt } com 1 unidade = 1 pino.
  const modelos = {};
  let modelosProntos = Promise.resolve();
  const temModelos = () => typeof Modelos3D !== 'undefined' && THREE.GLTFLoader;
  function carregarModelos() {
    if (!temModelos()) return Promise.resolve();
    const loader = new THREE.GLTFLoader();
    return Promise.all(Modelos3D.ids.map(id => new Promise(ok => {
      try {
        loader.parse(Modelos3D.buffer(id), '', gltf => {
          const partes = [], raizM = gltf.scene;
          raizM.updateMatrixWorld(true);
          const caixaM = new THREE.Box3().setFromObject(raizM);
          raizM.traverse(o => {
            if (!o.isMesh) return;
            const animado = ['helice', 'balancim', 'asa-esq', 'asa-dir'].includes(o.name) ? o.name
              : ['helice', 'balancim', 'asa-esq', 'asa-dir'].includes(o.parent?.name) ? o.parent.name : null;
            const lista = Array.isArray(o.material) ? o.material : [o.material];
            const grupos = o.geometry.groups.length ? o.geometry.groups : [{ start: 0, count: (o.geometry.index || o.geometry.getAttribute('position')).count, materialIndex: 0 }];
            for (const gr of grupos) {
              let g = o.geometry.clone();
              if (g.index) { const ind = g.index.array.slice(gr.start, gr.start + gr.count); g.setIndex(new THREE.BufferAttribute(ind, 1)); }
              g = limpar(g, true);
              let pivo = null;
              if (animado) {   // parte animada: geometria no espaço do nó; o nó vira o pivô (posição, giro, escala)
                const no = o.name === animado ? o : o.parent;
                g.applyMatrix4(m4.copy(no.matrixWorld).invert().multiply(o.matrixWorld));
                pivo = { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), escala: new THREE.Vector3() };
                no.matrixWorld.decompose(pivo.pos, pivo.quat, pivo.escala);
              } else g.applyMatrix4(o.matrixWorld);
              partes.push({ geo: g, tinta: lista[gr.materialIndex]?.name === 'tinta', nome: animado, pivo });
            }
          });
          modelos[id] = { partes, alt: caixaM.max.y, larg: Math.max(caixaM.max.x - caixaM.min.x, caixaM.max.z - caixaM.min.z) };
          ok();
        }, () => ok());
      } catch { ok(); }
    })));
  }
  // Topos das chaminés de um modelo (fumaça): vértices mais altos, agrupados por posição
  function chamines(id) {
    const md = modelos[id];
    if (!md) return [];
    return geoCache('chamines' + id, () => {
      const pts = []; let maxY = 0;
      md.partes.filter(p => !p.nome).forEach(p => { const a = p.geo.getAttribute('position'); for (let i = 0; i < a.count; i++) { maxY = Math.max(maxY, a.getY(i)); pts.push([a.getX(i), a.getY(i), a.getZ(i)]); } });
      const grupos = [];
      for (const [x, y, z] of pts) {
        if (y < maxY - .5) continue;
        const g = grupos.find(q => Math.hypot(q.x / q.n - x, q.z / q.n - z) < .45);
        if (g) { g.x += x; g.z += z; g.n++; g.y = Math.max(g.y, y); } else grupos.push({ x, y, z, n: 1 });
      }
      return grupos.map(g => [g.x / g.n, g.y + .1, g.z / g.n]).slice(0, 4);
    });
  }
  // Geometria única (com cor de vértice) de um modelo; a "tinta" recebe a cor pedida
  function geoModelo(id, tinta = C.cinzaClaro) {
    const md = modelos[id];
    if (!md) return null;
    return geoCache(`md${id}|${tinta}`, () => THREE.mergeGeometries(md.partes.filter(p => !p.nome).map(p => {
      if (!p.tinta) return p.geo;
      const c = corLinear(tinta); return pintarGeo(p.geo.clone(), c.r, c.g, c.b);
    })));
  }

  // ============================== CENA, LUZ, MESA E PÓS-PROCESSAMENTO ==============================
  let renderer, cena, camera, controles, raiz, composer = null, n8 = null, sol, elemento, sobreposicao;
  let qualidade = Q.has('leve') || window.PC_FRACO ? 'leves' : 'bonitos', qualidadeFixa = Q.has('leve'), pausado = false, modoAtual = 'jogo', iniciado = false;
  let resolverPronto;
  const pronto = new Promise(ok => (resolverPronto = ok));
  const animados = new Set();            // objetos com tique(dt, t)
  let aoClicarFn = null, aoPassarFn = null;
  const MESA = { normal: ['#3550C8', '#22339A', '#141F66'], crise: ['#4A3FB0', '#2E2380', '#1B1250'] };
  let fundoCv, fundoTex, crise = 0, criseAlvo = 0;

  function desenharMesa(t) {
    const g = fundoCv.getContext('2d'), W = fundoCv.width, H = fundoCv.height;
    const mix = (a, b) => '#' + corLinear(a).lerp(corLinear(b), t).getHexString();
    const d = g.createLinearGradient(0, 0, 0, H);
    d.addColorStop(0, mix(MESA.normal[0], MESA.crise[0])); d.addColorStop(.55, mix(MESA.normal[1], MESA.crise[1])); d.addColorStop(1, mix(MESA.normal[2], MESA.crise[2]));
    g.fillStyle = d; g.fillRect(0, 0, W, H);
    const r = g.createRadialGradient(W / 2, H * .52, 10, W / 2, H * .52, W * .6);
    r.addColorStop(0, 'rgba(255,255,255,.16)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, W, H);
    fundoTex.needsUpdate = true;
  }

  function iniciar(el) {
    if (iniciado) return api;
    iniciado = true;
    elemento = el;
    renderer = new THREE.WebGLRenderer({ antialias: !window.PC_FRACO, powerPreference: 'high-performance' });
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.shadowMap.enabled = !SOFT;   // sem GPU: sem sombras
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;   // o laço pede a sombra (needsUpdate) só quando ela pode ter mudado
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    el.appendChild(renderer.domElement);
    sobreposicao = document.getElementById('rotulos-mapa') || Object.assign(el.appendChild(document.createElement('div')), { className: 'rotulos-mapa' });
    sobreposicao.classList.add('rotulos-mapa');
    sobreposicao.setAttribute('aria-hidden', 'true');   // os rótulos repetem o que a lista de territórios já diz ao leitor de tela
    estilos();

    cena = new THREE.Scene();
    fundoCv = document.createElement('canvas'); fundoCv.width = fundoCv.height = 512;
    fundoTex = new THREE.CanvasTexture(fundoCv); fundoTex.colorSpace = THREE.SRGBColorSpace;
    desenharMesa(0);
    cena.background = fundoTex;
    const pm = new THREE.PMREMGenerator(renderer);
    cena.environment = pm.fromScene(new THREE.RoomEnvironment(), .04).texture;
    pm.dispose();
    cena.environmentIntensity = .35;
    camera = new THREE.PerspectiveCamera(34, 1, 1, 1500);
    raiz = new THREE.Group(); cena.add(raiz);

    cena.add(new THREE.HemisphereLight('#EAF4FF', '#5B4C8C', .8));   // sombra fria e arroxeada
    sol = new THREE.DirectionalLight('#FFF0D8', 2.3);
    sol.position.set(-60, 110, 80);                                 // sudoeste: sombra para nordeste
    sol.castShadow = true;
    sol.shadow.bias = -.0003; sol.shadow.normalBias = .03; sol.shadow.radius = 2.5;
    // Caixa da sombra justa no tabuleiro, medida no espaço da luz
    sol.target.position.set(0, 0, 0); cena.add(sol.target);
    sol.shadow.camera.position.copy(sol.position); sol.shadow.camera.lookAt(0, 0, 0); sol.shadow.camera.updateMatrixWorld();
    const inv = sol.shadow.camera.matrixWorldInverse, bb = new THREE.Box3();
    for (const x of [-COLS / 2 - 3, COLS / 2 + 3]) for (const y of [0, 16]) for (const z of [-LINS / 2 - 3, LINS / 2 + 3]) bb.expandByPoint(v3.set(x, y, z).applyMatrix4(inv));
    Object.assign(sol.shadow.camera, { left: bb.min.x, right: bb.max.x, top: bb.max.y, bottom: bb.min.y, near: Math.max(1, -bb.max.z - 5), far: -bb.min.z + 5 });
    sol.shadow.camera.updateProjectionMatrix();
    cena.add(sol);

    montarTabuleiro();
    montarTorres();
    montarSistemas();

    controles = new THREE.OrbitControls(camera, renderer.domElement);
    Object.assign(controles, { enableDamping: true, dampingFactor: .08, screenSpacePanning: false, minDistance: 18, maxDistance: 240,
      minPolarAngle: .12, maxPolarAngle: 1.12, minAzimuthAngle: -.7, maxAzimuthAngle: .7, zoomSpeed: 1.1 });
    controles.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
    controles.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
    ligarPonteiro(renderer.domElement);
    new ResizeObserver(redimensionar).observe(el);
    graficos(qualidade, { auto: !qualidadeFixa });
    redimensionar();
    visaoGeral(0);
    modelosProntos = carregarModelos().then(() => montarCenario());
    if (pendBonecos) bonecos(pendBonecos);
    if (modoAtual === 'inicio') modo('inicio');
    modelosProntos
      .finally(() => { renderer.setAnimationLoop(pausado ? null : quadro); requestAnimationFrame(() => requestAnimationFrame(() => resolverPronto(true))); });
    // Shaders do pós-processamento compilados num momento calmo (tela inicial), e não na 1ª vez que a câmera chega perto
    pronto.then(() => (window.requestIdleCallback || (f => setTimeout(f, 800)))(aquecerPos, { timeout: 3000 }));
    return api;
  }

  function redimensionar() {
    const w = elemento.clientWidth || innerWidth, h = elemento.clientHeight || innerHeight;
    telaW = w; telaH = h; rotulosSujos = true;
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
    camera.aspect = w / h;
    // Guia §5.19: a imagem sobe 6,5% da altura para o mapa caber entre o topo e a doca do HUD
    camera.setViewOffset(w, h, 0, .065 * h, w, h);
    camera.updateProjectionMatrix();
  }

  // Gráficos "bonitos" (N8AO de perto + SMAA, sombra 4096) ou "leves" (pixel ratio 1, MSAA nativo, sombra 2048 sem a terra)
  let fpsAuto = true;
  function graficos(modo, { auto = false } = {}) {
    if (!renderer) { qualidade = modo; qualidadeFixa = !auto; return; }
    qualidade = modo === 'leves' ? 'leves' : 'bonitos';
    if (!auto) qualidadeFixa = true;
    fpsAuto = !qualidadeFixa && qualidade === 'bonitos';
    const leve = qualidade === 'leves';
    renderer.setPixelRatio(leve ? (SOFT ? .6 : 1) : Math.min(devicePixelRatio, 2));
    sol.shadow.mapSize.set(leve ? 2048 : 4096, leve ? 1024 : 2048);
    sol.shadow.map?.dispose(); sol.shadow.map = null; renderer.shadowMap.needsUpdate = true;
    if (terra) terra.castShadow = !leve;
    if (moldura) moldura.castShadow = !leve;
    cenarioMalhas.forEach(m => (m.castShadow = !leve));
    if (leve) { composer?.dispose(); composer = null; n8 = null; } else if (!composer) {
      composer = new THREE.EffectComposer(renderer);
      n8 = new THREE.N8AOPass(cena, camera, 1, 1);
      Object.assign(n8.configuration, { aoRadius: 1.1, distanceFalloff: .6, intensity: 2.2, halfRes: true, gammaCorrection: false, color: new THREE.Color('#13224A') });
      n8.setQualityMode('Performance');
      composer.addPass(n8);
      composer.addPass(new THREE.OutputPass());
      composer.addPass(new THREE.SMAAPass(1, 1));   // depois do OutputPass (pos3d.md, item 7)
    }
    if (elemento) redimensionar();
    medidor.reset();
  }
  function aquecerPos() {
    if (!composer || !n8 || pausado) return;
    const i = n8.configuration.intensity;
    n8.configuration.intensity = 0; composer.render(0); n8.configuration.intensity = i;   // um quadro invisível compila tudo
  }
  // Troca automática para "leves" se a média dos quadros passar de 22 ms em 3 s (depois dos 3 s iniciais)
  const medidor = { soma: 0, n: 0, inicio: 0, reset() { this.soma = 0; this.n = 0; this.inicio = performance.now(); } };

  function pausar(sim = true) {
    pausado = !!sim;
    if (!renderer) return;
    renderer.setAnimationLoop(pausado ? null : quadro);
    sobreposicao.style.visibility = pausado ? 'hidden' : '';
    ultimoQuadro = 0; economico = false;
    medidor.reset();
  }

  // ============================== TABULEIRO: rejunte, moldura, mar, espuma, terra, gelo ==============================
  let terra, pinos, mar, espuma, moldura, geloMar, pontes;
  const instDaCelula = new Int32Array(NC).fill(-1), celulaDaInst = [];
  const alturaBase = new Float32Array(NC), alturaAnim = new Float32Array(NC);
  const corCelula = [];           // cor-base (hex) de cada pino de terra, recalculada por pintarTerritorio
  const uni = { pulso: { value: 0 }, faixa: { value: -400 }, cint: { value: new THREE.Vector4(0, 0, 0, 0) }, cint2: { value: new THREE.Vector4(0, 0, 0, 0) } };

  // Placa de topo: só o que aparece (topo, chanfro e laterais), 18 triângulos; cor de vértice = oclusão "assada"
  function geoPlacaTopo(h, ch = CHANFRO, suave = 0) {
    const a = .5 - ch, pos = [], cols = [];
    const tri = (p, cs) => { pos.push(...p[0], ...p[1], ...p[2]); cols.push(...cs[0], ...cs[1], ...cs[2]); };
    const quad = (A, B, Cc, D, ca, cb, cc, cd) => { tri([A, B, Cc], [ca, cb, cc]); tri([A, Cc, D], [ca, cc, cd]); };
    const g1 = [1, 1, 1], g2 = [.9, .9, .9], g3 = [.82, .82, .82], g4 = [.5, .5, .5];
    quad([-a, h, a], [a, h, a], [a, h, -a], [-a, h, -a], g1, g1, g1, g1);
    for (let i = 0; i < 4; i++) {
      const rot = ([x, y, z]) => { let X = x, Z = z; for (let j = 0; j < i; j++) [X, Z] = [Z, -X]; return [X, y, Z]; };
      quad(rot([-.5, h - ch, .5]), rot([.5, h - ch, .5]), rot([a, h, a]), rot([-a, h, a]), g2, g2, g1, g1);
      quad(rot([-.5, 0, .5]), rot([.5, 0, .5]), rot([.5, h - ch, .5]), rot([-.5, h - ch, .5]), g4, g4, g3, g3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.computeVertexNormals();
    // mar: chanfro com normal amaciada (puxada para cima): sem riscos claros de reflexo entre os ladrilhos
    if (suave) { const n = g.getAttribute('normal'); for (let i = 0; i < n.count; i++) if (n.getY(i) > .3 && n.getY(i) < .99) { v3.set(n.getX(i), n.getY(i) + suave, n.getZ(i)).normalize(); n.setXYZ(i, v3.x, v3.y, v3.z); } }
    return g;
  }
  // Brilho por instância (alvos válidos): emissivo amarelo que pulsa
  function comBrilho(mat) {
    mat.onBeforeCompile = sh => {
      sh.uniforms.uPulso = uni.pulso;
      sh.vertexShader = 'attribute float aBrilho;\nvarying float vBrilho;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvBrilho = aBrilho;');
      sh.fragmentShader = 'uniform float uPulso;\nvarying float vBrilho;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, .78, .1) * vBrilho * uPulso;');
    };
    mat.customProgramCacheKey = () => 'brilho';
    return mat;
  }
  // Mar: faixa diagonal de +4% de brilho que cruza o mar a cada 6–8 s e cintilações de 300 ms (guia §6.2)
  function comFaixa(mat) {
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, { uFaixa: uni.faixa, uCint: uni.cint, uCint2: uni.cint2 });
      sh.vertexShader = 'varying vec3 vMundo;\n' + sh.vertexShader.replace('#include <begin_vertex>',
        '#include <begin_vertex>\nvMundo = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uFaixa;\nuniform vec4 uCint;\nuniform vec4 uCint2;\nvarying vec3 vMundo;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        `#include <color_fragment>
        float dd = dot(vMundo.xz, vec2(.8, .6)) - uFaixa;
        float bb = .045 * exp(-dd * dd * .004);
        vec2 c1 = abs(vMundo.xz - uCint.xy), c2 = abs(vMundo.xz - uCint2.xy);
        bb += .3 * uCint.w * step(max(c1.x, c1.y), .5) + .3 * uCint2.w * step(max(c2.x, c2.y), .5);
        diffuseColor.rgb *= 1.0 + bb;`);
    };
    mat.customProgramCacheKey = () => 'faixa';
    return mat;
  }

  function montarTabuleiro() {
    // Rejunte escuro sob tudo (some as frestas)
    const PX = 4, cv = document.createElement('canvas'); cv.width = COLS * PX; cv.height = LINS * PX;
    const g = cv.getContext('2d'); g.fillStyle = '#fff';
    for (let k = 0; k < NC; k++) if (terrDaCelula[k] !== -2) g.fillRect((k % COLS) * PX - 1, ((k / COLS) | 0) * PX - 1, PX + 2, PX + 2);
    const base = new THREE.Mesh(new THREE.PlaneGeometry(COLS, LINS), new THREE.MeshBasicMaterial({ color: C.rejunte, alphaMap: new THREE.CanvasTexture(cv), alphaTest: .5 }));
    base.rotation.x = -Math.PI / 2; base.position.y = .02; raiz.add(base);
    montarMoldura();

    // Mar: ladrilhos lisos em 5 tons (distância à costa salpicada ±0,9) + espuma redonda com pino em 70% da costa
    const LIM = [1.5, 3.5, 6.5, 11.5, 18.5], celMar = [], celEspuma = [];
    for (let k = 0; k < NC; k++) {
      if (terrDaCelula[k] !== -1) continue;
      if (distTerra[k] === 1 && hash(k) < .7) { celEspuma.push(k); continue; }
      const dd = distTerra[k] + (hash(k * 7 + 3) - .5) * 1.8; let n = 0;
      while (n < 4 && dd > LIM[n + 1]) n++;
      celMar.push([k, n]);
    }
    const matMar = comFaixa(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .16, metalness: 0, envMapIntensity: 1.4 }));
    mar = new THREE.InstancedMesh(geoPlacaTopo(ALT_MAR, CHANFRO, 2.2), matMar, celMar.length + celEspuma.length);
    const tomMar = new Uint8Array(NC);
    celMar.forEach(([k, n], i) => { tomMar[k] = n; const [x, z] = xzDe(k); mar.setMatrixAt(i, m4.makeTranslation(x, 0, z)); mar.setColorAt(i, cor.set(OCEANO[n]).offsetHSL(0, 0, (hash(k) - .5) * .03)); });
    // embaixo da espuma também há mar (aparece entre as peças redondas)
    celEspuma.forEach((k, j) => { const [x, z] = xzDe(k), i = celMar.length + j; mar.setMatrixAt(i, m4.makeTranslation(x, -.02, z)); mar.setColorAt(i, cor.set(OCEANO[0])); });
    mar.receiveShadow = true; raiz.add(mar);
    espuma = new THREE.InstancedMesh(redonda(.47, ALT_MAR + .04), plastico(C.espuma, .2), celEspuma.length);
    celEspuma.forEach((k, i) => { const [x, z] = xzDe(k); espuma.setMatrixAt(i, m4.makeTranslation(x, 0, z)); });
    espuma.receiveShadow = true; espuma.castShadow = false; raiz.add(espuma);
    lod.push([espuma, espuma.geometry, redondaLonge(.47, ALT_MAR + .04)]);

    // Gelo do Ártico: placas brancas sobre o mar do extremo norte (derretem com a temperatura)
    const celGelo = [];
    for (let k = 0; k < NC; k++) {
      const r = (k / COLS) | 0;
      if (terrDaCelula[k] === -1 && (r <= 1 || (r === 2 && hash(k * 5) < .75) || (r === 3 && hash(k * 5) < .3))) celGelo.push(k);
    }
    geloMar = { celulas: celGelo, malha: new THREE.InstancedMesh(geoPlacaTopo(ALT_MAR + .5), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .25 }), celGelo.length) };
    celGelo.forEach((k, i) => { const [x, z] = xzDe(k); geloMar.malha.setMatrixAt(i, m4.makeTranslation(x, 0, z)); geloMar.malha.setColorAt(i, cor.set(hash(k) < .5 ? CONTINENTES.po[0] : CONTINENTES.po[1])); });
    geloMar.malha.receiveShadow = true; raiz.add(geloMar.malha);

    // Terra: placa (2 placas de altura) + pino, cada um numa InstancedMesh; casa da potência sobe +0,4
    const matTerra = comBrilho(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .3, metalness: 0 }));
    pinosDe.forEach(l => celulaDaInst.push(...l));
    const n = celulaDaInst.length, brilho = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    const gPlaca = geoPlacaTopo(ALT_TERRA); gPlaca.setAttribute('aBrilho', brilho);
    const gPino = pintarGeo(pino().clone().translate(0, ALT_TERRA, 0), 1, 1, 1); gPino.setAttribute('aBrilho', brilho);
    terra = new THREE.InstancedMesh(gPlaca, matTerra, n);
    pinos = new THREE.InstancedMesh(gPino, matTerra, n);
    terra.castShadow = terra.receiveShadow = true; pinos.receiveShadow = true; pinos.castShadow = false;
    const gPinoLonge = pintarGeo(pinoLonge().clone().translate(0, ALT_TERRA, 0), 1, 1, 1); gPinoLonge.setAttribute('aBrilho', brilho);
    lod.push([pinos, gPino, gPinoLonge]);
    celulaDaInst.forEach((k, i) => (instDaCelula[k] = i));
    raiz.add(terra, pinos);
    // dois tons por continente: vizinhos do mesmo continente nunca repetem (coloração gulosa)
    const viz = TERR.map(() => new Set());
    TERR.forEach((id, t) => (M.vizinhos[id] || []).forEach(v => { const u = idx(v); if (u >= 0) { viz[t].add(u); viz[u].add(t); } }));
    TERR.forEach((id, t) => { const usados = new Set([...viz[t]].filter(u => CONT[TERR[u]] === CONT[id] && tomT[u] !== undefined).map(u => tomT[u])); tomT[t] = usados.has(0) ? 1 : 0; });
    TERR.forEach((id, t) => { estadoT[t] = { tipo: ehPotencia(id) ? 'casa' : 'neutro', pid: ehPotencia(id) ? id : null, seca: 0, cinzas: new Set(), rachas: [] }; });
    const nPontes = Object.values(PONTES).reduce((n, l) => n + l.length, 0);
    pontes = new THREE.InstancedMesh(redonda(.44, ALT_TERRA, true, 20), new THREE.MeshStandardMaterial({ roughness: .3 }), Math.max(1, nPontes));
    pontes.count = 0; pontes.castShadow = pontes.receiveShadow = true;
    for (const [id, l] of Object.entries(PONTES)) { PONTES[id] = { celulas: l, inicio: pontes.count }; l.forEach(k => { const [x, z] = xzDe(k); pontes.setMatrixAt(pontes.count++, m4.makeTranslation(x, 0, z)); }); }
    pontes.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, nPontes) * 3), 3);
    raiz.add(pontes);
    TERR.forEach((_, t) => pintarTerritorio(t));
    celulaDaInst.forEach(k => posicionarCelula(k));
    terra.instanceMatrix.needsUpdate = pinos.instanceMatrix.needsUpdate = true;
  }

  // Moldura creme contínua (silhueta de Robinson + 1,5 módulo), 1 tijolo de altura, chanfro 0,15 e fileira de pinos
  function montarMoldura() {
    const contorno = [];
    for (let lat = M.latSul; lat <= M.latNorte; lat += 2) contorno.push(lonLatParaXZ(180, lat));
    for (let lon = 180; lon >= -180; lon -= 20) contorno.push(lonLatParaXZ(lon, M.latNorte));
    for (let lat = M.latNorte; lat >= M.latSul; lat -= 2) contorno.push(lonLatParaXZ(-180, lat));
    for (let lon = -180; lon <= 180; lon += 20) contorno.push(lonLatParaXZ(lon, M.latSul));
    // tira pontos repetidos e desloca cada vértice pela normal (o contorno é convexo)
    const pts = contorno.filter((p, i) => i === 0 || Math.hypot(p[0] - contorno[i - 1][0], p[1] - contorno[i - 1][1]) > .01);
    const desloca = (d) => pts.map((p, i) => {
      const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length];
      let nx = b[1] - a[1], nz = -(b[0] - a[0]); const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
      if (nx * p[0] + nz * p[1] < 0) { nx = -nx; nz = -nz; }   // normal para fora
      const dd = typeof d === 'function' ? d(nx, nz) : d;
      return [p[0] + nx * dd, p[1] + nz * dd];
    });
    const fora = desloca(1.5), dentro = desloca((nx) => -(.25 + .55 * Math.abs(nx)));
    const forma = new THREE.Shape(fora.map(([x, z]) => new THREE.Vector2(x, -z)));
    forma.holes.push(new THREE.Path(dentro.map(([x, z]) => new THREE.Vector2(x, -z)).reverse()));
    const bev = .15, alt = TIJOLO;
    const g = new THREE.ExtrudeGeometry(forma, { depth: alt - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 1 });
    g.rotateX(-Math.PI / 2); g.translate(0, bev, 0);
    moldura = new THREE.Mesh(g, plastico(C.moldura, .3));
    moldura.castShadow = moldura.receiveShadow = true; raiz.add(moldura);
    // fileira de pinos no topo, a cada 1 módulo, pela linha do meio
    const meio = desloca((nx) => (1.5 - (.25 + .55 * Math.abs(nx))) / 2), lista = [];
    let acum = 0;
    for (let i = 0; i < meio.length; i++) {
      const [ax, az] = meio[i], [bx, bz] = meio[(i + 1) % meio.length], L = Math.hypot(bx - ax, bz - az);
      while (acum <= L) { lista.push([ax + (bx - ax) * acum / L, az + (bz - az) * acum / L]); acum += 1; }
      acum -= L;
    }
    const im = new THREE.InstancedMesh(pino(), plastico(C.moldura, .3), lista.length);
    lista.forEach(([x, z], i) => im.setMatrixAt(i, m4.makeTranslation(x, alt, z)));
    im.receiveShadow = true; raiz.add(im);
    lod.push([im, im.geometry, pinoLonge()]);
  }

  // ---------- Território: cores (neutro, casa, parceiro), seca, cinzas, gelo derretido ----------
  const tomT = [], estadoT = [];
  const derretido = new Uint8Array(NC);       // pinos de gelo que viraram mar
  const destaque = new Float32Array(TERR.length); // brilho de alvo válido por território
  function corDoPino(t, k) {
    const st = estadoT[t], c = k % COLS, r = (k / COLS) | 0, borda = ehBorda(k);
    if (derretido[k]) return [OCEANO[0], 0];
    if (st.cinzas.has(k)) return [C.cinzas, 0];
    if (st.tipo === 'livre') return [st.corLivre, borda ? -.04 : 0];
    if (st.tipo === 'casa') return [eq(st.pid).cor, borda ? -.07 : 0];
    if (st.tipo === 'parceiro') { const e = eq(st.pid); return borda ? [e.sombra, .06] : [((c >> 1) + (r >> 1)) % 2 ? e.clara : e.cor, 0]; }
    const pal = CONTINENTES[CONT[TERR[t]] || 'po'] || CONTINENTES.po;
    return [pal[tomT[t]] || pal[0], borda ? -.04 : 0];
  }
  function pintarTerritorio(t, { mistura = null } = {}) {
    const st = estadoT[t];
    for (const k of pinosDe[t]) {
      const [hex, dl] = corDoPino(t, k), i = instDaCelula[k];
      cor.set(hex);
      if (st.seca > 0 && !derretido[k] && st.tipo !== 'casa') cor.lerp(cor2.set(C.seca), .4 * st.seca * (hash(k * 3) < .7 ? 1 : .6));
      if (st.paz) cor.lerp(cor2.set(C.paz), .35);
      const c = k % COLS, r = (k / COLS) | 0;
      cor.offsetHSL(0, 0, (hash(k) - .5) * .03 + dl - ((st.conflito || 0) >= 2 && (c + r) % 3 === 0 ? .12 : 0));
      if (mistura) cor.lerp(mistura.cor, mistura.f(k));
      corCelula[i] = cor.getHex();
      terra.setColorAt(i, cor); pinos.setColorAt(i, cor);
    }
    terra.instanceColor.needsUpdate = pinos.instanceColor.needsUpdate = true;
    const pt = PONTES[TERR[t]];
    if (pt && pontes) { const [hex] = corDoPino(t, pinosDe[t][0]); pt.celulas.forEach((k, j) => pontes.setColorAt(pt.inicio + j, cor.set(st.tipo === 'parceiro' ? eq(st.pid).cor : hex).offsetHSL(0, 0, (hash(k) - .5) * .03))); pontes.instanceColor.needsUpdate = true; }
  }
  function posicionarCelula(k) {
    const i = instDaCelula[k];
    if (i < 0) return;
    const [x, z] = xzDe(k), y = alturaBase[k] + alturaAnim[k];
    m4.makeTranslation(x, y, z);
    terra.setMatrixAt(i, m4);
    if (derretido[k]) m4.makeScale(0, 0, 0);   // gelo virou mar: sem pino
    pinos.setMatrixAt(i, m4);
  }
  const marcarTerra = () => { terra.instanceMatrix.needsUpdate = pinos.instanceMatrix.needsUpdate = true; };
  function definirTipo(t, tipo, pid) {
    const st = estadoT[t];
    st.tipo = tipo; st.pid = pid;
    const alt = tipo === 'casa' ? CASA : 0;
    for (const k of pinosDe[t]) { alturaBase[k] = derretido[k] ? -.4 : alt; posicionarCelula(k); }
    marcarTerra();
  }

  // Onda de cor a partir da âncora (0,9 s, crista +0,6 e assenta); REDUZ: dissolve de 300 ms
  function ondaDeCor(t, aplicar, { duracao = .9 } = {}) {
    const antes = pinosDe[t].map(k => corCelula[instDaCelula[k]]);
    aplicar();
    pintarTerritorio(t);
    const depois = pinosDe[t].map(k => corCelula[instDaCelula[k]]);
    const [ac, ar] = M.ancoras[TERR[t]] || [0, 0];   // a onda começa na âncora original, dentro do território
    const dist = pinosDe[t].map(k => Math.hypot(k % COLS - ac, ((k / COLS) | 0) - ar)), maxD = Math.max(1, ...dist);
    const p = { v: 0 }, ca = new THREE.Color(), cb = new THREE.Color();
    const desenhar = () => {
      pinosDe[t].forEach((k, j) => {
        const local = REDUZ ? p.v : limitar((p.v * 1.4 - dist[j] / maxD) / .4, 0, 1), i = instDaCelula[k];
        ca.setHex(antes[j]).lerp(cb.setHex(depois[j]), local);
        terra.setColorAt(i, ca); pinos.setColorAt(i, ca);
        if (!REDUZ) { alturaAnim[k] = Math.sin(local * Math.PI) * .6; posicionarCelula(k); }
      });
      terra.instanceColor.needsUpdate = pinos.instanceColor.needsUpdate = true; marcarTerra();
    };
    desenhar();
    return anim(p, { v: 1, duration: REDUZ ? .3 : duracao, ease: 'none', onUpdate: desenhar }).then(() => { pinosDe[t].forEach(k => (alturaAnim[k] = 0, posicionarCelula(k))); marcarTerra(); });
  }

  // ---------- Elevação animada por território (passar o mouse +0,2; alvo válido +0,2; alvo sob o mouse +0,4) ----------
  const elevAlvo = new Float32Array(TERR.length), elevAtual = new Float32Array(TERR.length);
  let sobre = -1, alvos = null;
  function recalcularElevacao(t) { elevAlvo[t] = (alvos?.has(t) ? .2 : 0) + (t === sobre ? (alvos?.has(t) ? .2 : alvos ? 0 : .2) : 0); }
  let elevMudou = false;   // terra subindo/descendo neste quadro: a sombra precisa ser refeita
  function tiqueElevacao(dt) {
    let mudou = false;
    for (let t = 0; t < TERR.length; t++) {
      if (Math.abs(elevAtual[t] - elevAlvo[t]) < .002) continue;
      elevAtual[t] = REDUZ ? elevAlvo[t] : lerp(elevAtual[t], elevAlvo[t], 1 - Math.exp(-dt / .04));
      if (Math.abs(elevAtual[t] - elevAlvo[t]) < .002) elevAtual[t] = elevAlvo[t];
      for (const k of pinosDe[t]) { alturaAnim[k] = elevAtual[t]; posicionarCelula(k); }
      mudou = true;
    }
    if (mudou) { marcarTerra(); elevMudou = true; }
  }
  function destacarAlvos(ids) {
    if (!terra) return;
    const brilho = terra.geometry.getAttribute('aBrilho');
    alvos = ids && ids.length ? new Set(ids.map(idx).filter(t => t >= 0)) : null;
    brilho.array.fill(0);
    if (alvos) for (const t of alvos) for (const k of pinosDe[t]) brilho.array[instDaCelula[k]] = .32;
    brilho.needsUpdate = true;
    TERR.forEach((_, t) => recalcularElevacao(t));
    rotulosPor('alvo', ids || []);
  }

  // ============================== TORRES DE INFLUÊNCIA (guia §6.5) ==============================
  // Tijolos 2×2 na cor da potência, em fileira da mais alta para a mais baixa; tampa com a forma; fantasmas até a parceria.
  const CAP_TIJOLOS = 2400, CAP_FANT = 400;
  let imTijolos, imFantasmas, imTampas, imPedestais, imFormas = {};
  const torres = {};          // território → { lista: [{ pid, n }], precisa, lider, tijolos: [{ pid, i, y, sy, vis }] }
  let pertoDeMais = false;    // câmera perto (< 70): mostra todas as torres e os números
  function montarTorres() {
    const gT = juntar([[caixa(1.95, TIJOLO, 1.95)], ...[[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]].map(([x, z]) => [pino(), x, TIJOLO, z])]);
    imTijolos = new THREE.InstancedMesh(gT, plastico('#ffffff', .3), CAP_TIJOLOS);
    imTijolos.castShadow = imTijolos.receiveShadow = true; imTijolos.count = 0;
    imTijolos.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAP_TIJOLOS * 3), 3);
    imFantasmas = new THREE.InstancedMesh(gT, new THREE.MeshStandardMaterial({ color: '#FFFFFF', transparent: true, opacity: .28, roughness: .2, depthWrite: false }), CAP_FANT);
    imFantasmas.count = 0;
    imPedestais = new THREE.InstancedMesh(redonda(1.15, ALT_TERRA - ALT_MAR + .02, false, 28), plastico(C.creme, .3), 200); imPedestais.count = 0; imPedestais.receiveShadow = imPedestais.castShadow = true; raiz.add(imPedestais);
    imTampas = new THREE.InstancedMesh(caixa(1.95, PLACA, 1.95), plastico('#ffffff', .3), 600);
    imTampas.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(600 * 3), 3); imTampas.count = 0; imTampas.castShadow = true;
    const gDecal = new THREE.PlaneGeometry(1.7, 1.7); gDecal.rotateX(-Math.PI / 2);
    for (const pid of PIDS) {
      imFormas[pid] = new THREE.InstancedMesh(gDecal, new THREE.MeshStandardMaterial({ map: texForma(eq(pid).forma), transparent: true, alphaTest: .5, roughness: .3 }), 120);
      imFormas[pid].count = 0; raiz.add(imFormas[pid]);
    }
    raiz.add(imTijolos, imFantasmas, imTampas);
  }
  // Ponto de apoio da torre: âncora do território (as torres ficam em fileira sobre ela)
  const baseTorres = id => { const [x, z] = ancoraXZ(id), k = celulaEm(x, z); return [x, (k >= 0 && terrDaCelula[k] >= 0 ? ALT_TERRA + alturaBase[k] : ALT_TERRA), z]; };
  const noMar = (x, z) => { const k = celulaEm(x, z); return k >= 0 && terrDaCelula[k] === -1; };
  let torresSujas = true;
  function influencia(id, lista, { animar = true, precisa = 0, resistencia = 0 } = {}) {
    if (!imTijolos || idx(id) < 0) return Promise.resolve();
    const ant = torres[id] || { lista: [], tijolos: [] };
    const nova = lista.filter(i => i.n > 0).map(i => ({ pid: i.jogador ?? i.pid, n: Math.min(10, i.n) })).sort((a, b) => b.n - a.n || PIDS.indexOf(a.pid) - PIDS.indexOf(b.pid));
    const tj = [], promessas = [];
    let atraso = 0, nNovo = 0;
    for (const inf of nova) {
      const velhos = ant.tijolos.filter(b => b.pid === inf.pid);
      for (let i = 0; i < inf.n; i++) {
        const v = velhos[i];
        if (v) { tj.push(v); continue; }
        const b = { pid: inf.pid, i, y: 0, sy: 1, cai: !(animar && !REDUZ) ? 0 : 1 };
        tj.push(b);
        if (b.cai) {
          b.y = 6; b.oculto = true;
          const d = atraso; atraso += .09; nNovo++;
          promessas.push(new Promise(ok => {
            gsap.timeline({ delay: d * VEL, onComplete: ok, onUpdate: () => (torresSujas = true) })
              .call(() => (b.oculto = false))
              .to(b, { y: 0, duration: .32 * VEL, ease: 'power2.in' })
              .call(() => som('tijolo', { tom: Math.floor(nNovo / 3) }))
              .fromTo(b, { sy: .88 }, { sy: 1, duration: .14 * VEL, ease: 'back.out(3)' });
          }));
        }
      }
      // tijolos a mais saltam fora (física simples)
      if (animar && !REDUZ) velhos.slice(inf.n).forEach(b => saltarTijolo(id, inf.pid, b));
    }
    if (animar && !REDUZ) ant.tijolos.filter(b => !nova.some(i => i.pid === b.pid)).forEach(b => saltarTijolo(id, b.pid, b));
    torres[id] = { lista: nova, tijolos: tj, precisa, resistencia, pressao: ant.pressao || 0 };
    torresSujas = true;
    return Promise.all(promessas);
  }
  function posTorre(id, j, mostradas) { const [x, y, z] = baseTorres(id); return [x + (j - (mostradas - 1) / 2) * 2.3, y, z]; }
  function saltarTijolo(id, pid, b) {
    const t = torres[id]; if (!t) return;
    const j = t.lista.findIndex(i => i.pid === pid);
    const [x, y, z] = posTorre(id, Math.max(0, j), Math.max(1, t.lista.length));
    particulas.lancar({ x, y: y + b.i * TIJOLO + .6, z, cor: eq(pid).cor, escala: 1.95, n: 1 });
  }
  function desenharTorres() {
    let nT = 0, nF = 0, nC = 0, nP = 0;
    const nForma = Object.fromEntries(PIDS.map(p => [p, 0]));
    for (const [id, t] of Object.entries(torres)) {
      const mostradas = pertoDeMais ? t.lista.length : Math.min(2, t.lista.length);
      t.mostradas = mostradas;
      t.lista.slice(0, mostradas).forEach((inf, j) => {
        const [x, y0, z] = posTorre(id, j, mostradas), c = cor.set(eq(inf.pid).cor);
        if (noMar(x, z) && nP < 200) imPedestais.setMatrixAt(nP++, m4.makeTranslation(x, ALT_MAR - .02, z));
        let topo = y0;
        t.tijolos.filter(b => b.pid === inf.pid).forEach(b => {
          if (nT >= CAP_TIJOLOS) return;
          const y = y0 + b.i * TIJOLO + b.y;
          m4.compose(v3.set(x, y, z), q4.identity(), s3.set(1 / Math.sqrt(b.sy), b.oculto ? 0 : b.sy, 1 / Math.sqrt(b.sy)));
          imTijolos.setMatrixAt(nT, m4); imTijolos.setColorAt(nT, c); nT++;
          if (!b.oculto) topo = Math.max(topo, y0 + (b.i + 1) * TIJOLO + Math.max(0, b.y));
        });
        // fantasmas: o líder vê quanto falta para a parceria
        if (j === 0 && t.precisa > inf.n) for (let i = inf.n; i < t.precisa && nF < CAP_FANT; i++) { imFantasmas.setMatrixAt(nF++, m4.makeTranslation(x, y0 + i * TIJOLO, z)); }
        const yT = j === 0 && t.precisa > inf.n ? topo : topo;
        m4.makeTranslation(x, yT, z); imTampas.setMatrixAt(nC, m4); imTampas.setColorAt(nC, c); nC++;
        imFormas[inf.pid] && (m4.makeTranslation(x, yT + PLACA + .004, z), imFormas[inf.pid].setMatrixAt(nForma[inf.pid]++, m4));
      });
    }
    imTijolos.count = nT; imFantasmas.count = nF; imTampas.count = nC; imPedestais.count = nP; imPedestais.instanceMatrix.needsUpdate = true; imPedestais.computeBoundingSphere();
    for (const p of PIDS) { imFormas[p].count = nForma[p]; imFormas[p].instanceMatrix.needsUpdate = true; }
    imTijolos.instanceMatrix.needsUpdate = imFantasmas.instanceMatrix.needsUpdate = imTampas.instanceMatrix.needsUpdate = true;
    imTijolos.instanceColor.needsUpdate = imTampas.instanceColor.needsUpdate = true;
    imTijolos.computeBoundingSphere(); imTampas.computeBoundingSphere(); imFantasmas.computeBoundingSphere();
    PIDS.forEach(p => imFormas[p].computeBoundingSphere());
    torresSujas = false;
  }

  // ============================== BANDEIRAS DE PARCEIRO (guia §2.5) ==============================
  const bandeiras = {};   // território → grupo
  function criarBandeira(pid, escala = 1.5) {
    const e = eq(pid), g = new THREE.Group();
    const corpo = geoCache('bandeira-corpo' + pid, () => {
      const pecas = [[placa(2, 2), e.sombra, 0], [barra(.13, 4.4), C.mastro, .4], [esfera(.26, 14, 10), C.amarelo, 4.95]];
      return THREE.mergeGeometries(pecas.map(([geo, hex, y]) => { const c = corLinear(hex), gg = pintarGeo(geo.clone(), c.r, c.g, c.b); gg.translate(0, y, 0); return gg; }));
    });
    g.add(new THREE.Mesh(corpo, matVertice));
    const pano = new THREE.Group(); pano.position.set(0, 4.72, 0);
    const tecido = new THREE.Mesh(geoPano(), matPano(pid)); tecido.position.set(-1.32, -.8, 0); pano.add(tecido);
    g.add(pano);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    g.scale.setScalar(escala);
    g.userData.pano = pano;
    g.userData.fase = Math.random() * 6;
    g.tique = (dt, t) => { if (!REDUZ) pano.rotation.y = Math.sin(t * 1.6 + g.userData.fase) * .12; };
    return g;
  }
  // Pano da bandeira: uma caixa só; frente e verso mostram a forma (textura com fundo na cor), laterais na cor lisa
  const geoPano = () => geoCache('pano', () => {
    const g = new THREE.BoxGeometry(2.4, 1.6, .12), uv = g.getAttribute('uv'), n = g.getAttribute('normal');
    for (let i = 0; i < uv.count; i++) {
      if (Math.abs(n.getZ(i)) > .5) uv.setXY(i, .5 + (uv.getX(i) - .5) * 1.5, uv.getY(i));   // 2,4 × 1,6: a forma fica redonda
      else uv.setXY(i, .02, .02);
    }
    return g;
  });
  const matPano = pid => { const k = 'pano' + pid; if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ map: texForma(eq(pid).forma, eq(pid).cor), roughness: .32 })); return mats.get(k); };
  function posBandeira(id) {
    const t = torres[id], n = t ? (t.mostradas ?? Math.min(2, t.lista.length)) : 0, [x, y, z] = baseTorres(id);
    const bx = x - (n ? n * 2.3 / 2 + 1.4 : 0), bz = z - .6;
    return [bx, noMar(bx, bz) ? ALT_MAR : y, bz];
  }
  function bandeira(id, pid, { animar = true } = {}) {
    const atual = bandeiras[id];
    if (atual && atual.userData.pid === pid) return Promise.resolve();
    const prom = [];
    if (atual) {
      delete bandeiras[id]; animados.delete(atual);
      prom.push((animar && !REDUZ ? anim(atual.scale, { y: 0, duration: .3, ease: 'power2.in' }) : Promise.resolve()).then(() => raiz.remove(atual)));
      if (animar) som('descer');
    }
    if (pid) {
      const b = criarBandeira(pid); b.userData.pid = pid;
      b.position.set(...posBandeira(id));
      raiz.add(b); animados.add(b); bandeiras[id] = b;
      if (animar && !REDUZ) { b.scale.y = 0; prom.push(anim(b.scale, { y: 1.5, duration: .4, ease: 'back.out(1.7)', delay: atual ? .3 : 0 })); }
    }
    return Promise.all(prom);
  }

  // ============================== PARTÍCULAS: tijolinhos (chuva, desmonte, poeira) e fumaça ==============================
  let particulas, fumaca;
  // Cor já convertida (a fumaça e os tijolinhos pintam centenas por quadro; ler o texto da cor a cada vez custava caro)
  const coresProntas = new Map();
  const corRapida = c => { let k = coresProntas.get(c); if (!k) coresProntas.set(c, (k = new THREE.Color(c))); return k; };
  function montarSistemas() {
    // Tijolinhos 1×1 com pino, física simples (gravidade 25), encolhem no fim (guia §9.1 "Desmontar")
    const CAP = 360, im = new THREE.InstancedMesh(tijolo(1, 1, .9), plastico('#ffffff', .3), CAP);
    im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAP * 3), 3); im.count = 0; im.castShadow = true; im.frustumCulled = false;
    raiz.add(im);
    const vivas = [];
    particulas = {
      ativas: () => vivas.length,
      lancar({ x, y, z, cor: c, n = 1, escala = 1, espalha = 1, sobe = [4, 6], vida = .8, lado = [1.5, 3] }) {
        for (let i = 0; i < n && vivas.length < CAP; i++) {
          const a = Math.random() * Math.PI * 2, vl = lerp(lado[0], lado[1], Math.random()) * espalha;
          vivas.push({ x, y, z, vx: Math.cos(a) * vl, vy: lerp(sobe[0], sobe[1], Math.random()), vz: Math.sin(a) * vl, rx: 0, ry: Math.random() * 6, rz: 0,
            wx: (Math.random() - .5) * 8, wz: (Math.random() - .5) * 8, t: 0, vida, s: escala * (.7 + Math.random() * .5), cor: Array.isArray(c) ? c[i % c.length] : c, chao: y - 6 });
        }
      },
      // chuva: caem de cima sobre um ponto (parceria nova: 12 na cor da potência)
      chuva({ x, z, y = 1, cor: c, n = 12, raio = 2.5 }) {
        for (let i = 0; i < n && vivas.length < CAP; i++) {
          const a = Math.random() * Math.PI * 2, r = Math.random() * raio;
          vivas.push({ x: x + Math.cos(a) * r, y: y + 9 + Math.random() * 5, z: z + Math.sin(a) * r, vx: 0, vy: -2, vz: 0, rx: 0, ry: Math.random() * 6, rz: 0,
            wx: (Math.random() - .5) * 5, wz: (Math.random() - .5) * 5, t: 0, vida: 1.4, s: .55 + Math.random() * .4, cor: Array.isArray(c) ? c[i % c.length] : c, chao: y, quica: true });
        }
      },
      tique(dt) {
        let n = 0;
        for (let i = vivas.length - 1; i >= 0; i--) {
          const p = vivas[i]; p.t += dt;
          if (p.t > p.vida) { vivas.splice(i, 1); continue; }
          p.vy -= 25 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rx += p.wx * dt; p.rz += p.wz * dt;
          if (p.quica && p.y < p.chao) { p.y = p.chao; p.vy = Math.abs(p.vy) * .3; p.wx *= .5; p.wz *= .5; p.vx = p.vz = 0; }
        }
        for (const p of vivas) {
          const fim = p.vida - p.t, s = p.s * (fim < .25 ? Math.max(0, fim / .25) : 1);
          m4.compose(v3.set(p.x, p.y, p.z), q4.setFromEuler(eY.set(p.rx, p.ry, p.rz)), s3.set(s, s, s));
          im.setMatrixAt(n, m4); im.setColorAt(n, corRapida(p.cor)); n++;
        }
        im.count = n;
        if (n) { im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; }
      },
    };
    animados.add(particulas);
    // Fumaça: bolinhas que sobem, crescem e encolhem (sem transparência: estilo brinquedo)
    const CAPF = 260, imf = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.5, 1), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .9, flatShading: false }), CAPF);
    imf.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(CAPF * 3), 3); imf.count = 0; imf.frustumCulled = false;
    raiz.add(imf);
    const bolas = [];
    fumaca = {
      soltar({ x, y, z, cor: c = C.fumacaEmissao, n = 1, tam = 1, sobe = 2.2, vida = 2.2, espalha = .4 }) {
        for (let i = 0; i < n && bolas.length < CAPF; i++)
          bolas.push({ x: x + (Math.random() - .5) * espalha, y, z: z + (Math.random() - .5) * espalha, vy: sobe * (.8 + Math.random() * .4), vx: .25 + Math.random() * .3, t: -i * .25, vida, tam: tam * (.8 + Math.random() * .4), cor: c });
      },
      tique(dt) {
        let n = 0;
        for (let i = bolas.length - 1; i >= 0; i--) { const b = bolas[i]; b.t += dt; if (b.t > b.vida) bolas.splice(i, 1); }
        for (const b of bolas) {
          if (b.t < 0) continue;
          const u = b.t / b.vida, s = b.tam * (u < .3 ? .4 + u / .3 * .6 : 1 - (u - .3) / .7 * .9);
          m4.compose(v3.set(b.x + b.vx * b.t, b.y + b.vy * b.t, b.z - b.vx * b.t * .4), q4.identity(), s3.set(s, s, s));
          imf.setMatrixAt(n, m4); imf.setColorAt(n, corRapida(b.cor)); n++;
        }
        imf.count = n;
        if (n) { imf.instanceMatrix.needsUpdate = true; imf.instanceColor.needsUpdate = true; }
      },
    };
    animados.add(fumaca);
    montarClima();
    montarComercio();
  }
  // Poeira de montagem: 8 plaquinhas creme que saem da base
  function poeira(x, y, z, raio = 2) {
    if (REDUZ) return;
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      particulas.lancar({ x: x + Math.cos(a) * raio, y: y + .1, z: z + Math.sin(a) * raio, cor: i % 2 ? C.creme : '#E8DCC0', escala: .35, sobe: [2, 3.5], lado: [1, 2], vida: .5 });
    }
  }

  // ============================== CENÁRIO (árvores, cactos, urso-polar, pinguins) ==============================
  const cenarioMalhas = [], cenario = {};  // tipo → { malha, itens: [{ k, x, y, z, ry, s, vivo, grupo }] }
  const REGRAS_CENARIO = [
    { m: 'arvore-folhosa', em: ['brasil', 'venezuela_guianas', 'africa_central', 'sudeste_insular', 'sudeste_continental', 'melanesia'], dens: .2, filtro: (id, r) => id !== 'brasil' || r < 56, grupo: 'floresta' },
    { m: 'arvore-folhosa', em: ['andes', 'africa_ocidental', 'america_central', 'nigeria', 'reino_unido', 'japao', 'coreia_sul', 'nova_zelandia'], dens: .1, filtro: (id, r, c) => id !== 'andes' || c > 60 },
    { m: 'pinheiro', em: ['canada', 'russia', 'leste_europeu', 'ue', 'noruega_suica'], dens: .06, filtro: (id, r) => (id === 'ue' ? r < 8 : r > 6 && r < 16) },
    { m: 'pinheiro-neve', em: ['canada', 'russia'], dens: .05, filtro: (id, r) => r <= 6 },
    { m: 'palmeira', em: ['caribe', 'pacifico', 'melanesia', 'america_central', 'sul_asia'], dens: .35, costa: true },
    { m: 'palmeira-curva', em: ['sudeste_insular', 'brasil', 'india'], dens: .1, costa: true },
    { m: 'arvore-savana', em: ['sahel', 'africa_oriental', 'africa_austral', 'africa_do_sul'], dens: .07 },
    { m: 'cacto', em: ['norte_africa', 'egito', 'golfo', 'mexico', 'australia'], dens: .04, filtro: (id, r) => id !== 'australia' || r < 66 },
    { m: 'urso-polar', em: ['groenlandia'], n: 1 },
    { m: 'pinguim', em: ['antartida'], n: 3 },
  ];
  function longeDosMarcos(k, id) {
    const [x, z] = xzDe(k), [ax, az] = ancoraXZ(id);
    if (Math.abs(x - ax) < 7.5 && Math.abs(z - az) < 3.2) return false;                 // fileira de torres
    if (ehPotencia(id) && Math.hypot(x - ax - 3, z - az + 3.5) < 4.5) return false;      // boneco
    return true;
  }
  function montarCenario() {
    for (const regra of REGRAS_CENARIO) {
      const geo = geoModelo(regra.m) || geoReserva(regra.m);
      const itens = [];
      for (const id of regra.em) {
        const t = idx(id); if (t < 0) continue;
        let cand = pinosDe[t].filter(k => !ehBorda(k) || regra.costa).filter(k => longeDosMarcos(k, id))
          .filter(k => !regra.filtro || regra.filtro(id, (k / COLS) | 0, k % COLS)).filter(k => !regra.costa || ehCosta(k));
        if (regra.n) cand = cand.sort((a, b) => hash(a * 13) - hash(b * 13)).slice(0, regra.n);
        else cand = cand.filter(k => hash(k * 17 + regra.m.length) < regra.dens);
        for (const k of cand) {
          const [x, z] = xzDe(k);
          itens.push({ k, t, x: x + (hash(k * 3) - .5) * .4, z: z + (hash(k * 5) - .5) * .4, ry: hash(k * 7) * Math.PI * 2, s: .85 + hash(k * 11) * .3, vivo: 1, grupo: regra.grupo });
        }
      }
      if (!itens.length) continue;
      const malha = new THREE.InstancedMesh(geo, matVertice, itens.length);
      malha.castShadow = qualidade !== 'leves'; malha.receiveShadow = true;
      malha.userData.tipo = regra.m;
      raiz.add(malha); cenarioMalhas.push(malha);
      cenario[regra.m + (cenario[regra.m] ? '2' : '')] = { malha, itens };
      desenharCenario(malha, itens);
    }
  }
  function desenharCenario(malha, itens) {
    itens.forEach((it, i) => {
      const y = ALT_TERRA + alturaBase[it.k] + .2, s = it.s * it.vivo * (it.oculto ? 0 : 1);
      m4.compose(v3.set(it.x, y, it.z), q4.setFromEuler(eY.set(it.triste ? .3 : 0, it.ry, 0)), s3.set(s, s * (it.triste ? .9 : 1), s));
      malha.setMatrixAt(i, m4);
    });
    malha.instanceMatrix.needsUpdate = true;
    malha.computeBoundingSphere();
  }
  const redesenharCenario = () => Object.values(cenario).forEach(c => desenharCenario(c.malha, c.itens));
  // Construções escondem o cenário que estiver embaixo delas
  function liberarArea(x, z, raio) {
    Object.values(cenario).forEach(c => { let mudou = false; c.itens.forEach(it => { if (Math.hypot(it.x - x, it.z - z) < raio && !it.oculto) { it.oculto = true; mudou = true; } }); if (mudou) desenharCenario(c.malha, c.itens); });
  }
  // Substitutos de peças quando não há dados/modelos.js (o jogo funciona sem os modelos)
  function geoReserva(id) {
    return geoCache('reserva' + id, () => {
      const P = (g, hex, x = 0, y = 0, z = 0, ry = 0, s = 1) => { const c = corLinear(hex), gg = pintarGeo(g.clone(), c.r, c.g, c.b); if (s !== 1) gg.scale(...(Array.isArray(s) ? s : [s, s, s])); if (ry) gg.rotateY(ry); gg.translate(x, y, z); return gg; };
      const tronco = C.madeira, folha = '#3FAE5A', folha2 = '#2E8F4A';
      const R = {
        'arvore-folhosa': () => [P(barra(.18, .8), tronco), P(caixa(1.1, .9, 1.1, .2), folha, 0, .7), P(caixa(.75, .5, .75, .15), folha2, 0, 1.55)],
        pinheiro: () => [P(barra(.16, .6), tronco), P(cone(.7, .1, 1.1), '#2F8F5B', 0, .5), P(cone(.5, .05, .9), '#3AA56A', 0, 1.2)],
        'pinheiro-neve': () => [P(barra(.16, .6), tronco), P(cone(.7, .1, 1.1), '#2F8F5B', 0, .5), P(cone(.5, .05, .9), '#F6FAFD', 0, 1.2)],
        palmeira: () => [P(barra(.13, 1.9), tronco), P(caixa(1.4, .2, .4, .08), '#3FAE5A', 0, 1.9), P(caixa(.4, .2, 1.4, .08), '#3FAE5A', 0, 1.95)],
        'palmeira-curva': () => [P(barra(.13, 1.7), tronco), P(caixa(1.4, .2, .4, .08), '#3FAE5A', 0, 1.7), P(caixa(.4, .2, 1.4, .08), '#3FAE5A', 0, 1.75)],
        'arvore-savana': () => [P(barra(.13, 1.2), tronco), P(caixa(1.4, .3, 1.1, .1), '#8DBF4A', 0, 1.2)],
        cacto: () => [P(barra(.2, 1.3), '#3E9E5A'), P(barra(.13, .5), '#3E9E5A', .35, .5)],
        'urso-polar': () => [P(caixa(1.2, .8, .8, .2), '#F4F7FA', 0, .1), P(caixa(.6, .55, .55, .15), '#F4F7FA', .65, .6)],
        pinguim: () => [P(caixa(.6, .9, .5, .2), C.pecaPreta), P(caixa(.42, .6, .1, .1), '#FFFFFF', 0, .1, .25), P(cone(.12, .02, .25), C.amarelo, 0, .7, .3)],
        nuvem: () => [P(esfera(.8), '#FFFFFF', 0, .8), P(esfera(.6), '#FFFFFF', .8, .6), P(esfera(.6), '#FFFFFF', -.8, .6)],
      };
      const lista = (R[id] || (() => [P(tijolo(1, 1), C.cinzaClaro)]))();
      return THREE.mergeGeometries(lista);
    });
  }

  // ============================== CÂMERA ==============================
  let passeio = null;   // modo início: a câmera passeia sozinha
  function voar([x, z], distancia, { duracao = 1.1, inclinacao = .78, comSom = true } = {}) {
    if (!controles) return Promise.resolve();
    const pos = new THREE.Vector3(x, distancia * Math.cos(inclinacao), z + distancia * Math.sin(inclinacao));
    gsap.killTweensOf(controles.target); gsap.killTweensOf(camera.position);
    if (!duracao || REDUZ) { controles.target.set(x, 0, z); camera.position.copy(pos); controles.update(); return Promise.resolve(); }
    if (comSom && camera.position.distanceTo(pos) > 20) som('whoosh');
    return Promise.all([anim(controles.target, { x, y: 0, z, duration: duracao, ease: 'power2.inOut' }),
      anim(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: duracao, ease: 'power2.inOut' })]);
  }
  const DIST_GERAL = 186;
  const distGeral = () => DIST_GERAL * Math.max(1, (16 / 9) / Math.max(.5, camera.aspect)) ** .85;
  const visaoGeral = (duracao = 1.1) => { rotulosPor('foco', []); return voar([0, 3], distGeral(), { duracao, inclinacao: .62 }); };
  function focar(id, { duracao = 1.1, perto = 1 } = {}) {
    const t = idx(id); if (t < 0) return Promise.resolve();
    rotulosPor('foco', [id]);
    const n = pinosDe[t].length;
    return voar(ancoraXZ(id), Math.max(28, Math.min(110, 14 + Math.sqrt(n) * 3.2)) / perto, { duracao });
  }
  function modo(qual) {
    modoAtual = qual === 'inicio' ? 'inicio' : 'jogo';
    rotulosSujos = true;
    if (!controles) return;
    controles.enabled = modoAtual === 'jogo';
    sobreposicao.style.opacity = modoAtual === 'inicio' ? '0' : '';
    if (modoAtual === 'inicio') { passeio = { t0: performance.now() }; voar([0, 3], distGeral(), { duracao: 0, inclinacao: .62 }); }
    else { passeio = null; visaoGeral(REDUZ ? 0 : 1.1); }
  }
  function tiquePasseio() {
    if (!passeio || REDUZ) return;
    const t = (performance.now() - passeio.t0) / 1000, f = Math.PI * 2 * t / 40;
    const az = Math.sin(f) * 8 * Math.PI / 180, dist = distGeral() * (1 + .06 * Math.sin(f + Math.PI / 2)), inc = .62;
    controles.target.set(0, 0, 3);
    camera.position.set(Math.sin(az) * dist * Math.sin(inc), dist * Math.cos(inc), 3 + Math.cos(az) * dist * Math.sin(inc));
    camera.lookAt(controles.target);
  }
  const distCamera = () => camera.position.distanceTo(controles.target);

  // ============================== PONTEIRO: clique e passar o mouse ==============================
  function ligarPonteiro(el) {
    const ray = new THREE.Raycaster(), chao = new THREE.Plane(new THREE.Vector3(0, 1, 0), -ALT_TERRA), ponto = new THREE.Vector3();
    let inicio = null;
    const terrEm = ev => {
      const b = el.getBoundingClientRect();
      ray.setFromCamera({ x: ((ev.clientX - b.left) / b.width) * 2 - 1, y: -((ev.clientY - b.top) / b.height) * 2 + 1 }, camera);
      // objetos altos (torres, bandeiras, construções) contam como o território onde estão
      const alvosRay = [imTijolos, ...Object.values(bandeiras), ...construcoes.map(c => c.grupo)];
      const hit = ray.intersectObjects(alvosRay, true)[0];
      if (hit) {
        if (hit.object === imTijolos) { const p = hit.point; for (const id of Object.keys(torres)) { const [x, , z] = baseTorres(id); if (Math.abs(p.x - x) < 7 && Math.abs(p.z - z) < 1.5) return idx(id); } }
        let o = hit.object; while (o && o.userData.territorio === undefined) o = o.parent;
        if (o) return idx(o.userData.territorio);
        for (const [id, b] of Object.entries(bandeiras)) { let p = hit.object; while (p && p !== b) p = p.parent; if (p) return idx(id); }
      }
      if (!ray.ray.intersectPlane(chao, ponto)) return -1;
      const k = celulaEm(ponto.x, ponto.z);
      if (k < 0) return -1;
      if (terrDaCelula[k] === -1) for (const [id, pt] of Object.entries(PONTES)) if (pt.celulas?.includes(k)) return idx(id);   // ponte de um território pequeno
      return terrDaCelula[k];
    };
    el.addEventListener('pointerdown', ev => (inicio = { x: ev.clientX, y: ev.clientY }));
    el.addEventListener('pointerup', ev => {
      if (!inicio || Math.hypot(ev.clientX - inicio.x, ev.clientY - inicio.y) > 6) return;   // foi arrasto
      const t = terrEm(ev);
      if (t >= 0 && aoClicarFn) aoClicarFn({ id: TERR[t], x: ev.clientX, y: ev.clientY });
    });
    let movPend = null;
    el.addEventListener('pointerdown', () => agitar(), { passive: true });
    el.addEventListener('wheel', () => agitar(), { passive: true });
    el.addEventListener('pointermove', ev => {
      agitar();
      if (!movPend) requestAnimationFrame(() => { const e2 = movPend; movPend = null; mover(e2); });
      movPend = ev;
    });
    const mover = ev => {
      if (ev.buttons) return;
      const t = terrEm(ev);
      if (t === sobre) return;
      const antes = sobre; sobre = t;
      if (antes >= 0) recalcularElevacao(antes);
      if (t >= 0) recalcularElevacao(t);
      el.style.cursor = t >= 0 ? 'pointer' : '';
      rotulosPor('mouse', t >= 0 ? [TERR[t]] : []);
      aoPassarFn?.(t >= 0 ? { id: TERR[t], x: ev.clientX, y: ev.clientY } : null);
    };
    el.addEventListener('pointerleave', () => { const a = sobre; sobre = -1; if (a >= 0) recalcularElevacao(a); rotulosPor('mouse', []); aoPassarFn?.(null); });
  }

  // ============================== RÓTULOS, NÚMEROS FLUTUANTES E PÍLULAS (HTML sobre o canvas) ==============================
  function estilos() {
    if (document.getElementById('estilo-mapa3d')) return;
    const s = document.createElement('style'); s.id = 'estilo-mapa3d';
    s.textContent = `
.rotulos-mapa{position:absolute;inset:0;pointer-events:none;overflow:hidden;--u:min(1vh,.5625vw);z-index:1}
.rm-rotulo{position:absolute;left:0;top:0;display:flex;align-items:center;gap:.22em;font:700 calc(2.4*var(--u))/1.02 Fredoka,Nunito,sans-serif;
  color:#fff;-webkit-text-stroke:.2em #1A1433;paint-order:stroke fill;letter-spacing:.02em;white-space:pre;text-align:center;
  text-shadow:0 .12em 0 rgba(26,20,51,.35);opacity:0;transition:opacity .2s;will-change:transform}
.rm-rotulo.rm-casa{font-size:max(18px,calc(3*var(--u)))}
.rm-rotulo:not(.rm-casa){font-size:max(18px,calc(2.4*var(--u)))}
.rm-rotulo.rm-visivel{opacity:1}
.rm-rotulo svg{width:calc(2.6*var(--u));height:calc(2.6*var(--u));flex:none;overflow:visible;-webkit-text-stroke:0}
.rm-num{position:absolute;left:0;top:0;font:900 calc(5.6*var(--u))/1 Nunito,Fredoka,sans-serif;font-variant-numeric:tabular-nums;color:#fff;
  -webkit-text-stroke:.17em #1A1433;paint-order:stroke fill;text-shadow:0 .07em 0 #1A1433;display:flex;align-items:center;gap:.12em;white-space:nowrap;will-change:transform,opacity}
.rm-num svg{width:.7em;height:.7em;-webkit-text-stroke:0;overflow:visible}
.rm-pilula,.rm-altura{position:absolute;left:0;top:0;font:900 max(18px,calc(2.2*var(--u)))/1 Nunito,Fredoka,sans-serif;font-variant-numeric:tabular-nums;color:#1A1433;
  background:#FFF9EC;border:max(2px,calc(.28*var(--u))) solid #1A1433;border-radius:999px;padding:.06em .3em .1em;box-shadow:0 max(2px,calc(.28*var(--u))) 0 #1A1433;opacity:0;transition:opacity .2s}
.rm-altura{min-width:1.1em;text-align:center}
.rm-pilula.rm-visivel,.rm-altura.rm-visivel{opacity:1}
.rm-selo{position:absolute;left:0;top:0;width:calc(3.4*var(--u));height:calc(3.4*var(--u));opacity:0;transition:opacity .2s}
.rm-selo.rm-visivel{opacity:1}
@media (prefers-reduced-motion: reduce){.rm-rotulo,.rm-pilula,.rm-altura,.rm-selo{transition:none}}`;
    document.head.appendChild(s);
  }
  const svgForma = (pid, traco = 12) => { const e = eq(pid); return `<svg viewBox="-8 -8 116 116" aria-hidden="true"><path d="${FORMAS[e.forma]}" fill="${e.cor}" stroke="#1A1433" stroke-width="${traco}" stroke-linejoin="round" paint-order="stroke"/></svg>`; };
  // Selo de balança desenhado (não é caractere de fonte): disco creme, contorno índigo, braço e dois pratos
  const SVG_BALANCA = '<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="44" fill="#FFF9EC" stroke="#1A1433" stroke-width="8"/>' +
    '<g fill="none" stroke="#1A1433" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M50 24v46M34 74h32M24 36h52"/><path d="M24 36l-10 22h20zM76 36l-10 22h20z" fill="#FFD21F"/></g><circle cx="50" cy="24" r="6" fill="#1A1433"/></svg>';
  const rotulos = {};       // id → { el, prioridade, motivos: Set, w, h, fixo }
  const PRIO = { casa: 4, evento: 3, alvo: 3, foco: 3, mouse: 3, parceiro: 2, livre: 1 };
  function rotuloDe(id) {
    if (rotulos[id]) return rotulos[id];
    const el = document.createElement('span'), casa = ehPotencia(id);
    el.className = 'rm-rotulo' + (casa ? ' rm-casa' : '');
    el.innerHTML = (casa ? svgForma(id) : '') + `<span>${quebrar(nomeDe(id)).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])}</span>`;
    sobreposicao.appendChild(el);
    rotulosSujos = true;
    const r = rotulos[id] = { el, motivos: new Set(casa ? ['casa'] : []), w: 0, h: 0 };
    ordemRotulos = null;
    return r;
  }
  // Rótulo personalizado (contrato antigo): rotulo(id, texto, classe)
  function rotulo(id, texto, classe = '') {
    const r = rotuloDe(id);
    if (texto) r.el.lastElementChild.textContent = quebrar(texto);
    if (classe) { r.el.className = 'rm-rotulo ' + classe + (ehPotencia(id) ? ' rm-casa' : ''); r.el._vis = null; }
    r.motivos.add('livre'); r.w = 0; rotulosSujos = true; ordemRotulos = null;
    return r.el;
  }
  // motivo ∈ evento | alvo | foco | mouse | parceiro: liga o rótulo destes territórios e desliga dos outros
  const porMotivo = {};
  function rotulosPor(motivo, ids) {
    (porMotivo[motivo] || []).forEach(id => rotulos[id]?.motivos.delete(motivo));
    porMotivo[motivo] = ids.filter(id => idx(id) >= 0);
    porMotivo[motivo].forEach(id => rotuloDe(id).motivos.add(motivo));
    rotulosSujos = true; ordemRotulos = null;
  }
  // Pílula "+N" (torres escondidas na visão geral) e número da altura das torres de perto
  const pilulas = {};
  function pilula(chave, texto) {
    let el = pilulas[chave];
    if (!el) { el = pilulas[chave] = document.createElement('span'); el.className = chave.startsWith('h:') ? 'rm-altura' : 'rm-pilula'; sobreposicao.appendChild(el); }
    if (el.textContent !== texto) el.textContent = texto;
    return el;
  }
  const transladar = (el, x, y, resto = '') => { const s = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)${resto}`; if (el._tr !== s) { el._tr = s; el.style.transform = s; } };
  // Tamanho do canvas guardado no redimensionar: ler clientWidth a cada rótulo forçava recálculo de layout com o HUD animando
  let telaW = 1, telaH = 1, rotulosSujos = true, ordemRotulos = null;
  // Liga/desliga a classe só quando muda: mexer no classList de ~200 elementos por quadro custava recálculo de estilo
  const vis = (el, v) => { if (el._vis !== v) { el._vis = v; el.classList.toggle('rm-visivel', v); } };
  const comMotivo = id => { const m = rotulos[id]?.motivos; return !!m && m.size > (m.has('casa') ? 1 : 0); };
  const naTela = (x, y, z) => { v3.set(x, y, z).project(camera); return [(v3.x * .5 + .5) * telaW, (-v3.y * .5 + .5) * telaH, v3.z < 1]; };
  function posicionarRotulos() {
    const w = telaW, h = telaH, u = Math.min(h, w * .5625) / 100, caixas = [];
    // ordem por prioridade refeita só quando um motivo muda (antes: a cada quadro, com arrays novos)
    ordemRotulos ||= Object.entries(rotulos).map(([id, r]) => [id, r, Math.max(0, ...[...r.motivos].map(m => PRIO[m] || 0))]).sort((a, b) => b[2] - a[2]);
    for (const [id, r, prio] of ordemRotulos) {
      if (!prio) { vis(r.el, false); continue; }
      if (!r.w) { r.w = r.el.offsetWidth; r.h = r.el.offsetHeight; }
      let px, py, ok;
      const b = ehPotencia(id) && bonecosMapa[id];
      if (b) { const p = b.position, esc = b.scale.x; [px, py, ok] = naTela(p.x, p.y, p.z + 1.15 * esc); py += r.h / 2 + .4 * u; }
      else { const [x, y, z] = baseTorres(id); [px, py, ok] = naTela(x, y, z + 2.4); py += r.h / 2; }
      transladar(r.el, px - r.w / 2, py - r.h / 2);
      const bw = r.w / 2 + .6 * u, bh = r.h / 2 + .6 * u;
      const bate = !ok || caixas.some(c => Math.abs(c.x - px) < c.w + bw && Math.abs(c.y - py) < c.h + bh);
      vis(r.el, !bate);
      if (!bate) caixas.push({ x: px, y: py, w: bw, h: bh });
    }
    // pílulas de torres ("+N" na visão geral; altura de perto): somem se encostarem num rótulo
    const vistos = new Set();
    const poePilula = (chave, texto, px, py, ok) => {
      const el = pilula(chave, texto); vistos.add(chave);
      const w = el._w || (el._w = el.offsetWidth), h = el._h || (el._h = el.offsetHeight), cx = px, cy = py - h / 2;
      const bate = !ok || caixas.some(c => Math.abs(c.x - cx) < c.w + w / 2 + .2 * u && Math.abs(c.y - cy) < c.h + h / 2 + .2 * u);
      transladar(el, cx - w / 2, cy - h / 2);
      vis(el, !bate);
      if (!bate) caixas.push({ x: cx, y: cy, w: w / 2, h: h / 2 });
    };
    for (const [id, t] of Object.entries(torres)) {
      if (!t.lista.length) continue;
      // "+N" só onde a turma está olhando (mouse, alvo, foco, evento): na visão geral parada, poluía o mapa
      if (!pertoDeMais && t.lista.length > 2 && comMotivo(id)) {
        const [x, y, z] = posTorre(id, 1, 2), [px, py, ok] = naTela(x + 1.7, y + .2, z + 1);
        poePilula('p:' + id, '+' + (t.lista.length - 2), px + .9 * u, py, ok);
      }
      if (pertoDeMais) t.lista.forEach((inf, j) => {
        const [x, y, z] = posTorre(id, j, t.lista.length), alt = (t.tijolos.filter(b => b.pid === inf.pid).length) * TIJOLO, [px, py, ok] = naTela(x, y + alt + PLACA + .5, z);
        poePilula(`h:${id}:${inf.pid}`, String(inf.n), px, py, ok);
      });
    }
    // selo de disputa: duas torres empatadas no limiar da parceria (guia §6.6)
    for (const [id, t] of Object.entries(torres)) {
      const [a, b] = t.lista;
      if (!a || !b || a.n !== b.n || !t.resistencia || a.n < t.resistencia) continue;
      const [x, y, z] = posTorre(id, 0, t.mostradas || 2), [px, py, ok] = naTela(x + 1.15, y + a.n * TIJOLO + 2.2, z);
      const el = pilula('d:' + id, ''); vistos.add('d:' + id);
      if (!el.innerHTML) { el.className = 'rm-selo'; el.innerHTML = SVG_BALANCA; el.setAttribute('aria-hidden', 'true'); }
      const w = el._w || (el._w = el.offsetWidth || 26), cy = py - w / 2;
      const bate = !ok || caixas.some(c => Math.abs(c.x - px) < c.w + w / 2 && Math.abs(c.y - cy) < c.h + w / 2);
      transladar(el, px - w / 2, py - w); vis(el, !bate);
      if (!bate) caixas.push({ x: px, y: cy, w: w / 2, h: w / 2 });
    }
    for (const k in pilulas) if (!vistos.has(k)) vis(pilulas[k], false);
    // números flutuantes acompanham o ponto 3D
    for (const n of numeros) { const [px, py] = naTela(...n.pos); transladar(n.el, px, py, ' translate(-50%,-100%)'); }   // transform em vez de left/top: sem layout
  }
  // Número flutuante (guia §6.11): nasce 2 módulos acima da âncora, sobe 6u em 1,4 s e some; máx. 4 por lugar, 0,18 s entre eles
  const numeros = [], filaNum = {};
  function numeroFlutuante(id, texto, corNum = 'ganho') {
    if (!sobreposicao || idx(id) < 0) return Promise.resolve();
    const pid = ehPotencia(corNum) ? corNum : null;
    const corTexto = pid ? eq(pid).cor : corNum === 'ganho' ? '#5BE37D' : corNum === 'perda' ? '#FF6B6B' : corNum === 'branco' ? '#FFFFFF' : corNum;
    const agora = performance.now(), fila = (filaNum[id] = (filaNum[id] || []).filter(t => t > agora - 1400));
    if (fila.length >= 4) return Promise.resolve();
    const atraso = Math.max(0, (fila.length ? fila[fila.length - 1] + 180 : agora) - agora);
    fila.push(agora + atraso);
    return new Promise(ok => setTimeout(() => {
      const el = document.createElement('span'); el.className = 'rm-num'; el.style.color = corTexto;
      el.innerHTML = (pid ? svgForma(pid, 14) : '') + `<span>${String(texto).replace(/-/g, '−')}</span>`;
      const tr = document.createElement('span'); tr.appendChild(el);
      tr.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-50%,-100%)';
      sobreposicao.appendChild(tr);
      const [x, y, z] = baseTorres(id), n = { el: tr, pos: [x, y + 2, z] };
      numeros.push(n);
      const u = Math.min(innerHeight, innerWidth * .5625) / 100;
      const fimN = () => { tr.remove(); numeros.splice(numeros.indexOf(n), 1); ok(); };
      if (REDUZ) { el.style.opacity = 1; setTimeout(() => gsap.to(el, { opacity: 0, duration: .3, onComplete: fimN }), 1100 * VEL); return; }
      gsap.timeline({ onComplete: fimN })
        .fromTo(el, { scale: .6 }, { scale: 1.15, duration: .12 * VEL, ease: 'back.out(2)' })
        .to(el, { scale: 1, duration: .1 * VEL })
        .fromTo(el, { y: 0 }, { y: -6 * u, duration: 1.4 * VEL, ease: 'power1.out' }, 0)
        .to(el, { opacity: 0, duration: .3 * VEL }, 1.1 * VEL);
    }, atraso * VEL));
  }

  // ============================== BONECOS (fonte única: js/bonecos.js, frente Bonecos e cenas) ==============================
  const bonecosMapa = {};   // pid → boneco (com base de peão) na capital
  let holofote = null, vezDe = null;
  // Atalho do contrato antigo: o boneco vem de Bonecos.criar (sem js/bonecos.js, não há boneco)
  const criarBoneco = (avatar = {}, opcoes) => (typeof Bonecos !== 'undefined' && Bonecos.criar ? Bonecos.criar(avatar, opcoes) : new THREE.Group());
  const escalaBoneco = () => limitar(distCamera() / 55, 1.25, 2.6);
  // Um boneco por potência, na capital, deslocado para o nordeste da âncora (guia §7.8)
  let pendBonecos = null;
  function bonecos(avatares = []) {
    if (!raiz) { pendBonecos = avatares; return; }
    for (const b of Object.values(bonecosMapa)) { b.descartar ? b.descartar() : raiz.remove(b); }
    for (const k of Object.keys(bonecosMapa)) delete bonecosMapa[k];
    for (const av of avatares) {
      const pid = av.pid; if (!ehPotencia(pid)) continue;
      const b = criarBoneco({ ...av, cor: av.cor || eq(pid).cor, forma: av.forma || eq(pid).forma }, { base: true, tijolinhos: false });
      const [ax, az] = ancoraXZ(pid);
      b.position.set(ax + 3, ALT_TERRA + CASA, az - 3.5); b.rotation.y = -.3;
      b.userData.territorio = pid; b.userData.pid = pid;
      raiz.add(b); bonecosMapa[pid] = b;
    }
    rotulosCasas();
  }
  const DUR_ACAO = { acenar: 1.2, pular: .8, comemorar: 1.6, triste: 1.5, votar: .9, falar: 2, surpreso: .6, palmas: 1.2, apontar: .5, parado: 0 };
  function acaoBoneco(pid, acao) {
    const b = bonecosMapa[pid]; if (!b) return Promise.resolve();
    b.acao?.(acao);
    return acompanhar(esperar(DUR_ACAO[acao] ?? 1.2));
  }
  // Holofote amarelo no chão sob o boneco da vez (guia §2.6 "Vez")
  function vez(pid) {
    vezDe = pid || null;
    if (!raiz) return;
    if (!holofote) {
      holofote = new THREE.Group();
      const disco = new THREE.Mesh(new THREE.CircleGeometry(1.5, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: C.amarelo, transparent: true, opacity: .35, depthWrite: false }));
      const anel = new THREE.Mesh(anelChao(1.5, 1.72), new THREE.MeshBasicMaterial({ color: C.amarelo, transparent: true, opacity: .9, depthWrite: false }));
      disco.position.y = anel.position.y = .02; holofote.add(disco, anel); holofote.renderOrder = 2;
      holofote.tique = (dt, t) => { const g = bonecosMapa[vezDe]; holofote.visible = !!g; if (!g) return; holofote.position.copy(g.position); holofote.scale.setScalar(g.scale.x * (REDUZ ? 1 : 1 + Math.sin(t * Math.PI) * .04)); };
      raiz.add(holofote); animados.add(holofote);
    }
  }

  // ============================== LAÇO ==============================
  let ultimoQuadro = 0, relogio = 0;
  // Quadro econômico (desempenho): quando só o ambiente se mexe (mar, respiração, navios, bandeiras) e a câmera está
  // parada e longe, o mapa desenha a ~30 quadros/s e refaz a sombra a cada 2 desses quadros. Em ação (câmera, tweens 3D,
  // efeitos, construções, mouse), tudo a cada quadro, como antes.
  let economico = false, pulou = false, semSombra = 0, emCurso = 0, agitadoAte = 0, lodLonge = null;
  const camAnt = new Float32Array(7);
  const agitar = (s = .6) => { agitadoAte = Math.max(agitadoAte, performance.now() + s * 1000); };
  const acompanhar = p => { emCurso++; return Promise.resolve(p).finally(() => { emCurso--; agitar(.3); }); };
  const AMBIENTE = new WeakSet([uni.faixa, uni.cint.value, uni.cint2.value]);   // tweens de enfeite contínuo (mar, alarmes que se repetem)
  function tweens3D() {   // tweens do GSAP em objetos (não em elementos HTML, como os laços do HUD)
    for (const t of gsap.globalTimeline.getChildren(true, true, false)) {
      const a = t.targets()[0];
      if (a && typeof a === 'object' && !AMBIENTE.has(a) && !(a instanceof Element) && t.isActive()) return true;
    }
    return false;
  }
  // Painel aberto por cima (plantão, dilema, balanço…: #camada com véu): o mapa fica atrás a ~30 quadros/s mesmo em ação,
  // e sobra CPU para a interface que a turma está olhando
  let camada = null;
  const sobPainel = () => !!(camada ||= document.getElementById('camada'))?.firstElementChild;
  function quadro(agora) {
    const agit = emCurso > 0 || agora < agitadoAte || tweens3D();
    if ((economico && !agit || sobPainel()) && agora - ultimoQuadro < 30) { pulou = true; return; }
    const dt = ultimoQuadro ? Math.min(.1, (agora - ultimoQuadro) / 1000) : 1 / 60;
    ultimoQuadro = agora; relogio += dt;
    // medidor de quadros: troca para "leves" se a média passar de 22 ms em 3 s (quadros econômicos não contam)
    if (fpsAuto && agora - medidor.inicio > 3000 && !pulou) {
      medidor.soma += dt * 1000; medidor.n++;
      if (agora - medidor.inicio > 6000) { if (medidor.n && medidor.soma / medidor.n > 22) graficos('leves', { auto: true }); medidor.reset(); }
    }
    pulou = false;
    if (modoAtual === 'inicio') tiquePasseio(); else {
      controles.update();
      controles.target.x = limitar(controles.target.x, -COLS / 2, COLS / 2);
      controles.target.z = limitar(controles.target.z, -LINS / 2, LINS / 2);
    }
    let mexeu = false;
    const pc = camera.position, qc = camera.quaternion, cv = [pc.x, pc.y, pc.z, qc.x, qc.y, qc.z, qc.w];
    for (let i = 0; i < 7; i++) if (Math.abs(cv[i] - camAnt[i]) > 1e-4) { mexeu = true; camAnt[i] = cv[i]; }
    if (modoAtual === 'inicio') mexeu = false;   // o passeio da tela inicial é lento (8° em 40 s): conta como ambiente
    const dist = distCamera(), perto = dist < 70;
    if (perto !== pertoDeMais) { pertoDeMais = perto; torresSujas = true; Object.entries(bandeiras).forEach(([id, b]) => b.position.set(...posBandeira(id))); }
    // Nível de detalhe: quando cada pino da terra, da espuma e da moldura fica com menos de 6 px na tela (visão geral),
    // a versão de 8 lados fica igual na imagem com metade dos triângulos (eram ~800 mil por quadro só de pinos)
    const longe = .6 * renderer.domElement.height / (2 * dist * Math.tan(camera.fov * Math.PI / 360)) < 6;
    if (longe !== lodLonge) { lodLonge = longe; trocarLOD(longe); }
    uni.pulso.value = REDUZ ? 1 : .6 + .4 * Math.sin(relogio * Math.PI * 2 / 1.2);
    tiqueMar(dt);
    tiqueElevacao(dt);
    const esc = escalaBoneco();
    for (const b of Object.values(bonecosMapa)) b.scale.setScalar(esc);
    const escC = lerp(1, 1.3, limitar((dist - 60) / 100, 0, 1));
    for (const c of construcoes) if (!c.montando) c.grupo.scale.setScalar(escC * (c.escalaExtra || 1));
    const escB = lerp(.9, 1.5, limitar((dist - 50) / 110, 0, 1));
    // isTweening percorre todos os tweens: só pergunta quando a escala está fora do lugar (a câmera mudou ou a bandeira animou)
    for (const id in bandeiras) { const s = bandeiras[id].scale; if ((s.x !== escB || s.y !== escB) && !gsap.isTweening(s)) s.setScalar(escB); }
    animados.forEach(o => o.tique?.(dt, relogio));
    const torresMexeram = torresSujas || elevMudou;
    elevMudou = false;
    if (torresSujas) desenharTorres();
    // Sombra em cache: refeita a cada quadro em ação; com tudo calmo e de longe, a cada 2 quadros econômicos (~15/s)
    const calmo = !agit && !mexeu && !pertoDeMais && !torresMexeram && !particulas.ativas();
    if (!calmo || ++semSombra >= 2) { renderer.shadowMap.needsUpdate = true; semSombra = 0; }
    // AO entra aos poucos entre as distâncias 100 e 55 (de longe vira pontilhado): longe, desenha direto com MSAA
    let f = 0;
    if (n8) { f = 1 - THREE.MathUtils.smoothstep(dist, 55, 100); n8.configuration.intensity = 2.2 * f; }
    if (composer && f > .01) composer.render(dt); else renderer.render(cena, camera);
    // rótulos só são recalculados quando algo pode tê-los movido (câmera, torres, animação 3D, números, lista nova)
    if (rotulosSujos || mexeu || agit || torresMexeram || numeros.length) { rotulosSujos = false; posicionarRotulos(); }
    economico = calmo;
  }
  // Faixa de brilho do mar e cintilações (REDUZ: parado)
  let proxFaixa = 2, proxCint = 1.5;
  function tiqueMar(dt) {
    if (REDUZ) return;
    if (relogio > proxFaixa) { uni.faixa.value = -160; gsap.to(uni.faixa, { value: 160, duration: 3.4, ease: 'none' }); proxFaixa = relogio + 6 + Math.random() * 2; }
    if (relogio > proxCint) {
      const u = Math.random() < .5 ? uni.cint : uni.cint2, k = mar.count ? Math.floor(Math.random() * mar.count) : 0;
      mar.getMatrixAt(k, m4); v3.setFromMatrixPosition(m4);
      u.value.set(v3.x, v3.z, 0, 0);
      gsap.fromTo(u.value, { w: 0 }, { w: 1, duration: .15, yoyo: true, repeat: 1, ease: 'sine.inOut' });
      proxCint = relogio + .8 + Math.random() * 1.6;
    }
  }

  // Robinson (o mesmo do gerador ferramentas/gerar-mapa.mjs)
  const K = [[.9986, -.062], [1, 0], [.9986, .062], [.9954, .124], [.99, .186], [.9822, .248], [.973, .31], [.96, .372],
    [.9427, .434], [.9216, .4958], [.8962, .5571], [.8679, .6176], [.835, .6769], [.7986, .7346], [.7597, .7903],
    [.7186, .8435], [.6732, .8936], [.6213, .9394], [.5722, .9761], [.5322, 1]].map(([x, y]) => [x, y * 1.593415793900743]);
  function robinson(lon, lat) {
    const fi = lat * Math.PI / 180, i = Math.min(18, Math.abs(fi) * 36 / Math.PI), i0 = Math.floor(i), di = i - i0;
    const [ax, ay] = K[i0], [bx, by] = K[i0 + 1], [cx, cy] = K[Math.min(19, i0 + 2)];
    return [lon * Math.PI / 180 * (bx + di * (cx - ax) / 2 + di * di * (cx - 2 * bx + ax) / 2),
      Math.sign(fi) * (by + di * (cy - ay) / 2 + di * di * (cy - 2 * by + ay) / 2)];
  }
  function lonLatParaXZ(lon, lat) { const [x, y] = robinson(lon, lat); return celulaParaXZ((x - M.x0) / M.cel - .5, (M.y0 - y) / M.cel - .5); }
  function territorioEm(lon, lat) {
    const [x, z] = lonLatParaXZ(lon, lat), k = celulaEm(x, z);
    if (k < 0) return lat < 0 ? 'antartida' : null;
    return terrDaCelula[k] >= 0 ? TERR[terrDaCelula[k]] : null;
  }

  // ============================== CLIMA (guia §6.8): gelo, mar subindo, secas, florestas ==============================
  let aguaClima, rachas, climaAtual = { T: -1 };
  const marMemoria = new Set();   // pinos de costa cobertos pela água que avançou (efeito "mar" e temperatura)
  const ordemGelo = (() => {      // gelo da Groenlândia e da Antártida: da borda para dentro (derrete primeiro a borda)
    const lista = [...(pinosDe[GROEN] || []), ...(pinosDe[ANT] || [])], d = new Map(), fila = [];
    for (const k of lista) if (ehCosta(k)) { d.set(k, 0); fila.push(k); }
    const conj = new Set(lista);
    for (let i = 0; i < fila.length; i++) {
      const k = fila[i], c = k % COLS, r = (k / COLS) | 0;
      for (const [dc, dr] of VIZ4) { const kk = (r + dr) * COLS + c + dc; if (conj.has(kk) && !d.has(kk)) { d.set(kk, d.get(k) + 1); fila.push(kk); } }
    }
    return lista.sort((a, b) => ((d.get(a) ?? 9) + hash(a) * 1.5) - ((d.get(b) ?? 9) + hash(b) * 1.5));
  })();
  const ordemGeloMar = () => geloMar.celulas.map((k, i) => [k, i]).sort((a, b) => (((b[0] / COLS) | 0) + hash(b[0]) * 2) - (((a[0] / COLS) | 0) + hash(a[0]) * 2));
  const COSTAS_BAIXAS = ['pacifico', 'sul_asia', 'caribe'];
  function celulasDelta() {   // delta do Nilo (≈ 31° E, 31° N): pinos de costa do Norte da África por perto
    const [x, z] = lonLatParaXZ(31, 31);
    return (pinosDe[idx('norte_africa')] || []).filter(k => { const [a, b] = xzDe(k); return Math.hypot(a - x, b - z) < 3.5 && ehCosta(k); });
  }
  function montarClima() {
    const gA = new THREE.BoxGeometry(1, .14, 1); gA.translate(0, .07, 0);
    aguaClima = new THREE.InstancedMesh(gA, translucido(C.aguaRasa, .7), 900); aguaClima.count = 0; aguaClima.renderOrder = 3; raiz.add(aguaClima);
    const texRacha = textura('racha', 128, (g, px) => { g.fillStyle = C.racha; g.fillRect(0, 0, px, px); g.strokeStyle = '#5A3D1A'; g.lineWidth = 9; g.lineCap = g.lineJoin = 'round';
      g.beginPath(); g.moveTo(10, 30); g.lineTo(44, 52); g.lineTo(40, 84); g.lineTo(70, 100); g.lineTo(118, 96); g.moveTo(44, 52); g.lineTo(84, 40); g.lineTo(104, 12); g.moveTo(40, 84); g.lineTo(16, 112); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 3; g.strokeRect(3, 3, px - 6, px - 6); });
    const gR = new THREE.BoxGeometry(.96, .24, .96); gR.translate(0, .12, 0);
    rachas = new THREE.InstancedMesh(gR, new THREE.MeshStandardMaterial({ map: texRacha, roughness: .6 }), 400); rachas.count = 0; rachas.receiveShadow = true; raiz.add(rachas);
  }
  function desenharAgua() {
    let n = 0;
    for (const k of marMemoria) { if (n >= 900 || instDaCelula[k] < 0) continue; const [x, z] = xzDe(k); aguaClima.setMatrixAt(n++, m4.makeTranslation(x, ALT_TERRA + alturaBase[k] + .12, z)); }
    aguaClima.count = n; aguaClima.instanceMatrix.needsUpdate = true; aguaClima.computeBoundingSphere();
  }
  function desenharRachas() {
    let n = 0;
    estadoT.forEach((st, t) => st.rachas.forEach(k => { if (n < 400) { const [x, z] = xzDe(k); rachas.setMatrixAt(n++, m4.makeTranslation(x, ALT_TERRA + alturaBase[k], z)); } }));
    rachas.count = n; rachas.instanceMatrix.needsUpdate = true; rachas.computeBoundingSphere();
  }
  function secar(t, quanto = 1) {
    const st = estadoT[t];
    st.seca = Math.max(st.seca, quanto);
    st.rachas = pinosDe[t].filter(k => !ehBorda(k) && hash(k * 31) < .24 * st.seca);
    desenharRachas();
  }
  // Fração de gelo derretido pela temperatura (guia §6.8: 10% em 1,6 °C, +15% em 1,8 °C…)
  const fracGelo = T => (T >= 2.15 ? .45 : T >= 2.0 ? .35 : T >= 1.8 ? .25 : T >= 1.6 ? .1 : 0);
  function aplicarClima(g, animar) {
    const T = g.temperatura ?? 1.45, prom = [];
    // gelo em terra
    const n = Math.round(ordemGelo.length * fracGelo(T));
    const mudar = ordemGelo.filter((k, i) => (i < n) !== !!derretido[k]);
    if (mudar.length) {
      const p = { v: 0 };
      const fim = () => { mudar.forEach(k => { derretido[k] = derretido[k] ? 0 : 1; alturaBase[k] = derretido[k] ? -.4 : 0; alturaAnim[k] = 0; posicionarCelula(k); }); marcarTerra(); [GROEN, ANT].forEach(t => t >= 0 && pintarTerritorio(t)); };
      if (animar && !REDUZ) prom.push(anim(p, { v: 1, duration: .6, ease: 'power2.in', onUpdate: () => { mudar.forEach(k => { alturaAnim[k] = (derretido[k] ? .4 : -.4) * p.v; posicionarCelula(k); }); marcarTerra(); } }).then(fim));
      else fim();
    }
    // gelo do Ártico (derrete mais rápido)
    const ord = ordemGeloMar(), nm = Math.round(ord.length * Math.min(1, fracGelo(T) * 1.8));
    ord.forEach(([k, i], j) => { const [x, z] = xzDe(k); geloMar.malha.setMatrixAt(i, j < nm ? m4.makeScale(0, 0, 0) : m4.makeTranslation(x, 0, z)); });
    geloMar.malha.instanceMatrix.needsUpdate = true;
    // urso-polar triste com o gelo derretendo
    Object.values(cenario).forEach(c => { if (c.malha.userData.tipo === 'urso-polar') { c.itens.forEach(it => (it.triste = T >= 1.6)); desenharCenario(c.malha, c.itens); } });
    // mar avançando nas costas baixas
    if (T >= 1.8) {
      const novas = [...COSTAS_BAIXAS.flatMap(id => (pinosDe[idx(id)] || []).filter(ehCosta)), ...celulasDelta()];
      if (T >= 2.0) COSTAS_BAIXAS.forEach(id => (pinosDe[idx(id)] || []).forEach(k => { if (!ehCosta(k) && VIZ4.some(([dc, dr]) => novas.includes(k + dr * COLS + dc))) novas.push(k); }));
      novas.forEach(k => marMemoria.add(k));
      desenharAgua();
    }
    // Sahel e Norte da África mais secos
    if (T >= 2.0) { secar(idx('sahel'), 1); secar(idx('norte_africa'), .6); pintarTerritorio(idx('sahel')); pintarTerritorio(idx('norte_africa')); }
    // florestas morrendo (Amazônia e Congo): as árvores somem uma a uma
    perdaFloresta.temperatura = T >= 2.15 ? limitar((T - 2.1) * 6, .3, .9) : 0;
    aplicarFlorestas(animar);
    climaAtual.T = T;
    return Promise.all(prom);
  }
  const perdaFloresta = { temperatura: 0, desmatamento: 0 };
  function aplicarFlorestas(animar) {
    Object.values(cenario).forEach(c => {
      let mudou = false;
      c.itens.forEach(it => {
        if (it.grupo !== 'floresta') return;
        const perda = Math.max(perdaFloresta.temperatura, TERR[it.t] === 'brasil' ? perdaFloresta.desmatamento : 0);
        const viva = hash(it.k * 41) >= perda ? 1 : 0;
        if (viva !== it.vivo) { mudou = true; if (animar && !REDUZ && !viva) { particulas.lancar({ x: it.x, y: ALT_TERRA + 1.2, z: it.z, cor: ['#3FAE5A', '#2E8F4A'], n: 2, escala: .4, sobe: [2, 3], vida: .6 }); } it.vivo = viva; }
      });
      if (mudou) desenharCenario(c.malha, c.itens);
    });
  }

  // ============================== COMÉRCIO: rotas, navios, aviões, pombas, arcos (guia §6.9) ==============================
  const ROTAS_MAR = [
    { id: 'atlantico', pontos: [[-74, 39.5], [-62, 40.5], [-45, 44], [-25, 47], [-9, 48.5], [3, 51]] },
    { id: 'suez', chave: ['norte_africa', 'golfo'], pontos: [[-9.5, 37], [-5.6, 35.9], [4, 37.6], [14, 35.6], [24, 34], [32.3, 31.6], [32.7, 29.6], [34.4, 27.4], [38.5, 20.5], [43.3, 12.4], [51, 12.3], [62, 13], [72, 9], [80, 5]] },
    { id: 'malaca', chave: ['sudeste_insular'], pontos: [[80, 5], [91, 6], [97, 5.5], [100.8, 2.8], [104.4, 1.2], [108, 5.5], [112, 11], [116.5, 18.5], [120.5, 24.5], [123.5, 30.5]] },
    { id: 'pacifico-oeste', chave: ['taiwan'], pontos: [[123.5, 30.5], [131, 31], [142, 34], [156, 39.5], [170, 42.5], [179.8, 43.5]] },
    { id: 'pacifico-leste', pontos: [[-179.8, 43.5], [-166, 42], [-150, 39], [-135, 35.5], [-121, 33.5]] },
    { id: 'panama', chave: ['america_central'], pontos: [[-121, 33.5], [-113, 22.5], [-102, 15.5], [-90, 10.5], [-79.8, 8.6], [-78.5, 12.5], [-74, 15.5], [-68.5, 19.5], [-71, 27], [-74, 39.5]] },
    { id: 'cabo', pontos: [[-9.5, 37], [-18, 25], [-21, 10], [-9, -6], [3, -21], [12, -31], [18.5, -36.5], [28, -37], [39, -29], [49, -16], [59, -2], [72, 9]] },
    { id: 'atlantico-sul', pontos: [[-43, -24.5], [-35, -15], [-29, -1], [-24, 12], [-18, 25]] },
    { id: 'turcos', chave: ['turquia'], pontos: [[23.5, 36.8], [26.2, 40.1], [29, 41.2], [31.5, 43], [34, 44]] },
    { id: 'artico', abre: true, pontos: [[18, 71.5], [35, 74.5], [55, 77], [75, 78.5], [100, 79.5], [125, 78], [145, 76], [163, 71.5], [176, 67]] },
  ];
  let imNavios = [], imPontos, rotas = [], comercioAtual = 0;
  function montarComercio() {
    rotas = ROTAS_MAR.map(r => {
      const pts = r.pontos.map(([lo, la]) => lonLatParaXZ(lo, la)), seg = [];
      let L = 0;
      for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push([L, l]); L += l; }
      const em = s => { s = limitar(s, 0, L); let i = seg.findIndex(([a, l]) => s <= a + l); if (i < 0) i = seg.length - 1; const [a, l] = seg[i], u = l ? (s - a) / l : 0, p = pts[i], q = pts[i + 1]; return [lerp(p[0], q[0], u), lerp(p[1], q[1], u), Math.atan2(q[0] - p[0], q[1] - p[1])]; };
      return { ...r, L, em, navios: [], aberta: !r.abre, emConflito: false };
    });
    const gP = redonda(.36, .14, false, 14);
    const pontos = [];
    rotas.forEach((r, ri) => { for (let s = 1; s < r.L - 1; s += 2) { const [x, z] = r.em(s), k = celulaEm(x, z); if (k >= 0 && terrDaCelula[k] === -1) pontos.push({ ri, x, z, i: pontos.length }); } });
    imPontos = new THREE.InstancedMesh(gP, plastico('#FFFFFF', .25), pontos.length);
    imPontos.userData.pontos = pontos; imPontos.receiveShadow = true; raiz.add(imPontos);
    desenharRotas();
    const tique = { tique: tiqueNavios }; animados.add(tique);
  }
  function desenharRotas() {
    const pts = imPontos.userData.pontos;
    pts.forEach((p, j) => {
      const r = rotas[p.ri], vis = r.aberta && (!r.emConflito || j % 2 === 0) && comercioAtual > 0;
      imPontos.setMatrixAt(j, vis ? m4.makeTranslation(p.x, ALT_MAR, p.z) : m4.makeScale(0, 0, 0));
      imPontos.setColorAt(j, cor.set(r.emConflito ? C.laranja : '#FFFFFF'));
    });
    imPontos.instanceMatrix.needsUpdate = true; imPontos.instanceColor.needsUpdate = true;
  }
  function garantirNavios() {
    if (imNavios.length) return;
    ['navio-cargueiro', 'navio-granel'].forEach(id => {
      const geo = geoModelo(id) || geoCache('reservaNavio' + id, () => THREE.mergeGeometries([
        pintarGeo(caixa(1.8, .8, 5, .25).clone(), ...corLinear(id === 'navio-granel' ? '#3657C2' : '#E8562F').toArray()),
        pintarGeo(caixa(1.4, .6, 1.2).clone().translate(0, .8, -1.6), ...corLinear('#FFFFFF').toArray()),
        pintarGeo(tijolo(1, 2, .6).clone().translate(0, .8, .6), ...corLinear(C.amarelo).toArray())]));
      const im = new THREE.InstancedMesh(geo, matVertice, 60); im.count = 0; im.castShadow = true; im.frustumCulled = false;
      raiz.add(im); imNavios.push(im);
    });
  }
  function aplicarComercio(g, e) {
    garantirNavios();
    comercioAtual = g.comercio ?? 60;
    const porRota = Math.floor(comercioAtual / 20);
    rotas.forEach((r, ri) => {
      r.aberta = !r.abre || fracGelo(g.temperatura ?? 1.45) >= .25;
      r.emConflito = !!r.chave?.some(id => (e?.territorios?.[id]?.conflito || 0) > 0);
      const n = r.aberta ? porRota : 0;
      while (r.navios.length < n) r.navios.push({ s: (r.navios.length + .5) / Math.max(1, n) * r.L + Math.random() * 3, tipo: (ri + r.navios.length) % 2 });
      r.navios.length = n;
    });
    desenharRotas();
  }
  function tiqueNavios(dt, t) {
    if (!imNavios.length) return;
    const n = [0, 0], esc = lerp(1, 1.4, limitar((distCamera() - 60) / 100, 0, 1));
    for (const r of rotas) for (const nv of r.navios) {
      if (!r.emConflito && !REDUZ) nv.s = (nv.s + 2 * dt) % r.L;
      const [x, z, ang] = r.em(nv.s), borda = Math.min(nv.s, r.L - nv.s), s = esc * limitar(borda / 1.5, 0, 1) * .62;
      const im = imNavios[nv.tipo];
      m4.compose(v3.set(x, ALT_MAR - .05 + (REDUZ ? 0 : Math.sin(t * 2 + nv.s) * .04), z), q4.setFromEuler(eY.set(0, ang, REDUZ ? 0 : Math.sin(t * 1.3 + nv.s) * .03)), s3.set(s, s, s));
      im.setMatrixAt(n[nv.tipo]++, m4);
    }
    imNavios.forEach((im, i) => { im.count = n[i]; im.instanceMatrix.needsUpdate = true; });
  }

  // Arco pontilhado entre dois pontos (peças redondas que aparecem do começo ao fim)
  function arco(a, b, { cor: c = C.amarelo, altura = 6, passo = 1.1, tam = .32, duracao = .5, duplo = null, opacidade = 1 } = {}) {
    const [ax, ay, az] = a, [bx, by, bz] = b, L = Math.hypot(bx - ax, bz - az), n = Math.max(4, Math.round(L / passo)), h = Math.max(altura, L * .18);
    const mat = opacidade < 1 ? new THREE.MeshStandardMaterial({ color: c, roughness: .3, transparent: true, opacity: opacidade, depthWrite: false }) : brilhante(c, .2);
    const im = new THREE.InstancedMesh(esfera(tam, 10, 8), mat, n + 1); im.frustumCulled = false;
    const ponto = u => [lerp(ax, bx, u), lerp(ay, by, u) + Math.sin(u * Math.PI) * h, lerp(az, bz, u)];
    for (let i = 0; i <= n; i++) { const p = ponto(i / n); im.setMatrixAt(i, m4.makeTranslation(...p)); if (duplo) im.setColorAt(i, cor.set(i % 2 ? duplo : c)); }
    im.count = 0; raiz.add(im);
    const obj = { malha: im, ponto, remover: (dur = .3) => anim(im, { count: 0, duration: REDUZ ? 0 : dur, ease: 'none', onUpdate: () => (im.count = Math.round(im.count)) }).then(() => { raiz.remove(im); if (opacidade < 1) mat.dispose(); im.dispose(); }) };
    obj.pronto = REDUZ ? Promise.resolve(im.count = n + 1) : anim(im, { count: n + 1, duration: duracao, ease: 'power2.inOut', onUpdate: () => (im.count = Math.round(im.count)) });
    return obj;
  }
  const capital = id => { const [x, , z] = baseTorres(id); return [x, ALT_TERRA + (ehPotencia(id) ? CASA : 0), z]; };
  // Objeto que voa em arco de A até B (avião, pomba, moeda)
  function voo(obj, a, b, { altura = 8, duracao = 1.4, gira = true } = {}) {
    raiz.add(obj);
    const p = { u: 0 }, L = Math.hypot(b[0] - a[0], b[2] - a[2]), h = Math.max(altura, L * .12);
    obj.rotation.y = Math.atan2(b[0] - a[0], b[2] - a[2]);
    const poe = () => { obj.position.set(lerp(a[0], b[0], p.u), lerp(a[1], b[1], p.u) + Math.sin(p.u * Math.PI) * h, lerp(a[2], b[2], p.u)); if (gira) obj.rotation.x = -Math.cos(p.u * Math.PI) * .35; };
    poe();
    if (REDUZ) return esperar(.6).then(() => raiz.remove(obj));
    return anim(p, { u: 1, duration: duracao, ease: 'power1.inOut', onUpdate: poe }).then(() => raiz.remove(obj));
  }
  function criarAviao(pid) {
    const g = new THREE.Group(), geo = geoModelo('aviao', pid ? eq(pid).cor : C.cinzaClaro);
    if (geo) g.add(new THREE.Mesh(geo, matVertice));
    else { g.add(new THREE.Mesh(caixa(.9, .9, 3.6, .3), plastico('#FFFFFF')), Object.assign(new THREE.Mesh(caixa(4, .2, 1, .08), plastico(pid ? eq(pid).cor : C.cinzaClaro)), { position: new THREE.Vector3(0, .3, 0) })); }
    g.traverse(o => o.isMesh && (o.castShadow = true));
    g.scale.setScalar(lerp(1, 1.4, limitar((distCamera() - 60) / 100, 0, 1)));
    return g;
  }
  function criarPomba() {
    const g = new THREE.Group(), md = modelos.pomba, asas = [];
    if (md) md.partes.forEach(p => { const m = new THREE.Mesh(p.geo, matVertice); if (p.nome) { const piv = new THREE.Group(); piv.position.copy(p.pivo.pos); piv.quaternion.copy(p.pivo.quat); m.scale.copy(p.pivo.escala); piv.add(m); g.add(piv); asas.push([m, p.nome === 'asa-esq' ? 1 : -1]); } else g.add(m); });
    else {
      g.add(new THREE.Mesh(caixa(.6, .5, 1.2, .2), plastico('#FFFFFF')), Object.assign(new THREE.Mesh(caixa(.4, .4, .4, .15), plastico('#FFFFFF')), { position: new THREE.Vector3(0, .45, .55) }));
      [-1, 1].forEach(l => { const piv = new THREE.Group(); piv.position.set(l * .28, .4, 0); const a = new THREE.Mesh(caixa(1, .1, .6, .04), plastico('#F2F6FF')); a.position.x = l * .5; piv.add(a); g.add(piv); asas.push([piv, -l]); });
    }
    g.traverse(o => o.isMesh && (o.castShadow = true));
    g.tique = (dt, t) => asas.forEach(([piv, l]) => (piv.rotation.z = REDUZ ? 0 : Math.sin(t * Math.PI * 6) * .6 * l));
    animados.add(g);
    g.scale.setScalar(1.3 * lerp(1, 1.4, limitar((distCamera() - 60) / 100, 0, 1)));
    return g;
  }
  function pomba(a, b, { altura = 6, duracao = 1.6, trilha = true } = {}) {
    const g = criarPomba(), tr = trilha ? arco(a, b, { cor: C.ouro, altura: Math.max(altura, Math.hypot(b[0] - a[0], b[2] - a[2]) * .12), passo: 1.6, tam: .22, duracao }) : null;
    return voo(g, a, b, { altura, duracao, gira: false }).then(() => { animados.delete(g); tr?.remover(.4); });
  }

  // ============================== CONFLITOS, FOCOS DE TENSÃO E PAZ (guia §2.6, §6.7) ==============================
  const conflitos = {};   // território → { nivel, blocos: [], anel, pulso }
  const FOCOS = ['taiwan', 'coreia_norte'];
  const geoBloco = () => geoCache('bloco-alerta', () => new THREE.RoundedBoxGeometry(1, 1, 1, 2, .08));
  const matAlerta = () => { const k = 'alerta'; if (!mats.has(k)) { const t = texSimbolo('!', C.conflito); mats.set(k, new THREE.MeshStandardMaterial({ map: t, emissive: '#FFFFFF', emissiveMap: t, emissiveIntensity: .35, roughness: .3 })); } return mats.get(k); };
  const matFoco = () => { const k = 'foco'; if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ map: texSimbolo('!', C.amarelo, '#FFFFFF'), roughness: .3, emissive: C.amarelo, emissiveIntensity: .15 })); return mats.get(k); };
  const texZebra = () => textura('zebra', 128, (g, px) => { g.fillStyle = C.amarelo; g.fillRect(0, 0, px, px); g.fillStyle = C.tinta; for (let i = -px; i < px * 2; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 16, 0); g.lineTo(i + 16 - px, px); g.lineTo(i - px, px); g.fill(); } });
  function posBlocos(id) { const [x, y, z] = baseTorres(id), n = Math.max(1, torres[id]?.mostradas ?? Math.min(2, torres[id]?.lista.length || 1)); return [x + n * 1.15 + 1.9, y, z + .9]; }
  function conflito(id, nivel, { animar = false } = {}) {
    const t = idx(id); if (t < 0) return Promise.resolve();
    const c = conflitos[id] || (conflitos[id] = { nivel: 0, blocos: [], grupo: new THREE.Group() });
    if (!c.grupo.parent) { raiz.add(c.grupo); c.grupo.position.set(...posBlocos(id)); c.grupo.userData.territorio = id; }
    const prom = [];
    while (c.blocos.length < nivel) {
      const b = new THREE.Object3D();   // desenhado pela InstancedMesh dos blocos de alerta
      const i = c.blocos.length; b.userData.x = (i - (nivel - 1) / 2) * 1.15; b.userData.fase = Math.random() * 6;
      c.grupo.add(b); c.blocos.push(b);
      b.position.set(b.userData.x, 1.5, 0);
      if (animar && !REDUZ) { b.position.y = 9; prom.push(anim(b.position, { y: 1.5, duration: .5, ease: 'back.out(1.6)' }).then(() => som('trovao'))); }
    }
    while (c.blocos.length > nivel) {
      const b = c.blocos.pop();
      if (animar && !REDUZ) {
        prom.push(anim(b.position, { y: b.position.y + 3, duration: .4, ease: 'power2.out' }).then(() => { v3.setFromMatrixPosition(b.matrixWorld); particulas.lancar({ x: v3.x, y: v3.y, z: v3.z, cor: [C.conflito, '#FFFFFF', C.paz], n: 10, escala: .35, sobe: [3, 5] }); c.grupo.remove(b); som('certo'); }));
      } else c.grupo.remove(b);
    }
    c.blocos.forEach((b, i) => (b.userData.x = (i - (c.blocos.length - 1) / 2) * 1.15));
    // nível ≥ 2: anel zebrado no chão + hachura nos pinos
    if (nivel >= 2 && !c.anel) {
      const tex = texZebra().clone(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(5, 5); tex.needsUpdate = true;
      c.anel = new THREE.Mesh(anelChao(3.6, 4.4, 48), new THREE.MeshStandardMaterial({ map: tex, roughness: .4, polygonOffset: true, polygonOffsetFactor: -2 }));
      c.anel.receiveShadow = true;
      const [x, y, z] = baseTorres(id); c.anel.position.set(x, y + .05, z); raiz.add(c.anel);
    } else if (nivel < 2 && c.anel) { raiz.remove(c.anel); c.anel.material.map.dispose(); c.anel.material.dispose(); c.anel = null; }
    // nível 3: anel vermelho que se expande e some (1,4 s) + fumaça discreta
    if (nivel >= 3 && !c.pulso) {
      c.pulso = new THREE.Mesh(anelChao(.9, 1.1, 48), new THREE.MeshBasicMaterial({ color: C.alerta, transparent: true, depthWrite: false }));
      const [x, y, z] = baseTorres(id); c.pulso.position.set(x, y + .08, z); raiz.add(c.pulso);
    } else if (nivel < 3 && c.pulso) { raiz.remove(c.pulso); c.pulso.material.dispose(); c.pulso = null; }
    const mudouHachura = (estadoT[t].conflito || 0) >= 2 !== nivel >= 2;
    estadoT[t].conflito = nivel;
    if (mudouHachura) pintarTerritorio(t);
    c.nivel = nivel;
    return Promise.all(prom);
  }
  let imAlertas = null;
  const tiqueConflitos = { tique(dt, t) {
    if (!imAlertas) { imAlertas = new THREE.InstancedMesh(geoBloco(), matAlerta(), 120); imAlertas.castShadow = true; imAlertas.frustumCulled = false; raiz.add(imAlertas); }
    let nA = 0;
    for (const [id, c] of Object.entries(conflitos)) {
      c.grupo.position.set(...posBlocos(id));
      c.blocos.forEach(b => { if (!gsap.isTweening(b.position)) { b.position.x = b.userData.x; b.position.y = 1.5 + (REDUZ ? 0 : Math.sin(t * 2 + b.userData.fase) * .15); } b.rotation.y = REDUZ ? 0 : Math.sin(t * .8 + b.userData.fase) * .25; });
      c.grupo.updateMatrixWorld(true);
      c.blocos.forEach(b => { if (nA < 120) imAlertas.setMatrixAt(nA++, b.matrixWorld); });
      if (c.pulso) { const u = REDUZ ? .5 : (t % 1.4) / 1.4; c.pulso.scale.setScalar(1 + u * 5); c.pulso.material.opacity = 1 - u; }
      if (c.nivel >= 3 && !REDUZ && Math.random() < dt * 1.2) { const [x, y, z] = baseTorres(id); fumaca.soltar({ x: x + (Math.random() - .5) * 4, y: y + .5, z: z - 1.5, cor: C.fumacaConflito, tam: .9, sobe: 1.6, vida: 2.4 }); }
    }
    imAlertas.count = nA; imAlertas.instanceMatrix.needsUpdate = true;
    // pressão sobre o território (guia §2.6): fumacinha branca ≥ 40; ≥ 60, tijolos saltam da torre de quem pressiona
    if (!REDUZ) for (const [id, tr] of Object.entries(torres)) {
      if ((tr.pressao || 0) < 40 || Math.random() > dt * .8) continue;
      const [x, y, z] = baseTorres(id);
      fumaca.soltar({ x: x - 1.2, y: y + .4, z: z + 1.6, cor: '#FFFFFF', tam: .6, sobe: 1.2, vida: 1.6 });
      if (tr.pressao >= 60 && tr.lista[0] && Math.random() < .5) { const [tx, ty, tz] = posTorre(id, 0, tr.mostradas || 1); particulas.lancar({ x: tx, y: ty + tr.lista[0].n * TIJOLO, z: tz, cor: eq(tr.lista[0].pid).cor, escala: .5, sobe: [3, 4], lado: [1, 2], vida: .7 }); }
    }
    for (const f of Object.values(focos)) if (!REDUZ) f.anel.rotation.y += dt * .2;
    for (const b of Object.values(pazes)) b.tique?.(dt, t);
  } };
  const focos = {}, pazes = {};
  function foco(id, ligado) {
    if (!ligado) { if (focos[id]) { raiz.remove(focos[id].grupo); delete focos[id]; } return; }
    if (focos[id]) return;
    const g = new THREE.Group(), [x, y, z] = baseTorres(id);
    const traco = geoCache('traco-foco', () => { const pecas = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const gg = caixa(1.25, .18, .32, .06).clone(); gg.rotateY(Math.PI / 2 - a); gg.translate(Math.cos(a) * 4.4, 0, Math.sin(a) * 4.4); pecas.push(gg); } return THREE.mergeGeometries(pecas); });
    const anel = new THREE.Mesh(traco, brilhante(C.amarelo, .25)); anel.position.y = .02; g.add(anel);
    const bloco = new THREE.Mesh(geoBloco(), matFoco()); bloco.position.set(0, 1.6, 2.8); bloco.scale.setScalar(.9); bloco.castShadow = true; g.add(bloco);
    g.position.set(x, y, z); g.userData.territorio = id; raiz.add(g);
    focos[id] = { grupo: g, anel };
  }
  function paz(id, ligado, { animar = false } = {}) {
    const t = idx(id); if (t < 0) return;
    estadoT[t].paz = !!ligado;
    if (ligado && !pazes[id]) {
      const g = criarPomba(); animados.delete(g); g.tique = () => {};
      const [x, y, z] = baseTorres(id); g.position.set(x + 2.2, y + .1, z + 2.2); g.rotation.y = -.6; g.scale.setScalar(1.1);
      g.userData.territorio = id; raiz.add(g); pazes[id] = g;
      if (animar && !REDUZ) { const fim = g.position.clone(); g.position.y += 8; anim(g.position, { y: fim.y, duration: .7, ease: 'back.out(1.4)' }); }
    } else if (!ligado && pazes[id]) { raiz.remove(pazes[id]); delete pazes[id]; }
    pintarTerritorio(t);
  }

  // ============================== CONSTRUÇÕES (guia §6.10): a ação vira objeto de peças, montado peça por peça ==============================
  const construcoes = [];      // { chave, carta, pid, territorio, x, z, grupo, ano, animadas, emissores }
  const feitas = new Map();    // chave → quantas já foram montadas
  let ultimoEstado = null;
  // Descritor de peça: { g, c ('eq' | 'sombra' | 'clara' | hex), p: [x, y, z], ry, rx, rz, s, mat, nome }
  const P = (g, c, x = 0, y = 0, z = 0, o = {}) => ({ g, c, p: [x, y, z], ...o });
  const B = PLACA;   // altura da placa-base: os objetos começam aqui
  // Peças de um modelo (ou o substituto de peças, sem dados/modelos.js)
  function MD(id, x = 0, y = B, z = 0, o = {}) {
    const md = modelos[id], s = o.s ?? 1;
    if (!md) {
      const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), o.ry || 0);
      return (RESERVAS[id] || (() => [P(tijolo(2, 2), C.cinzaClaro)]))().map(pp => {
        const d = new THREE.Vector3(...pp.p).multiplyScalar(s).applyQuaternion(qy), sp = pp.s || 1;
        return { ...pp, p: [x + d.x, y + d.y, z + d.z], s: Array.isArray(sp) ? sp.map(v => v * s) : sp * s, ry: (pp.ry || 0) + (o.ry || 0),
          ...(pp.pivo ? { pivoQuat: qy.clone().multiply(pp.pivoQuat || new THREE.Quaternion()), pivoEscala: new THREE.Vector3(s, s, s) } : {}) };
      });
    }
    const lista = [{ g: geoModelo(id, o.tinta || C.cinzaClaro), c: null, p: [x, y, z], ry: o.ry || 0, s, modelo: true }];
    const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), o.ry || 0);
    md.partes.filter(p => p.nome).forEach(p => {
      const d = p.pivo.pos.clone().multiplyScalar(s).applyQuaternion(qy);
      lista.push({ g: p.geo, c: null, modelo: true, nome: p.nome, p: [x + d.x, y + d.y, z + d.z], pivo: true, pivoQuat: qy.clone().multiply(p.pivo.quat), pivoEscala: p.pivo.escala.clone().multiplyScalar(s) });
    });
    return lista;
  }
  // Substitutos simples (peças) dos modelos usados nas construções
  const RESERVAS = {
    'turbina-eolica': () => [P(barra(.18, 3.6), '#F4F6FA'), P(caixa(.5, .5, .7), '#F4F6FA', 0, 3.5, 0), P(geoCache('helice-reserva', () => limpar(new THREE.BoxGeometry(.18, 2.6, .12))), '#F4F6FA', 0, 3.75, .4, { nome: 'helice', pivo: true, pivoQuat: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2) })],
    'painel-solar': () => [P(barra(.1, .5), C.cinzaEscuro), P(caixa(1.8, .12, 1.2), '#2F5FB8', 0, .5, 0, { rx: -.4 })],
    fabrica: () => [P(tijolo(3, 2, 1.6), C.cinzaClaro), P(telha(3, 2, .6), C.cinzaEscuro, 0, 1.6), P(barra(.3, 2.2), C.cinzaEscuro, 1, 1.6, -.4)],
    'usina-nuclear': () => [P(cone(1, .7, 2.2, 20), C.cinzaClaro, -1, 0), P(cone(1, .7, 2.2, 20), C.cinzaClaro, 1, 0), P(esfera(.8), '#E3E9F4', 0, .4, .9)],
    'bomba-petroleo': () => [P(caixa(.6, 1.2, .6), C.pecaPreta), P(geoCache('balancim-reserva', () => limpar(new THREE.BoxGeometry(2.2, .25, .3))), C.laranja, 0, 1.25, 0, { nome: 'balancim', pivo: true, pivoQuat: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2) })],
    'plataforma-petroleo': () => [P(tijolo(3, 3, .6), C.amarelo, 0, 1.4), P(barra(.15, 1.4), C.cinzaEscuro, -1, 0, -1), P(barra(.15, 1.4), C.cinzaEscuro, 1, 0, 1), P(barra(.12, 2), '#E8562F', 1, 2, -1)],
    'tanque-combustivel': () => [P(redonda(.9, 1, false), '#F4F6FA'), P(redonda(.9, .2, false), C.amarelo, 0, .5)],
    'navio-cargueiro': () => [P(caixa(1.4, .6, 3.6, .2), '#E8562F'), P(tijolo(1, 2, .5), C.amarelo, 0, .6, .4)],
    'navio-granel': () => [P(caixa(1.4, .6, 3.6, .2), '#3657C2'), P(tijolo(1, 1, .5), '#FFFFFF', 0, .6, -1)],
    'conteiner-vermelho': () => [P(caixa(.8, .6, 1.6), '#E8562F')], 'conteiner-azul': () => [P(caixa(.8, .6, 1.6), '#3657C2')], 'conteiner-verde': () => [P(caixa(.8, .6, 1.6), '#3FAE5A')],
    'guindaste-porto': () => [P(barra(.15, 3.4), C.laranja, -.6, 0, -.6), P(barra(.15, 3.4), C.laranja, .6, 0, -.6), P(caixa(.4, .3, 3.6), C.laranja, 0, 3.4, .5)],
    escavadeira: () => [P(caixa(1.2, .7, 1.6, .15), C.amarelo, 0, .3), P(caixa(1.2, .2, .4), C.cinzaEscuro, 0, .2, 1)],
    jazida: () => [P(caixa(1.6, .8, 1.2, .3), '#8B6A50'), P(cone(.3, .02, .7, 6), '#9B6BFF', .2, .7, 0)],
    escola: () => [P(tijolo(3, 2, 1.4), '#FFF4DC'), P(telha(3, 2, .7), '#E8562F', 0, 1.4)],
    hospital: () => [P(tijolo(3, 2, 1.8), '#F4F6FA'), P(caixa(.8, .8, .1), '#3657C2', 0, 1, 1.02)],
    'predio-governo': () => [P(tijolo(3, 2, .4), '#F4F6FA'), ...[-1, 0, 1].map(x => P(barra(.18, 1.4), '#F4F6FA', x, .4, .7)), P(caixa(3, .4, 2), '#F4F6FA', 0, 1.8), P(esfera(.6), '#3FAE5A', 0, 2.2)],
    ambulancia: () => [P(caixa(1, 1, 2, .15), '#FFFFFF', 0, .2)], 'caminhao-ajuda': () => [P(caixa(1, 1, 2, .15), '#FFFFFF', 0, .2)],
    tenda: () => [P(telha(1.6, 1.6, 1.1), '#7FC4F0', 0, 0, -.35), P(telha(1.6, 1.6, 1.1), '#7FC4F0', 0, 0, .35, { ry: Math.PI })],
    caixa: () => [P(caixa(.8, .8, .8), C.madeira)], 'carga-ajuda': () => [P(placa(2, 2), C.madeira), P(caixa(.8, .8, .8), C.madeira, -.4, .4), P(caixa(.8, .8, .8), C.madeira, .4, .4)],
    barreira: () => [P(caixa(1.7, .9, .5, .15), '#E8ECF2')], muro: () => [P(tijolo(2, 1, 1.6), C.cinzaClaro)],
    foguete: () => [P(barra(.5, 2.6), '#FFFFFF'), P(cone(.5, .02, 1, 16), '#E8562F', 0, 2.6)], satelite: () => [P(caixa(.6, .6, .6), C.amarelo), P(caixa(2.2, .05, .5), '#2F5FB8')],
    moeda: () => [P(redonda(.6, .2, false), C.ouro, 0, 0, 0, { rx: Math.PI / 2 })], pomba: () => [P(caixa(.6, .5, 1.2, .2), '#FFFFFF')],
    'arvore-folhosa': () => [P(barra(.18, .8), C.madeira), P(caixa(1.1, .9, 1.1, .2), '#3FAE5A', 0, .7)], palmeira: () => [P(barra(.13, 1.9), C.madeira), P(caixa(1.4, .2, .4, .08), '#3FAE5A', 0, 1.9)],
    'torre-resfriamento': () => [P(cone(1, .7, 2.2, 20), C.cinzaClaro)], termeletrica: () => [P(tijolo(3, 2, 1.4), C.cinzaClaro)], cacto: () => [P(barra(.2, 1.3), '#3E9E5A')],
  };
  // ---------- Peças compostas (feitas aqui, no mesmo estilo) ----------
  const cerca = (n, c, raio = 1.75) => { const l = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; l.push(P(redonda(.22, .42, true, 12), c, Math.cos(a) * raio, B, Math.sin(a) * raio)); } return l; };
  const janelas = (w, h, x, y, z, ry = 0) => P(new THREE.PlaneGeometry(w, h), null, x, y, z, { mat: matImpresso(texSimbolo('janela', null), .15), ry });
  const placaComSimbolo = (simbolo, fundo, x, y, z, s = 1) => [P(caixa(1.1 * s, 1.1 * s, .16), fundo, x, y, z), P(new THREE.PlaneGeometry(.95 * s, .95 * s), null, x, y + .55 * s, z + .085, { mat: matImpresso(texSimbolo(simbolo, fundo)) })];
  const cadeado = (x, y, z, s = 1) => [P(caixa(1 * s, .8 * s, .5 * s, .1), '#C9CED8', x, y, z), P(toro(.32 * s, .1 * s, Math.PI, 16), '#8E9BB0', x, y + .8 * s, z), P(caixa(.18 * s, .3 * s, .1), C.tinta, x, y + .25 * s, z + .26 * s)];
  const arvore = (x, z, s = 1) => MD('arvore-folhosa', x, B, z, { s });
  // Tabela ação → objeto (guia §6.10). onde: 'alvo' | 'casa' | 'casaAlvo' (casa da potência-alvo) | 'casas' (as duas) | 'floresta' | 'vulneraveis' | 'nada'
  const RECEITAS = {
    missao_diplomatica: { onde: 'alvo', pecas: c => [...MD('predio-governo', .15, B, -.25, { s: .86, tinta: eq(c.pid).cor }), P(placa(2, 1), C.creme, .15, B, 1.45)], extra: c => aviaoDaCasa(c) },
    cooperacao_sul_sul: { onde: 'alvo', pecas: () => [...MD('escola', .1, B, -.6, { s: 1 }), ...MD('carga-ajuda', 1.05, B, 1.05, { s: .7 }), P(placa(1, 2), '#8CCB5E', -.9, B, 1.1)], extra: c => aviaoDaCasa(c) },
    propor_resolucao: { onde: 'nada', extra: () => efeito('onu') },
    sancoes: { onde: 'casaAlvo', pecas: () => [...[-1.25, 0, 1.25].map(x => MD('barreira', x, B, 1.1, { s: .7 })).flat(), ...cadeado(.2, B, -.5, 1.7)], extra: c => arcoSancao(c) },
    alianca: { onde: 'casas', pecas: c => [P(redonda(1.2, .5, true, 24), C.creme, 0, B), P(toro(.75, .16, Math.PI * 2, 32), eq(c.pid).cor, -.42, B + 1.6, 0, { rx: 0, ry: .4 }), P(toro(.75, .16, Math.PI * 2, 32), eq(c.alvo).cor, .42, B + 1.6, 0, { rx: Math.PI / 2, ry: .4 }), P(barra(.12, 1.2), C.mastro, 0, B + .5, 0)], extra: c => Promise.all([arcoAlianca(c), aviaoDaCasa(c)]) },
    cupula_regional: { onde: 'casa', pecas: c => [P(redonda(1.4, .5, false, 32), C.creme, 0, B), P(redonda(1.15, .1, true, 32), '#FFFFFF', 0, B + .5), ...vizinhosCores(c).map((hex, i, a) => { const ang = i / a.length * Math.PI * 2; return P(tijolo(1, 1, .7), hex, Math.cos(ang) * 1.65, B, Math.sin(ang) * 1.65, { ry: -ang }); })], extra: c => avioesVizinhos(c) },
    livre_comercio: { onde: 'alvo', tipo: 'costa', pecas: () => [P(ladrilho(4, 1.4, .1), OCEANO[1], 0, B, 1.2), ...MD('navio-cargueiro', 0, B + .05, 1.25, { s: .55, ry: Math.PI / 2 }), ...MD('conteiner-vermelho', -1.2, B, -.9, { s: .9 }), ...MD('conteiner-azul', -.35, B, -.9, { s: .9 }), ...MD('conteiner-verde', -.8, B + .56, -.9, { s: .9 }), ...MD('conteiner-azul', .9, B, -.6, { s: .9, ry: Math.PI / 2 })], extra: c => aviaoDaCasa(c) },
    tarifas: { onde: 'casa', tipo: 'costa', pecas: () => [...MD('barreira', -.6, B, .9, { s: .7 }), ...MD('barreira', .6, B, .9, { s: .7 }), ...MD('conteiner-vermelho', -.8, B, -.7, { s: .9 }), ...MD('conteiner-verde', .4, B, -.7, { s: .9 }), ...MD('conteiner-azul', -.2, B + .56, -.7, { s: .9 }), ...placaComSimbolo('%', C.vermelho, 1.4, B, .3, .7)] },
    infraestrutura_exterior: { onde: 'alvo', pecas: () => [...MD('guindaste-porto', .6, B, 0, { s: .62, ry: -Math.PI / 2 }), P(placa(4, 1), C.cinzaEscuro, 0, B, 1.5), ...[-1.5, -.5, .5, 1.5].map(x => P(caixa(.2, .12, .9), C.madeira, x, B + .4, 1.5)), ...MD('conteiner-vermelho', -1.2, B, -.8, { s: .85 })] },
    exportar_commodities: { onde: 'casa', tipo: 'costa', pecas: () => [P(ladrilho(4, 1.6, .1), OCEANO[1], 0, B, 1.1), ...MD('navio-granel', 0, B + .05, 1.15, { s: .55, ry: Math.PI / 2 }), P(redonda(.55, 1.8, false, 16), '#E8DCC0', -1.1, B, -.8), P(cone(.6, .05, .5, 16), '#C9B79A', -1.1, B + 1.8, -.8), P(redonda(.55, 1.4, false, 16), '#E8DCC0', 0, B, -.9), P(cone(.6, .05, .5, 16), '#C9B79A', 0, B + 1.4, -.9)] },
    politica_industrial: { onde: 'casa', pecas: () => [...MD('fabrica', 0, B, -.1, { s: .92 })], fumacaDe: ['fabrica', 0, B, -.1, .92] },
    termeletrica: { onde: 'casa', pecas: () => [...MD('termeletrica', 0, B, 0, { s: .95, ry: Math.PI / 2 })], fumacaDe: ['termeletrica', 0, B, 0, .95, Math.PI / 2], fixa: true },
    transnacionais: { onde: 'casa', pecas: () => [P(tijolo(3, 3, 1.2), '#E3E9F4', 0, B), P(tijolo(3, 3, 1.2), '#C9D3E6', 0, B + 1.2), P(tijolo(3, 3, 1.2), '#E3E9F4', 0, B + 2.4), P(tijolo(3, 3, 1.2), '#C9D3E6', 0, B + 3.6), P(placa(3, 3), 'eq', 0, B + 4.8), ...[.9, 2.1, 3.3, 4.5].flatMap(y => [janelas(2.4, .7, 0, B + y - .25, 1.52), janelas(2.4, .7, 1.52, B + y - .25, 0, Math.PI / 2)]), P(barra(.06, 1), C.cinzaEscuro, .9, B + 5.2, .9)] },
    emprestimo: { onde: 'alvo', pecas: () => [...MD('predio-governo', -.4, B, -.5, { s: .7, tinta: C.cinzaClaro }), ...[0, 1, 2, 3].map(i => P(redonda(.45, .2, false, 18), C.ouro, 1.2, B + i * .21, .9, { mat: matOuro })), ...[0, 1].map(i => P(redonda(.45, .2, false, 18), C.ouro, .4, B + i * .21, 1.3, { mat: matOuro }))] },
    energia_renovavel: { onde: 'casa', pecas: () => [...MD('turbina-eolica', -1.1, B, -.6, { s: .85 }), ...MD('turbina-eolica', .3, B, -1.1, { s: .75 }), ...MD('painel-solar', .8, B, .9, { s: .75, ry: -.3 })] },
    explorar_petroleo: { onde: 'casa', tipo: 'costa', pecas: c => (c.naCosta ? [P(ladrilho(4, 4, .1), OCEANO[1], 0, B), ...MD('plataforma-petroleo', 0, B, 0, { s: .82 })] : [...MD('bomba-petroleo', -.3, B, -.4, { s: .95 }), ...MD('tanque-combustivel', 1, B, .9, { s: .75 })]) },
    desmatamento_zero: { onde: 'casa', tipo: 'floresta', pecas: () => [...arvore(-.75, -.6, 1.15), ...arvore(.75, -.75, 1), ...arvore(-.05, .7, 1.2), ...arvore(.95, .7, .85), ...cerca(14, '#3FAE5A')] },
    florestas_tropicais: { onde: 'floresta3', pecas: () => [...arvore(-.7, -.5, 1.15), ...arvore(.75, -.2, 1), ...MD('palmeira', -.3, B, .9, { s: .9 }), ...MD('moeda', .8, B + .75, 1.1, { s: .55 })], extra: c => moedasVoando(c) },
    fronteira_agricola: { onde: 'casa', tipo: 'floresta', pecas: () => [...[-1.5, -.5, .5, 1.5].map((x, i) => P(placa(1, 4), i % 2 ? '#F5D36B' : '#8CCB5E', x, B)), ...MD('escavadeira', .4, B + .4, .2, { s: .7, ry: -.6 })], derruba: true },
    fundo_climatico: { onde: 'vulneraveis', pecas: () => [...MD('painel-solar', -.35, B, -.2, { s: 1.05, ry: -.25 }), ...placaComSimbolo('coracao', '#FFCAE6', 1.2, B, 1.15, .85)], extra: c => moedasVoando(c) },
    meta_climatica: { onde: 'casa', pecas: () => [P(barra(.15, 2.4), C.mastro, 0, B), ...[1.25, .95, .65, .35].map((r, i) => P(redonda(r, .12, false, 32), ['#FFFFFF', C.vermelho, '#FFFFFF', C.vermelho][i], 0, B + 2.6, .06 + i * .07, { rx: Math.PI / 2 })), P(barra(.06, 1.1), C.madeira, .25, B + 2.9, .9, { rx: -1.2 })] },
    minerais_criticos: { onde: 'alvo', pecas: () => [...MD('jazida', -.35, B, -.45, { s: 1.35 }), ...MD('escavadeira', 1, B, .95, { s: .8, ry: -2.4 })] },
    nuclear: { onde: 'casa', pecas: () => [...MD('usina-nuclear', 0, B, 0, { s: .86 })], fumacaDe: ['usina-nuclear', 0, B, 0, .86], fumacaCor: '#FFFFFF' },
    adaptacao: { onde: 'casa', tipo: 'costa', pecas: () => [...[-1.5, -.5, .5, 1.5].map(x => P(tijolo(1, 1, 1.2), '#8FA3BF', x, B, 1.4)), ...[-1, 0, 1].map(x => P(tijolo(1, 1, .4), '#B7C6DA', x, B + 1.2, 1.4)), P(barra(.1, 1.6), C.cinzaEscuro, -.9, B, -.6), P(barra(.1, 1.6), C.cinzaEscuro, -.3, B, -.6), P(redonda(.6, .9, true, 18), '#7FC4F0', -.6, B + 1.6, -.6)] },
    defesa: { onde: 'casa', pecas: () => radar() },
    ciberdefesa: { onde: 'casa', pecas: () => [P(tijolo(2, 1, 2.2), C.pecaPreta, -.5, B, -.3), P(tijolo(1, 1, 1.6), C.pecaPreta, 1.1, B, -.3), ...[.5, 1, 1.5].flatMap(y => [P(caixa(1.5, .1, .05), '#3CD46A', -.5, B + y, .22, { mat: brilhante('#3CD46A', .8) }), P(caixa(.6, .1, .05), '#3CD46A', 1.1, B + y * .7, .22, { mat: brilhante('#3CD46A', .8) })]), ...cadeado(.3, B, 1.2, .9)] },
    mediacao: { onde: 'alvo', pecas: () => [P(redonda(.9, .4, false, 24), C.creme, 0, B + .6), P(barra(.15, .6), C.madeira, 0, B), P(tijolo(1, 1, .7), '#DCCFFF', -1.5, B), P(tijolo(1, 1, .7), '#DCCFFF', 1.5, B), ...MD('pomba', .1, B + 1.05, 0, { s: .95, ry: .5 })] },
    reconstrucao: { onde: 'alvo', pecas: () => [...MD('guindaste-porto', -.9, B, -.2, { s: .45, ry: -Math.PI / 2 }), ...casinha(.8, -.6), ...casinha(.9, 1, '#7FC4F0')] },
    base_militar: { onde: 'alvo', pecas: c => [...cerca(14, C.cinzaClaro), P(hangar(), '#A0A5A9', 0, B, -.35), P(caixa(1.1, .9, .08, .03), C.cinzaEscuro, 0, B, .99), P(ladrilho(2, 1, .1), C.amarelo, 0, B, 1.35)] },
    crime_transnacional: { onde: 'casa', tipo: 'fronteira', pecas: () => [P(tijolo(2, 2, 1.6), '#E3E9F4', -.9, B, -.6), P(placa(2, 2), '#3657C2', -.9, B + 1.6, -.6), janelas(1.6, .6, -.9, B + 1, .42), P(caixa(.4, 1.1, .4), C.cinzaEscuro, -.1, B, .9), ...[0, 1, 2, 3, 4].map(i => P(caixa(.42, .2, .2), i % 2 ? '#FFFFFF' : C.vermelho, .3 + i * .42, B + .9, .9)), P(caixa(.3, .5, .3), C.cinzaEscuro, 1.95, B, .9)] },
    desarmamento: { onde: 'casa', pecas: () => [...[[-.6, -.3], [.3, .2], [-.1, .9], [.7, -.6]].map(([x, z], i) => P(tijolo(1, 1, .5), i % 2 ? C.cinzaClaro : '#E3E9F4', x, B, z, { ry: i * .7 })), ...MD('pomba', .5, B + .55, .2, { s: .7, ry: -.5 })], antes: c => desmontarRadar(c) },
    acolher_refugiados: { onde: 'casa', pecas: () => [...MD('tenda', -.85, B, -.55, { s: .95 }), ...MD('tenda', .95, B, -.75, { s: .9, ry: -.2 }), ...placaComSimbolo('coracao', '#FFCAE6', -.85, B + 1.35, .25, .6), ...MD('caixa', 1, B, .9, { s: .7 }), P(placa(2, 1), '#8CCB5E', -.6, B, 1.2), P(cone(.18, .02, .4, 8), '#3FAE5A', -1, B + .4, 1.2), P(cone(.18, .02, .4, 8), '#3FAE5A', -.3, B + .4, 1.2), P(barra(.06, .9), C.madeira, 0, B, -1.4), P(esfera(.18), C.amarelo, 0, B + 1, -1.4, { mat: brilhante(C.amarelo, 1) })] },
    ajuda_humanitaria: { onde: 'alvo', pecas: () => [...MD('caminhao-ajuda', -.55, B, .15, { s: 1.15, ry: .4 }), ...MD('carga-ajuda', 1.05, B, -.7, { s: .75 }), ...placaComSimbolo('coracao', '#FFCAE6', 1.3, B, 1.2, .5)] },
    educacao: { onde: 'casa', pecas: () => [...MD('escola', 0, B, -.45, { s: 1.12 }), P(placa(2, 1), '#8CCB5E', -.9, B, 1.2), P(barra(.07, 1.3), C.mastro, 1.2, B, 1.2), P(placa(1, 1), C.amarelo, 1.2, B + 1.3, 1.2)] },
    saude: { onde: 'casa', pecas: () => [...MD('hospital', -.1, B, -.55, { s: 1.05 }), ...MD('ambulancia', .9, B, 1.15, { s: .75, ry: Math.PI / 2 })] },
    combate_fome: { onde: 'casa', pecas: () => [P(tijolo(3, 2, .9), C.madeira, 0, B, 0), ...[-1.1, -.37, .37, 1.1].map((x, i) => P(telha(1, 2, .5), i % 2 ? '#FFFFFF' : C.vermelho, x, B + 1.9, 0)), P(barra(.08, 1.9), C.madeira, -1.4, B, .9), P(barra(.08, 1.9), C.madeira, 1.4, B, .9), ...[[-.9, '#FF8A1F'], [0, '#8CCB5E'], [.9, '#F5D36B']].map(([x, c]) => P(caixa(.7, .35, .6), c, x, B + .9, .3)), ...MD('caixa', 1.5, B, 1.4, { s: .55 })] },
    povos_originarios: { onde: 'casa', tipo: 'floresta', pecas: () => [P(barra(.12, 1.6), C.madeira, -.2, B, .6), P(caixa(1.4, .8, .12), '#D9A066', -.2, B + 1.2, .66), ...arvore(-1, -.7, .9), ...arvore(.9, -.6, .8), ...cerca(12, '#3FAE5A')] },
    fechar_fronteiras: { onde: 'casa', tipo: 'fronteira', pecas: () => [-1.3, 0, 1.3].flatMap(x => MD('muro', x, B, 0, { s: .74 })) },
    pesquisa: { onde: 'casa', pecas: () => [P(tijolo(3, 2, 1.6), '#F4F6FA', -.3, B, -.3), janelas(2.4, .6, -.3, B + .9, .72), P(redonda(.9, .3, false, 24), '#E3E9F4', -.3, B + 1.6, -.3), P(esfera(.85, 24, 12), '#DCE6F7', -.3, B + 1.9, -.3, { s: [1, .8, 1] }), P(caixa(.42, .5, .7, .04), '#2E2752', -.3, B + 2.15, .35, { rx: -.55 }), P(barra(.1, .8), C.cinzaEscuro, 1.3, B, .9), P(esfera(.25), '#9B6BFF', 1.3, B + .9, .9, { mat: brilhante('#9B6BFF', .5) })] },
    combate_desinformacao: { onde: 'casa', pecas: () => [P(tijolo(2, 2, .4), C.cinzaClaro, -.6, B, -.5), ...[0, 1, 2, 3, 4].map(i => P(caixa(.62 - i * .08, .7, .62 - i * .08, .06), i % 2 ? '#FFFFFF' : C.vermelho, -.6, B + .4 + i * .7, -.5)), P(barra(.05, .6), C.cinzaEscuro, -.6, B + 3.9, -.5), P(esfera(.16), C.vermelho, -.6, B + 4.55, -.5, { mat: brilhante(C.vermelho, .7) }), ...antena(-.25, B + 2.1, -.25, .55, 1.2), ...antena(-.95, B + 1.4, -.25, .5, 1.2), ...placaComSimbolo('check', C.verdeOk, .9, B, .75, 1.3)] },
    programa_espacial: { onde: 'casa', pecas: () => [P(redonda(1.5, .3, true, 28), C.cinzaClaro, 0, B), P(caixa(.34, 3.4, .34), C.laranja, -1.15, B + .3, 0), ...[1, 2, 3].map(y => P(caixa(.7, .1, .1), C.laranja, -.75, B + .3 + y, 0)), ...MD('foguete', .1, B + .3, 0, { s: .85 })], extra: c => lancarFoguete(c) },
    soft_power: { onde: 'alvos', pecas: () => [P(tijolo(4, 2, .6), C.madeira, 0, B, -.5), P(caixa(2.6, 1.6, .2), C.pecaPreta, 0, B + .6, -1.3), P(new THREE.PlaneGeometry(2.3, 1.3), null, 0, B + 1.4, -1.19, { mat: brilhante('#99CDF8', .6) }), P(barra(.08, 2.6), C.cinzaEscuro, -1.8, B, -1.3), P(barra(.08, 2.6), C.cinzaEscuro, 1.8, B, -1.3), P(caixa(4, .2, .2), C.cinzaEscuro, 0, B + 2.6, -1.3), ...[-1.2, 1.2].map(x => P(cone(.15, .3, .4, 10), C.amarelo, x, B + 2.25, -1.1, { mat: brilhante(C.amarelo, .8) })), ...MD('estrela', 0, B + 3, -1.3, { s: .55 })] },
    internet_para_todos: { onde: 'alvo', pecas: () => [P(tijolo(1, 1, .4), C.cinzaClaro, .4, B, -.6), P(barra(.1, 2), C.cinzaClaro, .4, B + .4, -.6), ...antena(.4, B + 2.3, -.6, .95, 1.1), P(tijolo(2, 1, 1), C.pecaPreta, -.9, B, -.5), ...[.3, .6].map(y => P(caixa(1.5, .08, .05), '#3CD46A', -.9, B + y, .02, { mat: brilhante('#3CD46A', .8) })), P(toro(.5, .14, Math.PI * 2, 24), C.amarelo, .6, B + .14, 1, { rx: Math.PI / 2 }), P(toro(.32, .14, Math.PI * 2, 20), C.amarelo, .6, B + .4, 1, { rx: Math.PI / 2 })], extra: c => caboSubmarino(c) },
    // diplomacia entre potências (alvo = id de outra potência): mesa com as duas cores, papel e moedas, tendas, escuta, cadeado
    cupula_bilateral: { onde: 'casas', pecas: c => [P(redonda(.9, .4, false, 24), C.creme, 0, B + .6), P(barra(.15, .6), C.madeira, 0, B), P(tijolo(1, 1, .7), eq(c.pid).cor, -1.5, B), P(tijolo(1, 1, .7), eq(c.alvo).cor, 1.5, B), ...MD('pomba', .1, B + 1.05, 0, { s: .8, ry: .5 })] },
    acordo_bilateral: { onde: 'casas', pecas: c => [P(tijolo(3, 2, .6), C.creme, 0, B, 0), P(placa(2, 1.4), '#FFFFFF', -.4, B + .6, 0), P(barra(.06, .9), eq(c.pid).cor, .8, B + .6, .1), ...[0, 1, 2].map(i => P(redonda(.4, .2, false, 16), C.ouro, 1.1, B + .6 + i * .21, -.5, { mat: matOuro }))] },
    exercicio_conjunto: { onde: 'casas', pecas: c => [...cerca(12, C.cinzaClaro), ...MD('tenda', -.8, B, -.3, { s: .85 }), P(tijolo(1, 1, .8), eq(c.pid).cor, 1, B, -.6), P(tijolo(1, 1, .8), eq(c.alvo).cor, 1, B, .7), P(ladrilho(2, 1, .1), C.amarelo, -.6, B, 1.35)] },
    espionagem: { onde: 'casa', pecas: () => [P(tijolo(2, 1, 1), C.pecaPreta, -.9, B, -.4), ...antena(.5, B + 1.9, -.4, .95, 1.1), P(barra(.1, 1.5), C.cinzaClaro, .5, B, -.4), P(caixa(1.2, .1, .05), '#3CD46A', -.9, B + .6, .12, { mat: brilhante('#3CD46A', .8) })] },
    embargo_tecnologico: { onde: 'casaAlvo', pecas: () => [...[-1.25, 0, 1.25].map(x => MD('barreira', x, B, 1.1, { s: .7 })).flat(), ...cadeado(.2, B, -.5, 1.4), P(tijolo(1, 1, .7), C.pecaPreta, -1.3, B, -.6)], extra: c => arcoSancao(c) },
  };
  // Hangar em arco: meia-casca com fundo fechado, deitada (sem armas)
  const hangar = () => geoCache('hangar', () => { const g = new THREE.CylinderGeometry(1.15, 1.15, 2.6, 20, 1, false, -Math.PI / 2, Math.PI); g.rotateX(-Math.PI / 2); return limpar(g); });
  // Prato de antena (tigela rasa, aberta para +z depois de girar) com braço e receptor
  const prato = () => geoCache('prato', () => { const pts = []; for (let i = 0; i <= 8; i++) { const r = i / 8; pts.push(new THREE.Vector2(r * .95, r * r * .38)); } pts.push(new THREE.Vector2(.95, .44), new THREE.Vector2(0, .1)); return limpar(new THREE.LatheGeometry(pts, 20)); });
  const antena = (x, y, z, s = 1, rx = 1.05) => [P(prato(), '#F4F6FA', x, y, z, { rx, s }), P(barra(.05, .62 * s), C.cinzaEscuro, x, y + .06 * s, z + .1 * s, { rx }), P(esfera(.1 * s, 10, 8), C.amarelo, x, y + .3 * s, z + .58 * s)];
  const casinha = (x, z, telhado = '#E8562F') => [P(tijolo(1, 1, .8), '#FFF4DC', x, B, z), P(telha(1, 1, .5), telhado, x, B + .8, z)];
  const radar = () => [P(tijolo(2, 2, .6), C.cinzaClaro, 0, B), P(caixa(.9, 2.4, .9, .1), C.cinzaClaro, 0, B + .6), P(redonda(.5, .3, false, 16), C.cinzaEscuro, 0, B + 3), P(pratoRadar(), '#FFFFFF', 0, B + 3.3, 0, { nome: 'radar', pivo: true })];
  const pratoRadar = () => geoCache('prato-radar', () => { const g = juntar([[prato(), 0, 0, 0, 0, 1.25]]); g.rotateX(1.05); g.translate(0, .9, 0); return THREE.mergeGeometries([g, juntar([[barra(.12, .9)]]), juntar([[barra(.05, .8), 0, .95, .2]]).rotateX(1.05)]); });
  function vizinhosCores(c) { const vz = (M.vizinhos[c.pid] || []).slice(0, 6); while (vz.length < 6) vz.push(null); return vz.map(v => (v && ultimoEstado?.territorios?.[v]?.parceiro ? eq(ultimoEstado.territorios[v].parceiro).cor : v ? (CONTINENTES[CONT[v]] || CONTINENTES.po)[1] : C.creme)); }

  // ---------- Lugar e vaga (anel ao redor da âncora, longe das torres e do boneco) ----------
  // Procura do mais exigente para o mais solto: território pequeno ou lotado ainda acha lugar (no mar ao lado, como um píer)
  function vagaEm(id, { tipo = null } = {}) {
    for (const nivel of [0, 1, 2]) { const v = procurarVaga(id, tipo, nivel); if (v) return v; }
    return null;
  }
  function procurarVaga(id, tipo, nivel) {
    const t = idx(id), [ax, az] = ancoraXZ(id), proprias = new Set(pinosDe[t]);
    const ocupadas = construcoes.filter(c => Math.hypot(c.x - ax, c.z - az) < 30).map(c => [c.x, c.z]);
    const raioMin = [5.6, 5, 4.4][nivel], dMax = [14, 18, 22][nivel], outrosMax = [1, 4, 16][nivel], cands = [];
    const [ac, ar] = ANC[id] || [0, 0], meiaFileira = Math.max(2, torres[id]?.lista.length || 0) * 1.15 + 4.2;
    for (let r = ar - dMax; r <= ar + dMax; r++) for (let c0 = ac - dMax; c0 <= ac + dMax; c0++) {
      if (r < 2 || r > LINS - 4 || c0 < 3 || c0 > COLS - 4) continue;
      const x = c0 - COLS / 2, z = r - LINS / 2;    // canto entre células: a placa 4×4 fica alinhada aos pinos
      const d = Math.hypot(x - ax, z - az);
      if (d < 3.4 || d > dMax) continue;
      if (Math.abs(x - ax) < meiaFileira && Math.abs(z - az) < 3.2) continue;   // fileira de torres e bandeira
      if (ehPotencia(id) && Math.hypot(x - ax - 3, z - az + 3.5) < 4.2) continue;              // boneco
      if (Math.abs(x - ax) < 3.5 && z - az > 0 && z - az < 5.4) continue;                       // rótulo e blocos de alerta
      let meus = 0, mar = 0, outros = 0, fora = 0;
      for (let dr = -2; dr < 2; dr++) for (let dc = -2; dc < 2; dc++) { const k = (r + dr) * COLS + c0 + dc, tt = terrDaCelula[k]; if (proprias.has(k)) meus++; else if (tt === -1) mar++; else if (tt === -2) fora++; else outros++; }
      if (fora || outros > outrosMax || meus < [Math.min(10, proprias.size * .45), Math.min(4, proprias.size * .3), 0][nivel]) continue;
      if (ocupadas.some(([ox, oz]) => Math.hypot(ox - x, oz - z) < raioMin)) continue;
      let custo = Math.abs(d - 5.5) + hash(r * COLS + c0) * .8 + mar * .2 + outros * .6 - meus * (nivel ? .3 : 0);
      if (tipo === 'costa') custo -= Math.min(4, mar) * .8;
      if (tipo === 'floresta' && id === 'brasil') custo += Math.max(0, z - az) * .5;
      if (tipo === 'fronteira') custo -= outros * 1.5 + (meus < 16 ? 1 : 0);
      cands.push([custo, x, z, mar]);
    }
    cands.sort((a, b) => a[0] - b[0]);
    const v = cands[0];
    return v ? { x: v[1], z: v[2], naCosta: v[3] >= 3 } : null;
  }
  // Território(s) onde a ação constrói
  function lugaresDe(rec, c) {
    const alvo = c.alvo, pid = c.potencia;
    switch (rec.onde) {
      case 'nada': return [];
      case 'casa': return [pid];
      case 'casaAlvo': return [ehPotencia(alvo) ? alvo : pid];
      case 'casas': return ehPotencia(alvo) && alvo !== pid ? [pid, alvo] : [pid];
      case 'alvos': return (Array.isArray(alvo) ? alvo : [alvo]).filter(a => idx(a) >= 0).slice(0, 3);
      case 'floresta3': return topo3(t => (t.floresta || 0), ['africa_central', 'sudeste_insular', 'andes']);
      case 'vulneraveis': return topo3(t => (t.vulnerabilidade || 0), ['pacifico', 'sahel', 'sul_asia']);
      default: return [Array.isArray(alvo) ? alvo[0] : alvo || pid].filter(a => idx(a) >= 0);
    }
  }
  function topo3(f, reserva) {
    const ts = ultimoEstado ? Object.values(ultimoEstado.territorios).filter(t => !t.protegido) : TERRS.map(t => ({ ...t }));
    const lista = ts.filter(t => f(t) > 0).sort((a, b) => f(b) - f(a)).slice(0, 3).map(t => t.id);
    return lista.length ? lista : reserva;
  }
  const chaveDe = c => `${c.carta}|${c.potencia}|${Array.isArray(c.alvo) ? c.alvo.join(',') : c.alvo || ''}|${c.ano ?? ''}`;

  function construir(c, { animar = true } = {}) {
    if (!c || !RECEITAS[c.carta]) return Promise.resolve();
    if (!renderer) return pronto.then(() => construir(c, { animar: false }));
    return acompanhar(modelosProntos.then(() => {
      const chave = chaveDe(c), noEstado = ultimoEstado ? ultimoEstado.construcoes.filter(x => chaveDe(x) === chave).length : Infinity;
      if (noEstado > 0 && (feitas.get(chave) || 0) >= noEstado) {     // já montada (ex.: atualizarMundo veio antes): só destaca
        const ja = construcoes.filter(x => x.chave === chave);
        return Promise.all(ja.map(x => (animar && !REDUZ ? anim(x.grupo.scale, { x: '*=1.12', y: '*=1.12', z: '*=1.12', duration: .12, yoyo: true, repeat: 1 }) : null)));
      }
      feitas.set(chave, (feitas.get(chave) || 0) + 1);
      const rec = RECEITAS[c.carta], lugares = lugaresDe(rec, c), prom = [];
      if (rec.antes) prom.push(rec.antes(c, animar));
      lugares.forEach((id, i) => prom.push(esperar(animar ? i * .35 : 0).then(() => montarEm(id, rec, c, chave, animar))));
      if (rec.extra && animar) prom.push(rec.extra(c, animar));
      else if (rec.extra && rec.persistente) rec.extra(c, false);
      return Promise.all(prom);
    }));
  }
  function montarEm(id, rec, c, chave, animar, vagaFixa = null) {
    const t = idx(id); if (t < 0) return Promise.resolve();
    const limite = ehPotencia(id) ? 5 : 3, minhas = construcoes.filter(x => x.territorio === id && !x.fixa);
    const sair = !vagaFixa && minhas.length >= limite ? desmontar(minhas[0], animar) : Promise.resolve();
    const vaga = vagaFixa || vagaEm(id, { tipo: rec.tipo });
    if (!vaga) return sair;
    const pid = c.potencia, ctx = { ...c, pid, alvo: c.alvo, naCosta: vaga.naCosta };
    const grupo = new THREE.Group(), [ax] = ancoraXZ(id);
    let terraSob = 0, alt = 0;
    for (const [dx, dz] of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) { const k = celulaEm(vaga.x + dx, vaga.z + dz); if (k >= 0 && terrDaCelula[k] >= 0) { terraSob++; alt = Math.max(alt, alturaBase[k]); } }
    grupo.position.set(vaga.x, terraSob >= 2 ? ALT_TERRA + Math.max(0, alt) : ALT_MAR, vaga.z);
    grupo.rotation.y = (vaga.x < ax ? .12 : -.12);    // postura viva: leve giro para o centro
    grupo.userData.territorio = id;
    liberarArea(vaga.x, vaga.z, 3);
    if (rec.derruba && id === 'brasil') { perdaFloresta.desmatamento = Math.min(.8, perdaFloresta.desmatamento + .1); aplicarFlorestas(animar); }
    const e = eq(pid);
    const pecas = [P(placa(4, 4), e.sombra, 0, 0, 0), ...bandeirinha(pid), ...rec.pecas(ctx)].map(pp => ({ ...pp, c: pp.c === 'eq' ? e.cor : pp.c === 'sombra' ? e.sombra : pp.c === 'clara' ? e.clara : pp.c }));
    const emissores = [];
    if (rec.fumacaDe) { const [m, ox, oy, oz, sc, ry = 0] = rec.fumacaDe; chamines(m).forEach(([x, y, z]) => { const c2 = Math.cos(ry), s2 = Math.sin(ry); emissores.push({ p: [ox + (x * c2 + z * s2) * sc, oy + y * sc, oz + (-x * s2 + z * c2) * sc], cor: rec.fumacaCor }); }); }
    const reg = { chave, carta: c.carta, pid, territorio: id, x: vaga.x, z: vaga.z, grupo, ano: c.ano, animadas: [], emissores, montando: true, fixa: !!rec.fixa };
    construcoes.push(reg);
    raiz.add(grupo);
    return sair.then(() => montarPecas(reg, pecas, animar)).then(() => { reg.montando = false; });
  }
  // Bandeirinha de 2 módulos com a forma da potência (canto de trás, à esquerda)
  function bandeirinha(pid) {
    const e = eq(pid);
    return [P(barra(.07, 2.1), C.mastro, -1.65, B, -1.65), P(esfera(.13, 10, 8), C.amarelo, -1.65, B + 2.15, -1.65),
      P(caixa(1, .7, .06, .02), e.cor, -1.13, B + 1.35, -1.65), P(new THREE.PlaneGeometry(.55, .55), null, -1.13, B + 1.7, -1.615, { mat: matImpresso(texForma(e.forma, e.cor)) })];
  }
  function malhaDaPeca(pp) {
    const mat = pp.mat || (pp.modelo ? (pp.tintaHex ? plastico(pp.tintaHex) : matVertice) : plastico(pp.c || C.cinzaClaro));
    const m = new THREE.Mesh(pp.g, mat);
    m.castShadow = true; m.receiveShadow = true;
    m.userData.peca = pp;
    if (pp.pivo) {   // parte animada: o grupo é o pivô; a malha gira no próprio eixo local
      const piv = new THREE.Group(); piv.position.set(...pp.p);
      if (pp.pivoQuat) piv.quaternion.copy(pp.pivoQuat); else piv.rotation.y = pp.ry || 0;
      if (pp.pivoEscala) m.scale.copy(pp.pivoEscala); else if (pp.s) Array.isArray(pp.s) ? m.scale.set(...pp.s) : m.scale.setScalar(pp.s);
      if (!pp.pivoQuat) m.rotation.x = pp.rx || 0;
      piv.add(m); piv.userData.peca = pp; return piv;
    }
    m.position.set(...pp.p);
    m.rotation.set(pp.rx || 0, pp.ry || 0, pp.rz || 0);
    if (pp.s) Array.isArray(pp.s) ? m.scale.set(...pp.s) : m.scale.setScalar(pp.s);
    return m;
  }
  // Monta peça por peça (guia §9.1): de baixo para cima e do centro para fora; cada peça vem de +2,5 com giro ±0,3 rad
  function montarPecas(reg, pecas, animar) {
    const objs = pecas.map(malhaDaPeca);
    objs.forEach(o => reg.grupo.add(o));
    reg.grupo.updateMatrixWorld(true);
    const fim = () => { assar(reg); loteEntrar(reg); poeira(reg.grupo.position.x, reg.grupo.position.y, reg.grupo.position.z, 2.4 * reg.grupo.scale.x); };
    if (!animar) { assar(reg); loteEntrar(reg); return Promise.resolve(); }
    if (REDUZ) {   // aparece inteiro com dissolve de 300 ms
      assar(reg);
      const mats2 = [];
      reg.grupo.traverse(o => { if (o.isMesh) { const m2 = o.material.clone(); m2.transparent = true; m2.opacity = 0; mats2.push([o, o.material, m2]); o.material = m2; } });
      return anim({ v: 0 }, { v: 1, duration: .3, onUpdate() { mats2.forEach(([, , m2]) => (m2.opacity = this.targets()[0].v)); } }).then(() => { mats2.forEach(([o, m1, m2]) => { o.material = m1; m2.dispose(); }); loteEntrar(reg); });
    }
    const ordem = objs.map((o, i) => [o, o.position.y + (o.parent === reg.grupo ? 0 : 0), Math.hypot(o.position.x, o.position.z), i]).sort((a, b) => (a[1] - b[1]) * 4 + (a[2] - b[2]) * .3);
    const n = ordem.length, passo = Math.min(.08, 1.2 / n);
    const tl = gsap.timeline({ paused: true });
    ordem.forEach(([o], i) => {
      const y = o.position.y, rx = o.rotation.x, rz = o.rotation.z;
      o.visible = false;
      tl.call(() => { o.visible = true; }, null, i * passo)
        .fromTo(o.position, { y: y + 2.5 }, { y, duration: .26, ease: 'back.out(1.6)' }, i * passo)
        .fromTo(o.rotation, { x: rx + (Math.random() - .5) * .6, z: rz + (Math.random() - .5) * .6 }, { x: rx, z: rz, duration: .26, ease: 'back.out(1.6)' }, i * passo)
        .call(() => som('tijolo', { tom: i === n - 1 ? -5 : Math.min(12, i) }), null, i * passo + .2);
    });
    const s0 = reg.grupo.scale.x;
    tl.to(reg.grupo.scale, { x: s0 * 1.08, y: s0 * 1.08, z: s0 * 1.08, duration: .1, ease: 'power2.out' }).to(reg.grupo.scale, { x: s0, y: s0, z: s0, duration: .1, ease: 'power2.in' });
    tl.timeScale(1 / VEL);
    return new Promise(ok => { tl.eventCallback('onComplete', () => { fim(); ok(); }); tl.play(); });
  }
  // Junta as peças paradas por material: as lisas e os modelos viram uma malha só com cor de vértice; as impressas e as que
  // brilham juntam-se com as do mesmo material (poucas chamadas de desenho por construção); partes animadas ficam à parte
  function assar(reg) {
    const g = reg.grupo, grupos = new Map(), comVolume = new Set();
    g.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
    for (const o of [...g.children]) {
      const pp = o.userData.peca;
      if (!pp || !o.isMesh || pp.nome) { if (pp?.nome) reg.animadas.push({ obj: o, nome: pp.nome }); continue; }
      let geo = semIndice(o.geometry).clone(), chave = pp.mat || matVertice;
      if (!pp.mat && (!pp.modelo || !geo.getAttribute('color') || pp.tintaHex)) { const c = corLinear(pp.c || C.cinzaClaro); c.offsetHSL(0, 0, (Math.random() - .5) * .03); pintarGeo(geo, c.r, c.g, c.b); }
      geo.applyMatrix4(m4.multiplyMatrices(inv, o.matrixWorld));
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave).push(geo);
      if (o.geometry.type !== 'PlaneGeometry') comVolume.add(chave);
      g.remove(o);
    }
    for (const [mat, geos] of grupos) {
      const nomes = Object.keys(geos[0].attributes).filter(n => geos.every(q => q.getAttribute(n)) && (mat === matVertice ? n !== 'uv' : n !== 'color'));
      geos.forEach(q => Object.keys(q.attributes).forEach(n => { if (!nomes.includes(n)) q.deleteAttribute(n); }));
      const malha = new THREE.Mesh(THREE.mergeGeometries(geos), mat);
      // impressões chapadas (janelas, símbolos, forma da bandeirinha) ficam coladas numa peça que já faz a mesma sombra:
      // sem elas no mapa de sombra, ~1 chamada de desenho a menos por construção
      malha.castShadow = !mat.transparent && comVolume.has(mat); malha.receiveShadow = true; malha.userData.assada = true;
      g.add(malha);
      geos.forEach(q => q.dispose());
    }
    reg.grupo.userData.territorio = reg.territorio;
  }
  // Lote (desempenho): as malhas assadas e opacas de TODAS as construções vão para uma BatchedMesh por material — uma chamada
  // de desenho por material no mapa inteiro (e na sombra), em vez de ~2,5 por construção (eram 130 construções no fim da
  // partida). A malha assada continua no grupo, invisível: o raio do mouse e o desmonte seguem iguais; a matriz de cada
  // construção é copiada para o lote a cada quadro desenhado (escala pela distância, destaque, encolher ao desmontar).
  const lotes = new Map(), noLote = new Set();
  function loteDe(malha) {
    const geo = malha.geometry, assinatura = Object.keys(geo.attributes).sort().map(n => n + geo.getAttribute(n).itemSize).join();
    const chave = malha.material.uuid + '|' + malha.castShadow + '|' + assinatura;
    let l = lotes.get(chave);
    if (!l) {
      l = new THREE.BatchedMesh(32, Math.max(8192, geo.getAttribute('position').count * 4), 0, malha.material);
      l.castShadow = malha.castShadow; l.receiveShadow = true;
      l.frustumCulled = l.perObjectFrustumCulled = l.sortObjects = false;   // poucas e quase sempre à vista: sem custo de CPU por quadro
      lotes.set(chave, l); raiz.add(l);
    }
    return l;
  }
  function loteEntrar(reg) {
    if (!THREE.BatchedMesh || reg.lote) return;
    reg.lote = [];
    reg.grupo.updateMatrix();
    for (const malha of reg.grupo.children) {
      if (!malha.userData.assada || malha.material.transparent) continue;
      const l = loteDe(malha), n = malha.geometry.getAttribute('position').count;
      if (l.unusedVertexCount < n) l.optimize();
      if (l.unusedVertexCount < n) l.setGeometrySize(Math.max(l.geometry.getAttribute('position').count * 2, l.geometry.getAttribute('position').count - l.unusedVertexCount + n), 0);
      if (l.instanceCount >= l.maxInstanceCount) l.setInstanceCount(l.maxInstanceCount * 2);
      const geoId = l.addGeometry(malha.geometry), inst = l.addInstance(geoId);
      l.setMatrixAt(inst, reg.grupo.matrix);
      malha.visible = false;
      reg.lote.push({ l, geoId, inst, m: reg.grupo.matrix.clone(), vis: true });
    }
    noLote.add(reg);
  }
  function loteSair(reg) {
    if (!reg.lote) return;
    for (const x of reg.lote) x.l.deleteGeometry(x.geoId);
    reg.lote = null; noLote.delete(reg);
  }
  // o grupo é filho da raiz (como o lote) e a malha assada não tem transformação própria: a matriz da instância é a do grupo
  const tiqueLote = { tique() {
    for (const reg of noLote) {
      const g = reg.grupo, vis = g.visible && !!g.parent;
      g.updateMatrix();
      for (const x of reg.lote) {
        if (vis !== x.vis) { x.l.setVisibleAt(x.inst, vis); x.vis = vis; }
        if (!g.matrix.equals(x.m)) { x.m.copy(g.matrix); x.l.setMatrixAt(x.inst, g.matrix); }
      }
    }
  } };
  function desmontar(reg, animar = true) {
    const i = construcoes.indexOf(reg); if (i < 0) return Promise.resolve();
    construcoes.splice(i, 1);
    const fim = () => { loteSair(reg); raiz.remove(reg.grupo); reg.grupo.traverse(o => { if (o.userData.assada) o.geometry.dispose(); }); };
    if (!animar || REDUZ) { fim(); return Promise.resolve(); }
    const { x, y, z } = reg.grupo.position, e = eq(reg.pid);
    som('pop');
    particulas.lancar({ x, y: y + 1, z, cor: [e.sombra, e.cor, C.cinzaClaro, C.creme], n: 14, escala: .6, sobe: [4, 6], lado: [1.5, 3], vida: .8 });
    return anim(reg.grupo.scale, { x: .01, y: .01, z: .01, duration: .6, ease: 'back.in(2)' }).then(fim);
  }
  // Animações contínuas das construções: hélices, balancim, radar e fumaça proporcional às emissões
  const tiqueConstrucoes = { tique(dt, t) {
    for (const c of construcoes) {
      for (const a of c.animadas) {
        if (REDUZ) continue;
        const m = a.obj.children[0];
        if (a.nome === 'helice') m.rotation.x += dt * 3;
        else if (a.nome === 'balancim') m.rotation.x = Math.sin(t * 2.2) * .35;
        else if (a.nome === 'radar') a.obj.rotation.y += dt * 1.2;
      }
      if (!REDUZ && c.emissores.length && !c.montando) {
        const taxa = emissoesFumaca[c.pid] ?? .8;
        for (const em of c.emissores) if (Math.random() < dt * (em.cor ? .9 : taxa)) {
          v3.set(...em.p).applyMatrix4(c.grupo.matrixWorld);
          fumaca.soltar({ x: v3.x, y: v3.y, z: v3.z, cor: em.cor || C.fumacaEmissao, tam: .55 * c.grupo.scale.x, sobe: 1.4, vida: 2 });
        }
      }
    }
  } };

  // Fumaça proporcional às emissões de cada potência (Gt de CO₂ por ano → bolinhas por segundo)
  const emissoesFumaca = {};
  function aplicarEmissoes(e) {
    for (const pid of PIDS) {
      const p = e.potencias?.[pid]; if (!p) continue;
      const gt = typeof Simulacao !== 'undefined' ? Simulacao.emissoesDe(p) : 3;
      emissoesFumaca[pid] = limitar(.15 + gt * .22, .15, 3);
    }
  }
  // ---------- Extras das ações: avião, arcos, moedas, foguete, cabo ----------
  function aviaoDaCasa(c) { const a = capital(c.potencia), b = capital(Array.isArray(c.alvo) ? c.alvo[0] : c.alvo); return idx(c.alvo) < 0 ? Promise.resolve() : voo(criarAviao(c.potencia), [a[0], a[1] + 1, a[2]], [b[0], b[1] + 1, b[2]], { altura: 8, duracao: 1.4 }); }
  function avioesVizinhos(c) { return Promise.all((M.vizinhos[c.potencia] || []).slice(0, 3).map((v, i) => esperar(i * .2).then(() => voo(criarAviao(c.potencia), capital(v), capital(c.potencia), { duracao: 1.2 })))); }
  const arcosFixos = {};   // alianças e sanções que ficam desenhadas (25% de opacidade)
  function arcoAlianca(c) {
    const chave = 'al:' + [c.potencia, c.alvo].sort().join('-');
    if (arcosFixos[chave] || !ehPotencia(c.alvo)) return Promise.resolve();
    const a = capital(c.potencia), b = capital(c.alvo), ar = arco(a, b, { cor: eq(c.potencia).cor, duplo: eq(c.alvo).cor, altura: 10, passo: 1.4, tam: .4, duracao: 1 });
    arcosFixos[chave] = ar;
    som('subir');
    return ar.pronto.then(() => esperar(2)).then(() => { ar.malha.material = new THREE.MeshStandardMaterial({ color: '#FFFFFF', transparent: true, opacity: .25, depthWrite: false, roughness: .3 }); });
  }
  function arcoSancao(c) {
    const chave = 'sa:' + c.potencia + '-' + c.alvo;
    if (arcosFixos[chave] || !ehPotencia(c.alvo)) return Promise.resolve();
    const a = capital(c.potencia), b = capital(c.alvo), ar = arco(a, b, { cor: C.tinta, altura: 8, passo: 2.2, tam: .34, duracao: .8 });
    arcosFixos[chave] = ar;
    const meio = ar.ponto(.5), cad = new THREE.Group();
    cadeado(0, 0, 0, 1.4).forEach(pp => cad.add(malhaDaPeca(pp)));
    cad.position.set(meio[0], meio[1] - .6, meio[2]); raiz.add(cad); ar.cadeado = cad;
    som('martelo');
    return ar.pronto.then(() => esperar(2)).then(() => { ar.malha.material = new THREE.MeshStandardMaterial({ color: C.tinta, transparent: true, opacity: .45, depthWrite: false }); });
  }
  function moedasVoando(c) {
    const a = capital(c.potencia), destinos = lugaresDe(RECEITAS[c.carta], c);
    som('moeda');
    return Promise.all(destinos.map((d, i) => esperar(i * .2).then(() => {
      const g = new THREE.Group(); MD('moeda', 0, 0, 0, { s: .8 }).forEach(pp => g.add(malhaDaPeca(pp)));
      g.tique = (dt) => (g.rotation.y += dt * 6); animados.add(g);
      return voo(g, [a[0], a[1] + 1.5, a[2]], capital(d), { altura: 9, duracao: 1.3, gira: false }).then(() => animados.delete(g));
    })));
  }
  const satelites = {};
  function lancarFoguete(c) {
    const reg = construcoes.filter(x => x.carta === 'programa_espacial' && x.pid === c.potencia).pop();
    const base = reg ? reg.grupo.position.clone() : new THREE.Vector3(...capital(c.potencia));
    const g = new THREE.Group(); MD('foguete', 0, 0, 0, { s: .9 }).forEach(pp => g.add(malhaDaPeca(pp)));
    g.position.copy(base).add(v3.set(0, .8, 0)); raiz.add(g);
    som('whoosh');
    const p = { u: 0 };
    return esperar(.6).then(() => anim(p, { u: 1, duration: REDUZ ? .3 : 3, ease: 'power2.in', onUpdate: () => {
      g.position.y = base.y + .8 + p.u * p.u * 40;
      if (!REDUZ && Math.random() < .6) fumaca.soltar({ x: g.position.x, y: g.position.y, z: g.position.z, cor: '#FFFFFF', tam: .9, sobe: -.5, vida: 1.6 });
    } })).then(() => { raiz.remove(g); satelite(c.potencia); });
  }
  // Satélite que passa a orbitar baixo sobre o mapa (um por potência)
  function satelite(pid) {
    if (satelites[pid]) return;
    const g = new THREE.Group(); MD('satelite', 0, 0, 0, { s: 1.1 }).forEach(pp => g.add(malhaDaPeca(pp)));
    const i = PIDS.indexOf(pid), fase = i * 1.05;
    g.tique = (dt, t) => { const a = (REDUZ ? 0 : t * .06) + fase; g.position.set(Math.cos(a) * 92, 20 + i * 1.5, Math.sin(a) * 40 + 3); g.rotation.y = -a; };
    raiz.add(g); animados.add(g); satelites[pid] = g;
  }
  function caboSubmarino(c) {
    if (idx(c.alvo) < 0) return Promise.resolve();
    const a = capital(c.potencia), b = capital(c.alvo), ar = arco([a[0], ALT_MAR + .05, a[2]], [b[0], ALT_MAR + .05, b[2]], { cor: C.amarelo, altura: 0, passo: 1.3, tam: .22, duracao: 1.2 });
    return ar.pronto.then(() => esperar(1.5)).then(() => ar.remover(.6));
  }
  function desmontarRadar(c, animar) { const r = construcoes.find(x => x.carta === 'defesa' && x.pid === c.potencia); return r ? desmontar(r, animar) : Promise.resolve(); }

  // ============================== EFEITOS (os 22 do contrato; cada um devolve Promise) ==============================
  // efeito(tipo, id, { pid, de, para }): id = território ou potência onde acontece
  function temporario(obj, dur) { raiz.add(obj); return esperar(dur).then(() => raiz.remove(obj)); }
  function marPerto(id) {
    const [ac, ar] = ANC[id] || [0, 0];
    for (let r = 1; r < 25; r++) for (let a = 0; a < 16; a++) { const c = Math.round(ac + Math.cos(a / 16 * Math.PI * 2) * r), rr = Math.round(ar + Math.sin(a / 16 * Math.PI * 2) * r), k = rr * COLS + c; if (rr >= 0 && rr < LINS && c >= 0 && c < COLS && terrDaCelula[k] === -1) return xzDe(k); }
    return ancoraXZ(id);
  }
  const raioDe = id => limitar(Math.sqrt(pinosDe[idx(id)]?.length || 30) * .75, 3.5, 13);
  const sortearPinos = (id, n, semente = 1) => { const todos = pinosDe[idx(id)] || [], dentro = todos.filter(k => !ehBorda(k)); return [...(dentro.length >= Math.min(n, 6) ? dentro : todos)].sort((a, b) => hash(a * semente + 7) - hash(b * semente + 7)).slice(0, n); };
  // Nuvem de chuva passageira (enchente): uma nuvem azul-acinzentada com gotas caindo
  function chuva(x, z, dur) {
    const g = new THREE.Group(), n = nuvem('#8A92AE', 1.2), gotas = new THREE.InstancedMesh(caixa(.08, .6, .08, .02), translucido('#CFEFFF', .85), 24);
    g.add(n, gotas); g.position.set(x, 7, z); raiz.add(g);
    const d = Array.from({ length: 24 }, (_, i) => ({ a: i * 2.4, r: .3 + (i % 5) * .45, y: (i * .37) % 5 })), p = { t: 0 };
    const poe = () => { d.forEach((q, i) => { gotas.setMatrixAt(i, m4.makeTranslation(Math.cos(q.a) * q.r, -((q.y + (REDUZ ? 0 : p.t * 8)) % 5) - .3, Math.sin(q.a) * q.r)); }); gotas.instanceMatrix.needsUpdate = true; };
    poe(); g.scale.setScalar(.01);
    return anim(g.scale, { x: 1, y: 1, z: 1, duration: REDUZ ? 0 : .35, ease: 'back.out(1.6)' }).then(() => anim(p, { t: dur, duration: dur, ease: 'none', onUpdate: poe }))
      .then(() => anim(g.scale, { x: .01, y: .01, z: .01, duration: REDUZ ? 0 : .3 })).then(() => { raiz.remove(g); gotas.material.dispose(); gotas.dispose(); });
  }
  // Chama de peças: base vermelha, corpo laranja e miolo amarelo, levemente torta (só incêndio florestal)
  function chama() {
    const f = new THREE.Group();
    [[cone(.62, .04, 1.9, 7), C.fogo, 0, 0, .1], [cone(.44, .03, 1.45, 7), '#FFB21F', .1, .05, -.16], [cone(.26, .02, 1, 7), '#FFE45C', -.05, .08, .06], [cone(.26, .02, .85, 7), '#FF9A1F', .42, 0, .32], [cone(.22, .02, .7, 7), '#FFB21F', -.4, 0, -.3]]
      .forEach(([g, hex, x, y, rz]) => { const m = new THREE.Mesh(g, brilhante(hex, .85)); m.position.set(x, y, 0); m.rotation.z = rz; f.add(m); });
    return f;
  }
  // Chevron (seta em "V" de duas barras) apontando para +z
  const chevron = () => geoCache('chevron', () => juntar([[caixa(1.05, .26, .34, .07), -.3, 0, 0, -.75], [caixa(1.05, .26, .34, .07), .3, 0, 0, .75]]).translate(0, 0, .2));
  function nuvem(hex, s = 1) {
    const geo = geoModelo('nuvem') || geoReserva('nuvem'), m = new THREE.Mesh(geo, plastico(hex, .6));
    m.castShadow = true; m.scale.setScalar(s); return m;
  }
  function raioDeLuz() {
    const g = new THREE.Group(), mat = brilhante(C.raio, 1);
    [[0, 0, .5], [.35, -1.1, -.6], [-.1, -2.2, .5]].forEach(([x, y, rz]) => { const m = new THREE.Mesh(caixa(.22, 1.3, .22, .05), mat); m.position.set(x, y, 0); m.rotation.z = rz; g.add(m); });
    return g;
  }
  // Placas translúcidas sobre pinos (enchente, mar): sobem, ficam e recuam
  function aguaSobre(celulas, { cor: c = C.aguaRasa, dur = 2.2, op = .7 } = {}) {
    const gA = geoCache('agua-placa', () => new THREE.BoxGeometry(1, .14, 1).translate(0, .07, 0)), mat = translucido(c, op);
    const im = new THREE.InstancedMesh(gA, mat, celulas.length); im.renderOrder = 3;
    const p = { v: 0 }, poe = () => { celulas.forEach((k, i) => { const [x, z] = xzDe(k); m4.compose(v3.set(x, ALT_TERRA + alturaBase[k] - .1 + p.v * .26, z), q4.identity(), s3.set(1, Math.max(.01, p.v), 1)); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; };
    poe(); raiz.add(im);
    return anim(p, { v: 1, duration: REDUZ ? 0 : .6, ease: 'power2.out', onUpdate: poe }).then(() => esperar(dur)).then(() => anim(p, { v: 0, duration: REDUZ ? 0 : .6, ease: 'power2.in', onUpdate: poe })).then(() => { raiz.remove(im); mat.dispose(); im.dispose(); });
  }
  function anelExpande(x, y, z, { cor: c = C.amarelo, de = 1, ate = 8, dur = 1, largura = .35, vezes = 1, ambiente = false } = {}) {
    const mat = new THREE.MeshBasicMaterial({ color: c, transparent: true, depthWrite: false }), m = new THREE.Mesh(anelChao(1 - largura / 2, 1 + largura / 2, 64), mat);
    m.position.set(x, y + .06, z); raiz.add(m);
    const p = { u: 0 }, poe = () => { m.scale.setScalar(lerp(de, ate, p.u)); mat.opacity = 1 - p.u; };
    poe();
    if (ambiente) AMBIENTE.add(p);
    if (REDUZ) { m.scale.setScalar(ate * .6); mat.opacity = .7; return esperar(.8).then(() => { raiz.remove(m); mat.dispose(); }); }
    return anim(p, { u: 1, duration: dur, ease: 'power2.out', repeat: vezes - 1, onUpdate: poe }).then(() => { raiz.remove(m); mat.dispose(); });
  }
  const EFEITOS = {
    tempestade(id) {
      const [mx, mz] = marPerto(id), [ax, az] = ancoraXZ(id), cx = lerp(ax, mx, .55), cz = lerp(az, mz, .55), g = new THREE.Group();
      const nuvens = [0, 1, 2, 3].map(i => { const n = nuvem(i === 3 ? '#8A92AE' : C.tempestade, [1.55, 1.4, 1.3, 1.2][i]); g.add(n); return n; });
      const raios = [0, 1].map(() => { const r = raioDeLuz(); r.scale.setScalar(1.6); g.add(r); return r; });
      const gotas = new THREE.InstancedMesh(caixa(.08, .7, .08, .02), translucido('#CFEFFF', .8), 40); g.add(gotas);
      const dGotas = Array.from({ length: 40 }, (_, i) => ({ a: i * 2.4, r: .5 + (i % 7) * .55, y: (i * .37) % 6 }));
      g.position.set(cx, 8, cz); raiz.add(g);
      som('trovao');
      const p = { t: 0 }, poe = () => {
        nuvens.forEach((n, i) => { const a = (REDUZ ? 0 : p.t * 1.5) + i * 1.6, r = i === 3 ? 0 : 2.6; n.position.set(Math.cos(a) * r, i === 3 ? .8 : 0, Math.sin(a) * r); });
        raios.forEach((r, i) => { r.visible = REDUZ ? i === 0 : (Math.floor(p.t * 2 + i * .5) % 2 === 0); r.position.set(i ? 2.2 : -1.6, -2.2, i ? -.6 : 1); });
        dGotas.forEach((d, i) => { const y = REDUZ ? -d.y : -((d.y + p.t * 9) % 6); m4.makeTranslation(Math.cos(d.a) * d.r, y - .5, Math.sin(d.a) * d.r); gotas.setMatrixAt(i, m4); });
        gotas.instanceMatrix.needsUpdate = true;
      };
      poe(); g.scale.setScalar(.01);
      return anim(g.scale, { x: 1, y: 1, z: 1, duration: REDUZ ? 0 : .45, ease: 'back.out(1.6)' })
        .then(() => anim(p, { t: 3, duration: REDUZ ? 1.5 : 3, ease: 'none', onUpdate: poe }))
        .then(() => anim(g.scale, { x: .01, y: .01, z: .01, duration: REDUZ ? 0 : .35, ease: 'power2.in' })).then(() => { raiz.remove(g); gotas.material.dispose(); gotas.dispose(); });
    },
    calor(id) {
      const [x, y, z] = baseTorres(id), R = raioDe(id), mat = new THREE.MeshStandardMaterial({ color: C.laranja, transparent: true, opacity: .25, depthWrite: false, roughness: .4, emissive: C.laranja, emissiveIntensity: .2, side: THREE.DoubleSide });
      const domo = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat);
      domo.position.set(x, y, z); domo.scale.y = .6;
      const solG = new THREE.Group();
      solG.add(new THREE.Mesh(redonda(1, .4, false, 28), brilhante(C.amarelo, .6)));
      solG.children[0].rotation.x = Math.PI / 2;
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = new THREE.Mesh(caixa(.3, .3, .7, .08), brilhante('#FFB21F', .5)); r.position.set(Math.cos(a) * 1.5, Math.sin(a) * 1.5, .2); r.rotation.z = a + Math.PI / 2; r.rotation.x = Math.PI / 2; solG.add(r); }
      solG.position.set(x, y + R * .6 + 4.5, z + 1); solG.scale.setScalar(1.4); raiz.add(domo, solG);
      som('descer');
      const p = { t: 0 };
      return anim(p, { t: 3.2, duration: 3.2, ease: 'none', onUpdate: () => { mat.opacity = REDUZ ? .32 : .25 + .15 * (.5 - .5 * Math.cos(p.t / 1.6 * Math.PI * 2)); if (!REDUZ) solG.rotation.z = p.t * .6; } })
        .then(() => { raiz.remove(domo, solG); domo.geometry.dispose(); mat.dispose(); });
    },
    seca(id) {
      const t = idx(id); if (t < 0) return Promise.resolve();
      som('descer'); memoria.set('seca:' + id, ultimoEstado?.ano ?? 0);
      const [x, y, z] = baseTorres(id);
      if (!REDUZ) for (let i = 0; i < 4; i++) gsap.delayedCall(i * .3 * VEL, () => fumaca.soltar({ x: x + (Math.random() - .5) * 8, y: y + .3, z: z + (Math.random() - .5) * 6, cor: '#E8D2A0', n: 2, tam: 1.1, sobe: .8, vida: 1.8 }));
      return Promise.all([ondaDeCor(t, () => secar(t, 1), { duracao: 1.1 }), anelExpande(x, y, z, { cor: C.seca, ate: raioDe(id), dur: 1.2 })]);
    },
    enchente(id) {
      som('whoosh');
      const [x, y, z] = baseTorres(id), n = pinosDe[idx(id)]?.length || 0;
      return Promise.all([aguaSobre(sortearPinos(id, Math.min(160, Math.max(6, n * .7 | 0)), 3), { cor: '#7FC4F0', op: .62 }),
        anelExpande(x, y, z, { cor: '#7FC4F0', ate: raioDe(id) + 2, dur: 1.2, vezes: 2, largura: .5 }), chuva(x, z, 2.6)]);
    },
    mar(id) {
      const costa = (pinosDe[idx(id)] || []).filter(ehCosta), [x, y, z] = baseTorres(id); som('whoosh');
      const novos = costa.filter(k => !marMemoria.has(k));
      // a água avança em ondas concêntricas e fica (o mapa guarda a memória)
      return Promise.all([anelExpande(x, ALT_MAR, z, { cor: C.espuma, de: raioDe(id) + 6, ate: 1, dur: 1.2, vezes: 2, largura: .7 }),
        aguaSobre(novos, { dur: .2 }).then(() => { novos.forEach(k => marMemoria.add(k)); desenharAgua(); })]);
    },
    fogo(id) {
      const t = idx(id); if (t < 0) return Promise.resolve();
      const celulas = sortearPinos(id, 7, 11), g = new THREE.Group(), chamas = [];
      celulas.forEach((k, i) => { const [x, z] = xzDe(k), f = chama(); f.position.set(x, ALT_TERRA + alturaBase[k] + .15, z); f.userData.fase = i * 1.7; f.rotation.y = i; g.add(f); chamas.push(f); });
      raiz.add(g); som('descer');
      const p = { t: 0 };
      return anim(p, { t: 3, duration: 3, ease: 'none', onUpdate: () => {
        chamas.forEach(f => { const s = REDUZ ? 1 : .85 + .2 * Math.sin(p.t * Math.PI * 2 * 1.8 + f.userData.fase), cresce = Math.min(1, p.t / .4); f.scale.set(cresce * (2 - s) * .9, cresce * s * 1.1, cresce * (2 - s) * .9); });
        if (!REDUZ && Math.random() < .35) { const f = chamas[Math.floor(Math.random() * chamas.length)]; fumaca.soltar({ x: f.position.x, y: f.position.y + 1.4, z: f.position.z, cor: C.fumacaConflito, tam: .7, vida: 1.8 }); }
      } }).then(() => {
        raiz.remove(g);
        celulas.forEach(k => { estadoT[t].cinzas.add(k); }); memoria.set('cinzas:' + id, ultimoEstado?.ano ?? 0);
        Object.values(cenario).forEach(c => { c.itens.forEach(it => { if (celulas.some(k => Math.hypot(xzDe(k)[0] - it.x, xzDe(k)[1] - it.z) < 1.6)) it.oculto = true; }); desenharCenario(c.malha, c.itens); });
        pintarTerritorio(t);
      });
    },
    conflito(id) {
      const [x, y, z] = baseTorres(id), nivel = conflitos[id]?.nivel || ultimoEstado?.territorios?.[id]?.conflito || 1;
      som('trovao');
      const prom = [anelExpande(x, y, z, { cor: C.alerta, ate: 6, dur: 1.1, vezes: 2 })];
      // 1 tijolo salta de cada torre ali
      const tr = torres[id];
      if (tr && !REDUZ) tr.lista.slice(0, tr.mostradas || 2).forEach((inf, j) => { const [tx, ty, tz] = posTorre(id, j, tr.mostradas || 1); particulas.lancar({ x: tx, y: ty + inf.n * TIJOLO, z: tz, cor: eq(inf.pid).cor, escala: 1.6, n: 1 }); });
      const bl = conflitos[id]?.blocos.at(-1);
      if (bl && !REDUZ) prom.push(anim(bl.position, { y: 9, duration: .01 }).then(() => anim(bl.position, { y: 1.5, duration: .5, ease: 'back.out(1.6)' })));
      if (nivel >= 3) (M.vizinhos[id] || []).slice(0, 4).forEach(v => { const ar = arco([x, y + .3, z], capital(v), { cor: C.laranja, altura: 2, passo: 1.4, tam: .22, duracao: .5 }); prom.push(ar.pronto.then(() => { numeroFlutuante(v, '−3', 'perda'); return esperar(1.2); }).then(() => ar.remover())); });
      if (!REDUZ) for (let i = 0; i < 3; i++) fumaca.soltar({ x: x + (i - 1) * 1.2, y: y + .5, z: z + 1, cor: C.fumacaConflito, tam: 1, vida: 2.4 });
      return Promise.all(prom);
    },
    paz(id) {
      const [x, y, z] = baseTorres(id), t = idx(id); som('certo');
      const prom = [anelExpande(x, y, z, { cor: C.paz, ate: raioDe(id), dur: 1.2 })];
      const bl = conflitos[id]?.blocos.at(-1);
      if (bl && !REDUZ) prom.push(anim(bl.position, { y: 4.5, duration: .4, ease: 'power2.out', yoyo: true, repeat: 1 }).then(() => particulas.lancar({ x: posBlocos(id)[0], y: y + 2, z: posBlocos(id)[2], cor: [C.paz, '#FFFFFF'], n: 10, escala: .35, sobe: [3, 5] })));
      const a = [x - 14, y + 10, z + 8], g = criarPomba();
      prom.push(voo(g, a, [x + 2.2, y + .2, z + 2.2], { altura: 3, duracao: 1.4, gira: false }).then(() => { animados.delete(g); paz(id, true, { animar: false }); }));
      if (t >= 0) prom.push(ondaDeCor(t, () => (estadoT[t].paz = true), { duracao: .8 }));
      return Promise.all(prom);
    },
    pandemia(id) {
      const [x, y, z] = baseTorres(id), mat = new THREE.MeshStandardMaterial({ color: C.lilas, transparent: true, opacity: .55, roughness: .1, depthWrite: false, emissive: C.lilas, emissiveIntensity: .15 });
      const cel = sortearPinos(id, 30, 5), bolhas = new THREE.InstancedMesh(esfera(.62, 16, 12), mat, Math.max(1, cel.length)), dados = cel.map((k, i) => ({ k, f: i * .11 }));
      raiz.add(bolhas); som('descer');
      const arcos = (M.vizinhos[id] || []).slice(0, 4).map(v => arco([x, y + .5, z], capital(v), { cor: C.lilas, altura: 3, passo: 1.4, tam: .2, duracao: .9 }));
      const p = { t: 0 };
      return anim(p, { t: 3, duration: 3, ease: 'none', onUpdate: () => {
        dados.forEach((d, i) => { const [cx, cz] = xzDe(d.k), u = ((p.t + d.f) % 1.5) / 1.5, s = REDUZ ? .8 : Math.sin(u * Math.PI); m4.compose(v3.set(cx, ALT_TERRA + .5 + u * 3, cz), q4.identity(), s3.set(s, s, s)); bolhas.setMatrixAt(i, m4); });
        bolhas.instanceMatrix.needsUpdate = true;
      } }).then(() => { raiz.remove(bolhas); mat.dispose(); bolhas.dispose(); return Promise.all(arcos.map(a => a.remover())); });
    },
    ciberataque(id) {
      const cel = sortearPinos(id, 40, 9), im = new THREE.InstancedMesh(ladrilho(1, 1, .3), brilhante('#6FE7FF', .9), cel.length), im2 = new THREE.InstancedMesh(ladrilho(1, 1, .3), plastico(C.pecaPreta), cel.length);
      raiz.add(im, im2); som('alarme');
      const [x, y, z] = baseTorres(id), cad = new THREE.Group(); cadeado(0, 0, 0, 1.6).forEach(pp => cad.add(malhaDaPeca(pp)));
      cad.position.set(x, y + 4, z + 1); raiz.add(cad);
      const ala = cad.children[1], p = { t: 0 };
      return anim(p, { t: 3, duration: 3, ease: 'none', onUpdate: () => {
        let a = 0, b = 0;
        cel.forEach((k, i) => { const [cx, cz] = xzDe(k), on = REDUZ ? i % 2 : (Math.floor(p.t * 2.5 + hash(k) * 3) % 2); m4.makeTranslation(cx, ALT_TERRA + alturaBase[k], cz); (on ? im : im2).setMatrixAt(on ? a++ : b++, m4); });
        im.count = a; im2.count = b; im.instanceMatrix.needsUpdate = im2.instanceMatrix.needsUpdate = true;
        if (ala) ala.position.y = .8 * 1.6 + Math.min(.6, Math.max(0, p.t - 1) * .8);
      } }).then(() => { raiz.remove(im, im2, cad); im.dispose(); im2.dispose(); });
    },
    acordo(id) {
      const [x, y, z] = baseTorres(id); som('subir');
      particulas.chuva({ x, z, y, cor: [C.ouro, '#FFFFFF', C.amarelo], n: 20, raio: 3.5 });
      return Promise.all([anelExpande(x, y, z, { cor: C.ouro, ate: 9, dur: 1.4, vezes: 2 }), pomba([x - 10, y + 6, z + 6], [x + 1, y + 6, z - 1]), esperar(.3).then(() => pomba([x + 10, y + 6, z + 6], [x - 1, y + 6, z - 1]))]);
    },
    sancao(id, o = {}) {
      const alvo = ehPotencia(id) ? id : o.para || id, [x, y, z] = capital(alvo), g = new THREE.Group();
      cadeado(0, 0, 0, 2).forEach(pp => g.add(malhaDaPeca(pp)));
      const corrente = new THREE.Mesh(toro(2.4, .16, Math.PI * 2, 48), plastico('#8E9BB0', .35)); corrente.rotation.x = Math.PI / 2; corrente.position.y = .3; g.add(corrente);
      g.position.set(x, y + (REDUZ ? 0 : 10), z + 1.5); g.scale.setScalar(limitar(distCamera() / 55, 1, 2.4)); raiz.add(g);
      const prom = [anim(g.position, { y, duration: .5, ease: 'back.out(1.4)' }).then(() => som('martelo'))];
      if (o.de && ehPotencia(o.de)) prom.push(arcoSancao({ potencia: o.de, alvo }));
      return Promise.all(prom).then(() => esperar(1.6)).then(() => anim(g.scale, { x: .01, y: .01, z: .01, duration: REDUZ ? 0 : .3 })).then(() => raiz.remove(g));
    },
    refugiados(id, o = {}) {
      const destinos = (o.para ? [].concat(o.para) : (M.vizinhos[id] || []).filter(v => idx(v) >= 0).slice(0, 3));
      const a = capital(id); som('whoosh');
      return Promise.all(destinos.map((d, i) => esperar(i * .25).then(() => {
        const b = capital(d), ang = Math.atan2(b[0] - a[0], b[2] - a[2]), L = Math.hypot(b[0] - a[0], b[2] - a[2]), g = new THREE.Group(), n = Math.max(3, Math.floor(L / 2.2));
        const h = Math.max(3, L * .15);
        for (let j = 0; j < n; j++) { const u = (j + .5) / n, ch = new THREE.Mesh(chevron(), plastico('#FFFFFF', .25)); ch.castShadow = true; ch.position.set(lerp(a[0], b[0], u), lerp(a[1], b[1], u) + 1 + Math.sin(u * Math.PI) * h, lerp(a[2], b[2], u)); ch.rotation.y = ang; ch.scale.setScalar(1.5); ch.visible = false; g.add(ch); }
        raiz.add(g);
        const tenda = new THREE.Group(); MD('tenda', 0, 0, 0, { s: .9 }).forEach(pp => tenda.add(malhaDaPeca(pp)));
        placaComSimbolo('coracao', '#FFCAE6', 0, 1.3, .2, .6).forEach(pp => tenda.add(malhaDaPeca(pp)));
        tenda.position.set(b[0] + 1.6, b[1], b[2] + 1.6); tenda.scale.setScalar(.01);
        return anim({ u: 0 }, { u: 1, duration: REDUZ ? 0 : 1.2, ease: 'none', onUpdate() { const u = this.targets()[0].u; g.children.forEach((ch, j) => (ch.visible = j / n <= u)); } })
          .then(() => { raiz.add(tenda); return anim(tenda.scale, { x: 1.2, y: 1.2, z: 1.2, duration: REDUZ ? 0 : .5, ease: 'back.out(2)' }); })
          .then(() => esperar(1.6)).then(() => { raiz.remove(g, tenda); });
      })));
    },
    petroleo(id) {
      const regioes = [...new Set([id, 'golfo', 'ira'].filter(r => idx(r) >= 0))]; som('alarme');
      return Promise.all(regioes.map((r, i) => {
        const [x, y, z] = baseTorres(r), g = new THREE.Group(); MD('tanque-combustivel', 0, 0, 0, { s: 1.2 }).forEach(pp => g.add(malhaDaPeca(pp)));
        const seta = new THREE.Group(); [P(caixa(.6, 1.6, .6), C.laranja, 0, 0), P(cone(1, .02, .9, 4), C.laranja, 0, 1.6, 0, { ry: Math.PI / 4 })].forEach(pp => seta.add(malhaDaPeca(pp)));
        seta.position.set(1.8, 1, 0); g.add(seta);
        g.position.set(x - 3, y, z + 2); raiz.add(g); g.scale.setScalar(.01);
        return anim(g.scale, { x: 1, y: 1, z: 1, duration: REDUZ ? 0 : .4, delay: i * .2, ease: 'back.out(2)' })
          .then(() => Promise.all([anelExpande(x - 3, y, z + 2, { cor: C.laranja, ate: 5, dur: 1.2, vezes: 2 }), anim(seta.position, { y: 2.2, duration: REDUZ ? 0 : .6, yoyo: true, repeat: 3, ease: 'sine.inOut' })]))
          .then(() => anim(g.scale, { x: .01, y: .01, z: .01, duration: REDUZ ? 0 : .3 })).then(() => raiz.remove(g));
      }));
    },
    comercio(id) {
      const [x, y, z] = baseTorres(id), g = new THREE.Group(); som('moeda');
      [['conteiner-vermelho', -1, 0], ['conteiner-azul', 0, 0], ['conteiner-verde', 1, 0], ['conteiner-azul', -.5, .64], ['conteiner-vermelho', .5, .64]].forEach(([m, cx, cy]) => MD(m, cx, cy, 0, { s: 1 }).forEach(pp => g.add(malhaDaPeca(pp))));
      g.position.set(x, y, z + 2.5); raiz.add(g);
      g.children.forEach((o, i) => { const y0 = o.position.y; if (!REDUZ) gsap.fromTo(o.position, { y: y0 + 4 }, { y: y0, duration: .4 * VEL, delay: i * .08 * VEL, ease: 'back.out(1.6)' }); });
      for (let i = 0; i < 4 && !REDUZ; i++) gsap.delayedCall(i * .25 * VEL, () => particulas.lancar({ x, y: y + 2, z: z + 2.5, cor: C.ouro, n: 3, escala: .4, sobe: [6, 8], lado: [.5, 1.5], vida: 1 }));
      return esperar(2.6).then(() => anim(g.scale, { x: .01, y: .01, z: .01, duration: REDUZ ? 0 : .3 })).then(() => raiz.remove(g));
    },
    ajuda(id) {
      const [x, y, z] = baseTorres(id); som('pop');
      const caixas = [[-1.5, 1], [0, 2], [1.6, .6], [.4, -.8]].map(([dx, dz], i) => {
        const g = new THREE.Group(); MD('caixa', 0, 0, 0, { s: 1 }).forEach(pp => g.add(malhaDaPeca(pp)));
        const para = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), plastico(i % 2 ? '#FFFFFF' : '#FFCAE6', .4)); para.position.y = 2.3; para.scale.set(1, .5, 1); g.add(para);
        g.position.set(x + dx, y + (REDUZ ? 0 : 12), z + dz + 1); raiz.add(g);
        return anim(g.position, { y, duration: 1.4, delay: i * .2, ease: 'sine.in' }).then(() => { para.visible = false; som('pop'); return esperar(1.2); }).then(() => { raiz.remove(g); para.geometry.dispose(); });
      });
      return Promise.all(caixas);
    },
    influencia(id, o = {}) {
      const pid = o.pid || ultimoEstado?.territorios?.[id]?.parceiro || null, [x, y, z] = baseTorres(id), c = eq(pid).cor; som('tijolo');
      if (!REDUZ) particulas.chuva({ x, z, y, cor: [c, eq(pid).clara], n: 14, raio: 2 });
      return Promise.all([anelExpande(x, y, z, { cor: c, ate: 7, dur: 1, largura: .45 }), esperar(1.4)]);
    },
    parceria(id, o = {}) {
      const t = idx(id), pid = o.pid || ultimoEstado?.territorios?.[id]?.parceiro; if (t < 0 || !pid) return Promise.resolve();
      const [x, y, z] = baseTorres(id); som('subir');
      if (!REDUZ) particulas.chuva({ x, z, y, cor: eq(pid).cor, n: 12, raio: 3 });
      return Promise.all([ondaDeCor(t, () => definirTipo(t, 'parceiro', pid)), bandeira(id, pid, { animar: true }), acaoBoneco(pid, 'acenar')]);
    },
    golpe(id) {
      const t = idx(id), [x, y, z] = baseTorres(id); som('trovao');
      const n = nuvem(C.tempestade, 1.6); n.position.set(x, y + 7, z); raiz.add(n);
      anelExpande(x, y, z, { cor: C.laranja, ate: raioDe(id) + 2, dur: 1.1, vezes: 2, largura: .5 });
      const bl = new THREE.Mesh(geoBloco(), matFoco()); bl.position.set(x + 2, y + 1.6, z + 2); raiz.add(bl);
      const b = bandeiras[id], p = { t: 0 };
      if (b && !REDUZ) gsap.to(b.rotation, { z: -.5, duration: .4 * VEL, yoyo: true, repeat: 1, ease: 'power2.inOut' });
      return anim(p, { t: 1.6, duration: 1.6, ease: 'none', onUpdate: () => { if (REDUZ) return; for (const k of pinosDe[t] || []) { alturaAnim[k] = elevAtual[t] + Math.sin(p.t * 30 + hash(k) * 6) * .08 * (1 - p.t / 1.6); posicionarCelula(k); } marcarTerra(); } })
        .then(() => { (pinosDe[t] || []).forEach(k => { alturaAnim[k] = elevAtual[t]; posicionarCelula(k); }); marcarTerra(); return esperar(1); }).then(() => raiz.remove(n, bl));
    },
    desinformacao(id) {
      const [x, y, z] = baseTorres(id), g = new THREE.Group(); som('pop');
      const baloes = [0, 1, 2, 3, 4].map(i => { const b = new THREE.Group(); placaComSimbolo(i % 2 ? '?' : '!', i % 2 ? '#B9A6F2' : '#8A8F9E', 0, 0, 0, 1).forEach(pp => b.add(malhaDaPeca(pp))); const bico = new THREE.Mesh(cone(.25, .02, .45, 4), plastico(i % 2 ? '#B9A6F2' : '#8A8F9E')); bico.rotation.x = Math.PI; bico.position.set(-.25, .05, 0); b.add(bico); b.scale.setScalar(.01); g.add(b); return b; });
      g.position.set(x, y + 2, z + 1); raiz.add(g);
      const p = { t: 0 };
      baloes.forEach((b, i) => anim(b.scale, { x: 1.1, y: 1.1, z: 1.1, duration: REDUZ ? 0 : .35, delay: i * .25, ease: 'elastic.out(1, .5)' }).then(() => som('pop')));
      return anim(p, { t: 3, duration: 3, ease: 'none', onUpdate: () => baloes.forEach((b, i) => { const a = (REDUZ ? 0 : p.t * .9) + i / 5 * Math.PI * 2; b.position.set(Math.cos(a) * 3, 1 + (i % 2) * 1.2 + (REDUZ ? 0 : Math.sin(p.t * 2 + i) * .3), Math.sin(a) * 2); }) })
        .then(() => raiz.remove(g));
    },
    cop(id) {
      const b = capital(id); som('subir');
      const prom = PIDS.filter(p => p !== id).map((p, i) => esperar(i * .05).then(() => pomba(capital(p), [b[0], b[1] + 4, b[2]], { altura: 10, duracao: 1.8 })));
      prom.push(esperar(1.6).then(() => { if (!REDUZ) particulas.chuva({ x: b[0], z: b[2], y: b[1], cor: ['#3FAE5A', '#8CCB5E', '#B3EFC6'], n: 24, raio: 4 }); return anelExpande(b[0], b[1], b[2], { cor: '#3CD46A', ate: 10, dur: 1.4 }); }));
      return Promise.all(prom);
    },
    onu() {
      som('reuniao');
      const ar = arco([-40, 14, 3], [40, 14, 3], { cor: C.ouro, altura: 10, passo: 2, tam: .4, duracao: 1 });
      const prom = [0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * Math.PI * 2; return esperar(i * .12).then(() => pomba([Math.cos(a) * 70, 10, Math.sin(a) * 30], [Math.cos(a + 2) * 20, 18, Math.sin(a + 2) * 10], { altura: 6, duracao: 2, trilha: false })); });
      return Promise.all([...prom, ar.pronto.then(() => esperar(1.6)).then(() => ar.remover(.5))]);
    },
  };
  function efeito(tipo, id, opcoes = {}) {
    const f = EFEITOS[tipo];
    if (!f || !renderer) return Promise.resolve();
    const ev = id && idx(id) >= 0 ? [id] : [];
    rotulosPor('evento', [...(porMotivo.evento || []), ...ev]);
    return acompanhar(modelosProntos.then(() => f(id, opcoes))).catch(() => {}).then(() => { setTimeout(() => rotulosPor('evento', (porMotivo.evento || []).filter(x => !ev.includes(x))), 2000); });
  }
  const memoria = new Map();   // marcas de eventos no mapa (seca, cinzas): somem depois de 1 mandato

  // ============================== ATUALIZAR O MUNDO A PARTIR DO ESTADO DO MOTOR ==============================
  function atualizarMundo(e, op = {}) {
    if (!e) return Promise.resolve();
    if (!renderer) return pronto.then(() => atualizarMundo(e, op));
    return acompanhar(modelosProntos.then(() => atualizarAgora(e, op)));
  }
  function atualizarAgora(e, { animar = false } = {}) {
    const primeira = !ultimoEstado;
    ultimoEstado = e;
    const anima = animar && !primeira, prom = [], g = e.global || {};
    const P2 = typeof Simulacao !== 'undefined' ? Simulacao.PARAM : { resistenciaBase: 3, margemParceria: 2 };
    for (const t of Object.values(e.territorios || {})) {
      const ti = idx(t.id); if (ti < 0) continue;
      const st = estadoT[ti], parceiro = t.parceiro || null, tipo = parceiro ? 'parceiro' : 'neutro';
      if (st.tipo !== tipo || st.pid !== parceiro) {
        if (anima) {
          prom.push(ondaDeCor(ti, () => definirTipo(ti, tipo, parceiro)));
          if (parceiro) { som('subir'); const [x, y, z] = baseTorres(t.id); if (!REDUZ) particulas.chuva({ x, z, y, cor: eq(parceiro).cor, n: 12, raio: 3 }); acaoBoneco(parceiro, 'acenar'); }
          else som('descer');
        } else { definirTipo(ti, tipo, parceiro); pintarTerritorio(ti); }
        prom.push(bandeira(t.id, parceiro, { animar: anima }));
      }
      const lista = Object.entries(t.influencia || {}).map(([pid, n]) => ({ pid, n })), ord = [...lista].sort((a, b) => b.n - a.n);
      const res = typeof Simulacao !== 'undefined' ? Simulacao.resistencia(t) : P2.resistenciaBase + Math.floor((t.estabilidade || 50) / 25);
      const precisa = parceiro || t.protegido || !ord[0]?.n ? 0 : Math.min(10, Math.max(res, (ord[1]?.n || 0) + P2.margemParceria));
      prom.push(influencia(t.id, lista, { animar: anima, precisa, resistencia: res }));
      if (torres[t.id]) torres[t.id].pressao = t.pressao || 0;
      const antes = estadoT[ti].conflito || 0;
      prom.push(conflito(t.id, t.conflito || 0, { animar: anima }));
      foco(t.id, FOCOS.includes(t.id) && !(t.conflito > 0));
      // paz recente: conflito acabou → brilho verde-claro e pomba por 1 mandato
      if (antes > 0 && !t.conflito && !primeira) { st.pazAte = (e.ano || 0) + (e.delta || 4); paz(t.id, true, { animar: anima }); }
      else if (st.paz && st.pazAte && (e.ano || 0) >= st.pazAte) paz(t.id, false);
    }
    // marcas de eventos: somem depois de 1 mandato
    for (const [chave, ano] of [...memoria]) if ((e.ano || 0) - ano >= (e.delta || 4)) {
      memoria.delete(chave);
      const [tipo, id] = chave.split(':'), t = idx(id);
      if (t < 0) continue;
      if (tipo === 'seca') { estadoT[t].seca = 0; estadoT[t].rachas = []; desenharRachas(); }
      if (tipo === 'cinzas') estadoT[t].cinzas.clear();
      pintarTerritorio(t);
    }
    // clima, comércio, tensão (a mesa puxa para o violeta), energia
    prom.push(aplicarClima(g, anima));
    if (e.potencias?.brasil) { perdaFloresta.desmatamento = limitar(((e.potencias.brasil.desmatamento ?? .9) - .5) / 2, 0, .8); aplicarFlorestas(anima); }
    aplicarComercio(g, e);
    aplicarEmissoes(e);
    for (const pid of PIDS) if (!construcoes.some(c => c.carta === 'termeletrica' && c.pid === pid)) prom.push(montarEm(pid, RECEITAS.termeletrica, { carta: 'termeletrica', potencia: pid, alvo: pid, ano: e.ano }, 'termeletrica|' + pid, false));
    criseAlvo = (g.tensao || 0) >= 80 ? 1 : 0;
    crisePetroleo = (g.energia || 0) >= 70;
    // alianças e sanções que ficam desenhadas
    (e.aliancas || []).forEach(([a, b]) => arcoAlianca({ potencia: a, alvo: b }));
    const sancoesAtivas = new Set((e.sancoes || []).filter(s => s.ate >= e.rodada && ehPotencia(s.de)).map(s => 'sa:' + s.de + '-' + s.contra));
    for (const [k, ar] of Object.entries(arcosFixos)) if (k.startsWith('sa:') && !sancoesAtivas.has(k)) { ar.remover(); if (ar.cadeado) raiz.remove(ar.cadeado); delete arcosFixos[k]; }
    (e.sancoes || []).filter(s => s.ate >= e.rodada && ehPotencia(s.de)).forEach(s => arcoSancao({ potencia: s.de, alvo: s.contra }));
    for (const p of PIDS) if ((e.construcoes || []).some(c => c.carta === 'programa_espacial' && c.potencia === p)) satelite(p);
    // construções que faltam (partida carregada: sem animação)
    const contagem = new Map();
    for (const c of e.construcoes || []) {
      const k = chaveDe(c), n = (contagem.get(k) || 0) + 1; contagem.set(k, n);
      if ((feitas.get(k) || 0) < n) prom.push(construir(c, { animar: anima }));
    }
    return Promise.all(prom);
  }
  // Crise do petróleo (energia ≥ 70): o Golfo e o Irã piscam laranja devagar
  let crisePetroleo = false, proxPetroleo = 0;
  const tiquePetroleo = { tique() {
    if (!crisePetroleo || relogio < proxPetroleo) return;
    proxPetroleo = relogio + 2.6;
    ['golfo', 'ira'].forEach(id => { if (idx(id) >= 0) { const [x, y, z] = baseTorres(id); anelExpande(x, y, z, { cor: C.laranja, de: 2, ate: 9, dur: 2.2, largura: .5, ambiente: true }); } });
  } };
  const tiqueMesa = { tique(dt) {
    if (Math.abs(crise - criseAlvo) < .001) return;
    crise = REDUZ ? criseAlvo : crise + Math.sign(criseAlvo - crise) * Math.min(Math.abs(criseAlvo - crise), dt / 2);
    desenharMesa(.5 - .5 * Math.cos(crise * Math.PI));
  } };
  [tiqueConflitos, tiqueConstrucoes, tiqueMesa, tiquePetroleo, tiqueLote].forEach(o => animados.add(o));

  // ============================== COMPATIBILIDADE (contrato antigo) ==============================
  function colorir(id, novaCor, { animar = true } = {}) {
    const t = idx(id); if (t < 0 || !terra) return Promise.resolve();
    const aplicar = () => { estadoT[t].tipo = 'livre'; estadoT[t].corLivre = novaCor; };
    if (animar && !REDUZ) return ondaDeCor(t, aplicar);
    aplicar(); pintarTerritorio(t); return Promise.resolve();
  }
  const corBaseDe = (id, c) => colorir(id, c, { animar: false });
  function colocarBoneco(boneco, id, deslocamento = [3, -3.5]) {
    const [x, z] = ancoraXZ(id);
    boneco.position.set(x + deslocamento[0], ALT_TERRA + (ehPotencia(id) ? CASA : 0), z + deslocamento[1]);
    boneco.scale.setScalar(1.25);
    raiz.add(boneco); if (boneco.tique) animados.add(boneco);
    return boneco;
  }
  function rotulosCasas() { PIDS.forEach(p => { if (idx(p) >= 0) rotuloDe(p); }); }

  const api = {
    iniciar, pronto, atualizarMundo, construir, destacarAlvos, efeito, numeroFlutuante, bonecos, acaoBoneco, vez, modo, pausar, graficos,
    // posição na tela da âncora de um território (para o HUD fazer o voo causa → efeito): { x, y, visivel }
    posicaoNaTela: id => { if (!renderer || idx(id) < 0) return null; const [x, y, z] = baseTorres(id), [px, py, ok] = naTela(x, y + 1, z), b = renderer.domElement.getBoundingClientRect(); return { x: b.left + px, y: b.top + py, visivel: ok }; },
    colorir, corBaseDe, focar, visaoGeral, influencia, criarBoneco, colocarBoneco, rotulo, lonLatParaXZ, territorioEm,
    territorios: TERR, vizinhos: M.vizinhos, pinos: id => pinosDe[idx(id)]?.length || 0,
    aoClicar: fn => (aoClicarFn = fn), aoPassar: fn => (aoPassarFn = fn),
    get cena() { return cena; }, get raiz() { return raiz; }, get camera() { return camera; }, get renderer() { return renderer; },
    get qualidade() { return qualidade; }, animados, EQUIPES,
    // só para a vitrine: monta a construção de uma ação num ponto fixo (galeria de objetos)
    _voar: (x, z, dist, inclinacao = .78) => voar([x, z], dist, { duracao: 0, inclinacao }),
    _galeria: (carta, pid, x, z, animar = false) => !RECEITAS[carta]?.pecas ? Promise.resolve() : modelosProntos.then(() => montarEm(pid, RECEITAS[carta], { carta, potencia: pid, alvo: pid, ano: 0 }, 'galeria:' + carta + x, animar, { x, z, naCosta: false })), ACOES: () => Object.keys(RECEITAS), EFEITOS: () => Object.keys(EFEITOS),
  };
  return api;
})();
