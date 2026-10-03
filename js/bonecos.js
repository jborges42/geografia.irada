'use strict';
/* Geografia Irada — os bonecos de blocos (fonte única do personagem: mapa, cenas, retratos e vitrines).
   Bonecos.criar(avatar, { base }) → THREE.Group com:
     .acao(nome, segundos?)  'parado' | 'acenar' | 'pular' | 'comemorar' | 'palmas' | 'triste' | 'surpreso' | 'votar' |
                             'falar' | 'apontar' | 'bracos-cruzados' | 'pensar' | 'girar'  (0 segundos = mantém até a próxima)
     .expressao(nome)        'feliz' | 'alegre' | 'triste' | 'surpreso' | 'pensativo' | 'determinado' | 'falando'
     .olhar(radianos)        vira a cabeça (as delegações olham para quem fala)
     .posar(acao, t, expr)   congela uma pose (fotos e retratos) · .soltar() volta a animar
     .tique()                avança a animação (opcional: ela anda sozinha quando o boneco é desenhado)
     .descartar()            libera o que é só dele (as peças são compartilhadas)
   Opção mesclar: false (retratos, desenhados uma vez só): sem juntar as peças numa malha com esqueleto.
   Avatar = { pid, nome, cor, forma, pele, cabelo, penteado, chapeu, acessorio, humano, roupa }; humano === false → cabeça de
   monitor (computador). A animação é função do relógio: chamar .tique() duas vezes no mesmo quadro não acelera nada.
   Original (guia de arte §7): cabeça-bloco grande, sem pino na cabeça, mãos de luvinha; nada de boneco de marca. */

const Bonecos = (() => {
  const REDUZ = typeof RM !== 'undefined' ? RM : matchMedia('(prefers-reduced-motion: reduce)').matches;   // respeita também o ajuste do jogo (ui.js)
  const agora = () => performance.now() / 1000;
  const TINTA = '#1A1433', CREME = '#FFF4DC', LADRILHO = '#FFF9EC', GRAFITE = '#2B2D42', AMARELO = '#FFD21F', PRETA = '#2B2747';

  // ---------- Paleta do guia de arte (§2.3, §2.8) ----------
  // as equipes vêm de CORES_GUIA (js/ui.js, fonte única; PIDS segue a ordem de conteudo/potencias.js)
  const EQUIPES = Object.fromEntries(PIDS.map(p => [p, { cor: CORES_GUIA[p].cor, sombra: CORES_GUIA[p].lado, clara: CORES_GUIA[p].clara, contorno: CORES_GUIA[p].contorno, forma: CORES_GUIA[p].forma }]));
  const CATEGORIAS = {
    diplomacia: { cor: '#DCCFFF', lado: '#8F79CC', chapeu: 'cartola', cargo: 'Diplomacia' },
    economia: { cor: '#FFE08A', lado: '#CCA742', chapeu: 'capacete', cargo: 'Economia' },
    natureza: { cor: '#B3EFC6', lado: '#65BF82', chapeu: 'explorador', cargo: 'Natureza' },
    seguranca: { cor: '#FFC4AE', lado: '#CC7C5E', chapeu: 'capacete-paz', cargo: 'Paz e Segurança' },
    pessoas: { cor: '#FFCAE6', lado: '#CC75A3', chapeu: 'bone', cargo: 'Pessoas e Direitos' },
    ciencia: { cor: '#99CDF8', lado: '#4F90C6', chapeu: 'oculos-lab', cargo: 'Ciência' },
  };
  const caminhoForma = f => FORMAS[f] || null;   // caminhos de js/ui.js (window.FORMAS)

  // ---------- Opções do provador (guia §7.3–7.4) ----------
  const PELES = [
    { id: 'tom1', nome: 'Tom 1', cor: '#FFDBB4' }, { id: 'tom2', nome: 'Tom 2', cor: '#F2C08E' },
    { id: 'tom3', nome: 'Tom 3', cor: '#D9A066' }, { id: 'tom4', nome: 'Tom 4', cor: '#B57A48' },
    { id: 'tom5', nome: 'Tom 5', cor: '#8D5A35' }, { id: 'tom6', nome: 'Tom 6', cor: '#5C3A21' },
    { id: 'brinquedo', nome: 'Amarelo de brinquedo', cor: '#FFD21A', frase: 'O clássico das peças de montar.' },
  ];
  const CABELOS = [
    { id: 'castanho', nome: 'Castanho', cor: '#3B2414' }, { id: 'preto', nome: 'Preto', cor: '#1B1A22' },
    { id: 'loiro', nome: 'Loiro', cor: '#E8C25A' }, { id: 'ruivo', nome: 'Ruivo', cor: '#B5532A' },
    { id: 'castanho-claro', nome: 'Castanho-claro', cor: '#7A4A2A' }, { id: 'grisalho', nome: 'Grisalho', cor: '#C9CCD1' },
  ];
  const PENTEADOS = [
    { id: 'curto', nome: 'Curto' }, { id: 'franja', nome: 'Franja' }, { id: 'coque', nome: 'Coque' },
    { id: 'black', nome: 'Black power' }, { id: 'longo', nome: 'Longo' }, { id: 'trancas', nome: 'Tranças' }, { id: 'careca', nome: 'Careca' },
  ];
  const CHAPEUS = [
    { id: 'nenhum', nome: 'Sem chapéu', frase: 'Cabelo ao vento na cúpula.' },
    { id: 'cartola', nome: 'Cartola', frase: 'Elegância de diplomata de carreira.' },
    { id: 'capacete', nome: 'Capacete de obra', frase: 'Pronto para tirar o projeto do papel.' },
    { id: 'bone', nome: 'Boné', frase: 'Na cor da equipe, do jeito da galera.' },
    { id: 'astronauta', nome: 'Capacete de astronauta', frase: 'Olhando o planeta lá de cima.' },
    { id: 'explorador', nome: 'Chapéu de explorador', frase: 'Rumo às florestas e aos rios do mundo.' },
    { id: 'coroa-louros', nome: 'Coroa de louros', frase: 'Para quem já se sente campeão.' },
    { id: 'oculos', nome: 'Óculos', frase: 'Lê todos os tratados até o fim.' },
    { id: 'oculos-lab', nome: 'Óculos de laboratório', frase: 'A ciência vem antes da decisão.' },
    { id: 'fone', nome: 'Fone com microfone', frase: 'Sempre na linha com o mundo.' },
    { id: 'capacete-paz', nome: 'Capacete da paz', frase: 'Missão de paz, sem armas.' },
  ];
  const ACESSORIOS = [
    { id: 'nenhum', nome: 'Mãos livres', frase: 'Pronto para cumprimentar todo mundo.' },
    { id: 'prancheta', nome: 'Prancheta', frase: 'Cada meta anotada e conferida.' },
    { id: 'megafone', nome: 'Megafone', frase: 'Para a voz da delegação chegar longe.' },
    { id: 'maleta', nome: 'Maleta', frase: 'Os acordos viajam com cuidado.' },
    { id: 'livro', nome: 'Livro', frase: 'Quem lê a história decide melhor.' },
    { id: 'globo', nome: 'Globo', frase: 'O mundo inteiro na palma da mão.' },
    { id: 'microfone', nome: 'Microfone', frase: 'Hora do discurso na assembleia.' },
    { id: 'luneta', nome: 'Luneta', frase: 'De olho no horizonte de 2050.' },
    { id: 'cadeira', nome: 'Cadeira de rodas', frase: 'Sobre rodas, rumo a todas as cúpulas.' },
  ];
  const COMEMORACOES = [
    { id: 'comemorar', nome: 'Braços para cima' }, { id: 'pular', nome: 'Pulão' }, { id: 'palmas', nome: 'Palmas' },
    { id: 'acenar', nome: 'Tchauzinho' }, { id: 'girar', nome: 'Giro no ar' },
  ];
  const EXPRESSOES = ['feliz', 'alegre', 'triste', 'surpreso', 'pensativo', 'determinado', 'falando'];
  const ACOES = ['parado', 'acenar', 'pular', 'comemorar', 'palmas', 'triste', 'surpreso', 'votar', 'falar', 'apontar', 'bracos-cruzados', 'pensar', 'girar'];

  const corDaLista = (lista, v, padrao) => (lista.find(x => x.id === v)?.cor) || (typeof v === 'string' && v[0] === '#' ? v : null) ||
    (Number.isInteger(v) ? lista[((v % lista.length) + lista.length) % lista.length].cor : padrao);

  // ---------- Tons (regra das sombras coloridas) para cores fora da tabela ----------
  const S = THREE.SRGBColorSpace;
  const hsl = c => new THREE.Color(c).getHSL({}, S);
  const deHsl = (h, s, l) => '#' + new THREE.Color().setHSL((h + 1) % 1, Math.min(1, Math.max(0, s)), Math.min(1, Math.max(0, l)), S).getHexString(S);
  const sombraDe = c => { const x = hsl(c), quente = x.h < .2 || x.h > .85; return deHsl(x.h + (quente ? -.04 : .04), x.s + .1, x.l * .62); };
  const contornoDe = c => { const x = hsl(c); return deHsl(x.h, Math.min(1, x.s + .2), .09); };
  const mistura = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
  const peleEscura = c => { const x = new THREE.Color(c); return .2126 * x.r + .7152 * x.g + .0722 * x.b < .12; };

  // ---------- Peças, materiais e texturas compartilhados ----------
  const geos = {}, mats = {}, texs = {}, cascas = new Map();
  const fixo = x => { x.userData.compartilhado = true; return x; };   // peça de cache: as cenas não liberam
  const geo = (k, criar) => (geos[k] ||= fixo(criar()));
  const caixa = (w, h, d, r, s = 3) => geo(`b${w}|${h}|${d}|${r}|${s}`, () => new THREE.RoundedBoxGeometry(w, h, d, s, r));
  const cil = (rt, rb, h, s = 32) => geo(`c${rt}|${rb}|${h}|${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
  const esfera = (r, meia = false, s = 32) => geo(`e${r}|${meia}|${s}`, () => new THREE.SphereGeometry(r, s, s / 2, 0, Math.PI * 2, 0, meia ? Math.PI / 2 : Math.PI));
  const toro = (r, t, arco = Math.PI * 2, s = 32) => geo(`t${r}|${t}|${arco}|${s}`, () => new THREE.TorusGeometry(r, t, 12, s, arco));
  const lisos = new WeakSet();   // materiais de plástico liso: as peças com eles podem virar uma malha só por articulação
  const plastico = (cor, rug = .32) => (mats[cor + '|' + rug] ||= (m => (lisos.add(m), fixo(m)))(new THREE.MeshStandardMaterial({ color: cor, roughness: rug, metalness: 0 })));
  // Material único das peças lisas mescladas: cor por vértice e rugosidade por vértice (aRug), igual ao plástico de cada peça
  const matMesclado = fixo(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
  matMesclado.onBeforeCompile = sh => {
    sh.vertexShader = 'attribute float aRug;\nvarying float vRug;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvRug = aRug;');
    sh.fragmentShader = 'varying float vRug;\n' + sh.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = vRug;');
  };
  matMesclado.customProgramCacheKey = () => 'boneco-mesclado';
  const tinta = cor => (mats['t' + cor] ||= fixo(new THREE.MeshBasicMaterial({ color: cor, side: THREE.BackSide })));
  const INVISIVEL = fixo(new THREE.MeshBasicMaterial({ visible: false }));
  const semIndice = g => (g.index ? g.toNonIndexed() : g);
  const juntar = lista => THREE.mergeGeometries(lista.map(semIndice));

  // Contorno: casca invertida (vértices soldados, normais suavizadas, empurrados para fora; desenhada só por dentro).
  const ESPESSURA = .045;
  function casca(g, esp = ESPESSURA) {
    const k = g.uuid + esp;
    if (!cascas.has(k)) {
      const base = new THREE.BufferGeometry();
      base.setAttribute('position', g.getAttribute('position'));
      if (g.index) base.setIndex(g.index);
      const c = THREE.mergeVertices(base, 1e-4);
      c.computeVertexNormals();
      const p = c.getAttribute('position'), n = c.getAttribute('normal');
      for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + n.getX(i) * esp, p.getY(i) + n.getY(i) * esp, p.getZ(i) + n.getZ(i) * esp);
      cascas.set(k, fixo(c));
    }
    return cascas.get(k);
  }
  function peca(pai, g, mat, x = 0, y = 0, z = 0, ctn = null) {
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    if (ctn) { const c = new THREE.Mesh(casca(g), ctn); c.castShadow = false; m.add(c); }
    pai.add(m);
    return m;
  }

  // Desempenho (skinning rígido): as peças de plástico liso do boneco inteiro viram UMA malha com esqueleto (cor e rugosidade
  // por vértice; cada vértice preso 100% ao seu grupo: perna, joelho, tronco, braço, cabeça…) e as cascas do contorno, uma
  // por cor. Os grupos continuam sendo animados como antes e servem de ossos. ~31 → ~6 chamadas de desenho por boneco
  // (6 no mapa, até 12 na ONU). Fica de fora o que some ou troca de material: plaquinha de voto, rosto, broche, sombra.
  const _m = new THREE.Matrix4();
  function esqueletar(raiz, proprios, fora) {
    raiz.updateMatrixWorld(true);
    const ossos = [], inv = new THREE.Matrix4().copy(raiz.matrixWorld).invert(), solidas = [], cascas = new Map(), tirar = [];
    const visitar = g => { if (fora.includes(g)) return; ossos.push(g); g.children.forEach(o => o.isGroup && visitar(o)); };
    visitar(raiz);
    const preso = (geo, k) => {   // osso k com peso 1
      const n = geo.getAttribute('position').count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) { si[i * 4] = k; sw[i * 4] = 1; }
      geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
      geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
      return geo;
    };
    const so = (src, nomes) => {   // cópia não indexada só com os atributos pedidos, no espaço da raiz
      const g = src.index ? src.toNonIndexed() : src, out = new THREE.BufferGeometry();
      nomes.forEach(n => out.setAttribute(n, g.getAttribute(n).clone()));
      if (g !== src) g.dispose();
      return out;
    };
    ossos.forEach((g, k) => {
      for (const m of g.children) {
        if (!m.isMesh || m.isInstancedMesh || Array.isArray(m.material) || !m.visible || !lisos.has(m.material) || !m.castShadow) continue;
        if (m.children.some(c => !(c.isMesh && c.material?.side === THREE.BackSide))) continue;   // segura outra coisa: fica como está
        for (const c of m.children) {
          if (!c.isMesh || c.material?.side !== THREE.BackSide) continue;
          if (!cascas.has(c.material)) cascas.set(c.material, []);
          cascas.get(c.material).push(preso(so(c.geometry, ['position']).applyMatrix4(_m.multiplyMatrices(inv, c.matrixWorld)), k));
        }
        const out = so(m.geometry, ['position', 'normal']), n = out.getAttribute('position').count;
        const cl = m.material.color, cor = new Float32Array(n * 3), rug = new Float32Array(n).fill(m.material.roughness);
        for (let i = 0; i < n; i++) { cor[i * 3] = cl.r; cor[i * 3 + 1] = cl.g; cor[i * 3 + 2] = cl.b; }
        out.setAttribute('color', new THREE.BufferAttribute(cor, 3));
        out.setAttribute('aRug', new THREE.BufferAttribute(rug, 1));
        solidas.push(preso(out.applyMatrix4(_m.multiplyMatrices(inv, m.matrixWorld)), k));
        tirar.push(m);
      }
    });
    const esq = new THREE.Skeleton(ossos);
    proprios.push(esq);   // a textura dos ossos é só deste boneco
    const malha = (geos, mat, sombra) => {
      const caixas = ossos.map(() => new THREE.Box3());   // caixa de cada osso, para a caixa da pose (Box3.setFromObject)
      geos.forEach(g => { g.computeBoundingBox(); caixas[g.getAttribute('skinIndex').getX(0)].union(g.boundingBox); });
      const geo = THREE.mergeGeometries(geos); geos.forEach(x => x.dispose());
      const sk = new THREE.SkinnedMesh(geo, mat);
      sk.castShadow = sombra; sk.frustumCulled = false;   // a pose muda o volume: sem teste de visibilidade (são poucos)
      raiz.add(sk); sk.bind(esq); proprios.push(geo);
      // esfera da pose de montagem (só ordena a fila de desenho): a do SkinnedMesh passaria todos os vértices pelos ossos (~30 ms cada)
      geo.computeBoundingSphere(); sk.boundingSphere = geo.boundingSphere.clone();
      // caixa na pose atual (o retrato de corpo inteiro enquadra por ela), montada pelas caixas dos ossos como antes
      const caixa = new THREE.Box3(), tmp = new THREE.Box3(), m = new THREE.Matrix4(), invMalha = new THREE.Matrix4();
      Object.defineProperty(sk, 'boundingBox', { set() {}, get() {
        raiz.updateMatrixWorld(true);   // os ossos na pose de agora
        invMalha.copy(sk.matrixWorld).invert(); caixa.makeEmpty();
        caixas.forEach((c, k) => { if (!c.isEmpty()) caixa.union(tmp.copy(c).applyMatrix4(m.multiplyMatrices(invMalha, ossos[k].matrixWorld).multiply(esq.boneInverses[k]).multiply(sk.bindMatrix))); });
        return caixa;
      } });
      return sk;
    };
    const corpo = solidas.length ? malha(solidas, matMesclado, true) : null;
    for (const [mat, geos] of cascas) malha(geos, mat, false);
    tirar.forEach(m => m.removeFromParent());
    return corpo;
  }

  // Biblioteca de peças do guia (§4.3), também usada pelas cenas: pino com bisel, tijolo/placa com pinos, peça redonda.
  const PERFIL_PINO = [[.3, 0], [.3, .17], [.29, .19], [.265, .2], [0, .2]].map(([x, y]) => new THREE.Vector2(x, y));
  const pino = (s = 16) => geo('pino' + s, () => new THREE.LatheGeometry(PERFIL_PINO, s));
  function bloco(w, h, d, { pinos = true, r = .05, lados = 12 } = {}) {
    return geo(`bl${w}|${h}|${d}|${pinos}|${r}|${lados}`, () => {
      const g = new THREE.RoundedBoxGeometry(w, h, d, 3, r); g.translate(0, h / 2, 0);
      const lista = [g];
      if (pinos) for (let i = 0; i < Math.round(w); i++) for (let k = 0; k < Math.round(d); k++)
        lista.push(pino(lados).clone().translate(-w / 2 + .5 + i, h, -d / 2 + .5 + k));
      return juntar(lista);
    });
  }
  function redonda(r, h, { comPino = true, lados = 40 } = {}) {
    return geo(`rd${r}|${h}|${comPino}|${lados}`, () => {
      const c = Math.min(.05, r * .2), perfil = [[0, 0], [r - c, 0], [r, c], [r, h - c], [r - c, h], [0, h]].map(([x, y]) => new THREE.Vector2(x, y));
      const g = new THREE.LatheGeometry(perfil, lados);
      return comPino ? juntar([g, pino().clone().scale(r > .6 ? 1.6 : 1, 1, r > .6 ? 1.6 : 1).translate(0, h, 0)]) : g;
    });
  }

  function textura(chave, desenhar, w = 128, h = w, filtro) {
    if (!texs[chave]) {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      desenhar(cv.getContext('2d'), w, h);
      const t = texs[chave] = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      if (filtro) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; }
    }
    return texs[chave];
  }
  const texSombra = () => textura('sombra', (g, n) => {
    const gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, n, n);
  }, 64);
  // Forma da equipe desenhada (nunca caractere de fonte): na cor da equipe com traço índigo, ou branca sobre a cor.
  const texForma = (forma, cor) => textura(`f${forma}${cor}`, (g, n) => {
    const p = new Path2D(caminhoForma(forma));
    g.translate(n * .12, n * .12); g.scale(n * .76 / 100, n * .76 / 100);
    g.lineJoin = 'round'; g.lineWidth = 13; g.strokeStyle = TINTA; g.stroke(p);
    g.fillStyle = cor; g.fill(p);
    g.globalAlpha = .28; g.fillStyle = '#fff'; g.save(); g.clip(p); g.fillRect(0, 0, 100, 34); g.restore();   // brilho de cima
  }, 256);

  // ---------- Rosto: canvas transparente na face da frente da cabeça (acompanha a curva; vale para qualquer pele) ----------
  const CAB = { w: 1.3, h: 1.1, d: 1.1, r: .3 };
  const ARCO = CAB.r * Math.PI / 4, LU = CAB.w - 2 * CAB.r + 2 * ARCO, LV = CAB.h - 2 * CAB.r + 2 * ARCO;
  const OLHO_X = .245, OLHO_Y = -.045;
  function desenharRosto(expr, escura, sobr) {
    const W = 512, H = Math.round(512 * LV / LU), cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d'), X = x => (x / LU + .5) * W, Y = y => (.5 - y / LV) * H, T = v => v / LU * W, PI = Math.PI;
    const OLHO = TINTA, BOCA = escura ? '#24101A' : '#6B1020';
    const halo = (desenhar, larg) => { if (!escura) return; g.save(); g.strokeStyle = 'rgba(255,240,228,.3)'; g.lineWidth = larg + 7; desenhar(); g.restore(); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    // bochechas
    if (expr !== 'triste') {
      g.fillStyle = escura ? 'rgba(255,120,120,.28)' : 'rgba(255,110,130,.35)';
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(X(s * .4), Y(-.19), T(.085), T(.05), 0, 0, 7); g.fill(); }
    }
    const olhoAberto = (x, y, ry, rx = .088, dx = 0, dy = 0) => {
      if (escura) { g.fillStyle = 'rgba(255,248,236,.35)'; g.beginPath(); g.ellipse(X(x), Y(y), T(rx) + 3, T(ry) + 3, 0, 0, 7); g.fill(); }
      g.fillStyle = OLHO; g.beginPath(); g.ellipse(X(x), Y(y), T(rx), T(ry), 0, 0, 7); g.fill();
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(X(x + .028 + dx), Y(y + ry * .4 + dy), T(.037), 0, 7); g.fill();
      g.beginPath(); g.arc(X(x - .032 + dx), Y(y - ry * .46 + dy), T(.017), 0, 7); g.fill();
    };
    const arco = (x, y, r, a0, a1, larg) => {
      halo(() => { g.beginPath(); g.arc(X(x), Y(y), T(r), a0, a1); g.stroke(); }, T(larg));
      g.lineWidth = T(larg); g.beginPath(); g.arc(X(x), Y(y), T(r), a0, a1); g.stroke();
    };
    for (const s of [-1, 1]) {
      const x = s * OLHO_X;
      g.strokeStyle = OLHO;
      if (expr === 'piscar') arco(x, OLHO_Y + .05, .085, .22 * PI, .78 * PI, .036);
      else if (expr === 'alegre') arco(x, OLHO_Y - .065, .085, 1.15 * PI, 1.85 * PI, .04);
      else if (expr === 'surpreso') olhoAberto(x, OLHO_Y + .01, .16, .095);
      else if (expr === 'triste') olhoAberto(x, OLHO_Y - .02, .125);
      else if (expr === 'determinado') olhoAberto(x, OLHO_Y, .125);
      else if (expr === 'pensativo') olhoAberto(x, OLHO_Y + .005, .13, .088, .014, .025);
      else olhoAberto(x, OLHO_Y, .14);
      // sobrancelhas
      g.save();
      let ang = 0, sobe = 0;
      if (expr === 'triste') ang = s * .36;
      else if (expr === 'surpreso') sobe = .06;
      else if (expr === 'alegre') sobe = .025;
      else if (expr === 'determinado') { ang = -s * .35; sobe = -.03; }
      else if (expr === 'pensativo') { sobe = s > 0 ? .06 : -.005; ang = s > 0 ? -.12 : .06; }
      g.translate(X(x), Y(.165 + sobe)); g.rotate(ang);
      halo(() => { g.beginPath(); g.arc(0, T(.06), T(.085), 1.28 * PI, 1.72 * PI); g.stroke(); }, T(.036));
      g.strokeStyle = escura ? TINTA : sobr; g.lineWidth = T(escura ? .04 : .034);
      g.beginPath(); g.arc(0, T(.06), T(.085), 1.28 * PI, 1.72 * PI); g.stroke();
      g.restore();
    }
    // boca
    const my = -.235;
    g.strokeStyle = BOCA; g.fillStyle = BOCA;
    if (expr === 'alegre' || expr === 'falando') {
      const lb = expr === 'alegre' ? .115 : .075, ab = expr === 'alegre' ? .11 : .085;
      g.beginPath(); g.moveTo(X(-lb), Y(my + .03)); g.quadraticCurveTo(X(0), Y(my + .05), X(lb), Y(my + .03));
      g.bezierCurveTo(X(lb), Y(my - ab * .9), X(-lb), Y(my - ab * .9), X(-lb), Y(my + .03)); g.closePath();
      if (escura) { g.save(); g.strokeStyle = 'rgba(255,240,228,.32)'; g.lineWidth = 7; g.stroke(); g.restore(); }
      g.fill();
      g.save(); g.clip(); g.fillStyle = '#F06A7A'; g.beginPath(); g.ellipse(X(0), Y(my - ab * .62), T(lb * .62), T(ab * .38), 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.fillRect(X(-lb), Y(my + .05), T(lb * 2), T(.03)); g.restore();
    } else if (expr === 'falando2') {
      g.beginPath(); g.ellipse(X(0), Y(my - .01), T(.07), T(.035), 0, 0, 7); g.fill();
    } else if (expr === 'triste') arco(0, my - .115, .105, 1.26 * PI, 1.74 * PI, .038);
    else if (expr === 'surpreso') { g.beginPath(); g.ellipse(X(0), Y(my - .015), T(.05), T(.065), 0, 0, 7); g.fill(); }
    else if (expr === 'pensativo') {
      const d = () => { g.beginPath(); g.moveTo(X(-.02), Y(my - .005)); g.quadraticCurveTo(X(.06), Y(my - .03), X(.12), Y(my + .01)); g.stroke(); };
      halo(d, T(.034)); g.lineWidth = T(.034); d();
    } else if (expr === 'determinado') {
      const d = () => { g.beginPath(); g.moveTo(X(-.08), Y(my)); g.quadraticCurveTo(X(.02), Y(my - .02), X(.1), Y(my + .02)); g.stroke(); };
      halo(d, T(.036)); g.lineWidth = T(.036); d();
    } else arco(0, my + .06, .1, .2 * PI, .8 * PI, escura ? .04 : .034);   // feliz e piscar
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  const rosto = (expr, escura, sobr) => (texs[`r${expr}${escura}${sobr}`] ||= desenharRosto(expr, escura, sobr));

  // Rosto do computador: pixels ciano numa tela índigo (guia §7.5)
  const PIXELS = {
    feliz: ['....................', '....................', '....##........##....', '...####......####...', '...####......####...', '....##........##....',
      '....................', '.....#..........#...', '......##......##....', '........######......', '....................', '....................'],
    alegre: ['....................', '....................', '....##........##....', '...#..#......#..#...', '..#....#....#....#..', '....................',
      '.....############...', '.....#..........#...', '......#........#....', '.......########.....', '....................', '....................'],
    triste: ['....................', '....................', '....................', '...####......####...', '...####......####...', '....##........##....',
      '....................', '........######......', '......##......##....', '.....#..........#...', '....................', '....................'],
    surpreso: ['....................', '...####......####...', '..##..##....##..##..', '..##..##....##..##..', '...####......####...', '....................',
      '.........##........', '........#..#.......', '........#..#.......', '.........##........', '....................', '....................'],
    pensando: ['....................', '....................', '.....##........##...', '....####......####..', '....####......####..', '.....##........##...',
      '....................', '....................', '....##...##...##....', '....##...##...##....', '....................', '....................'],
  };
  const PIXEL_DE = { feliz: 'feliz', piscar: 'feliz', alegre: 'alegre', triste: 'triste', surpreso: 'surpreso', pensativo: 'pensando',
    determinado: 'feliz', falando: 'alegre', falando2: 'feliz' };
  const texMonitor = expr => textura('m' + expr, (g, w, h) => {
    const p = PIXELS[PIXEL_DE[expr] || 'feliz'], px = w / 20;
    g.fillStyle = '#141029'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(111,231,255,.07)'; for (let y = 0; y < 12; y++) g.fillRect(0, y * px + px * .5, w, 1);
    g.fillStyle = '#6FE7FF';
    p.forEach((linha, y) => [...linha].forEach((c, x) => { if (c === '#') g.fillRect(x * px + 1, y * px + 1, px - 2, px - 2); }));
  }, 320, 192, true);

  // ---------- Cabelo: um casco só, com a frente logo atrás do rosto ----------
  const COBREM = ['cartola', 'capacete', 'bone', 'explorador', 'capacete-paz', 'astronauta'];   // o cabelo fica por baixo
  function cabelo(cab, estilo, cor, ctn, cobre) {
    const m = plastico(cor, .55), topoCabeca = CAB.h + .02, frente = CAB.d / 2 - .01;
    if (estilo === 'careca') return topoCabeca;
    const casco = (w, h, d, r, y) => peca(cab, caixa(w, h, d, r), m, 0, y, frente - d / 2, ctn), costas = frente - 1.18;
    if (estilo === 'longo') peca(cab, caixa(1.44, 1.02, .38, .16), m, 0, .5, costas + .19, ctn);
    else peca(cab, caixa(1.42, .82, .42, .2), m, 0, .56, costas + .21, ctn);
    if (estilo === 'trancas') for (const s of [-1, 1]) for (let i = 0; i < 3; i++)   // tranças descendo atrás das orelhas
      peca(cab, esfera(.15 - i * .015, false, 16), m, s * .55, .32 - i * .2, costas + .32, ctn).scale.set(1, .9, 1);
    if (estilo === 'black' && !cobre) {   // nuvem de cachos: bolotas que se sobrepõem (silhueta fofa, não capacete)
      casco(1.5, .8, 1.3, .38, 1.0);
      [[0, 1.34, -.12, .5], [-.46, 1.22, -.1, .44], [.46, 1.22, -.1, .44], [-.62, .9, -.18, .38], [.62, .9, -.18, .38],
        [-.3, 1.3, .22, .38], [.3, 1.3, .22, .38], [0, 1.1, -.5, .5], [-.5, .78, -.5, .4], [.5, .78, -.5, .4]]
        .forEach(([x, y, z, r]) => peca(cab, esfera(r, false, 20), m, x, y, z, ctn));
      return 1.6;
    }
    if (cobre) casco(1.42, .5, 1.18, .2, .82); else casco(1.42, .7, 1.18, .3, .93);
    if (cobre) return topoCabeca;
    if (estilo === 'franja') peca(cab, caixa(.74, .22, .16, .08), m, -.2, .95, .56, ctn).rotation.z = .2;
    if (estilo === 'coque') peca(cab, esfera(.3), m, 0, 1.3, -.36, ctn);
    if (estilo === 'trancas') for (const s of [-1, 1]) peca(cab, esfera(.09, false, 12), plastico(AMARELO, .3), s * .55, -.3, costas + .32);
    return 1.28;
  }

  // ---------- Chapéus: 1,15 a 1,3 vez a largura da cabeça, com o mesmo contorno do corpo ----------
  function chapeu(tipo, cor, ctn, topo) {
    const g = new THREE.Group(), add = (gg, mat, x = 0, y = 0, z = 0) => peca(g, gg, mat, x, y, z, ctn);
    const PRETO = plastico('#24252D', .4), CINZA = plastico('#2B2D3A', .45);
    if (tipo === 'cartola') {
      g.position.y = topo - .06; g.rotation.z = -.08;
      add(cil(.84, .84, .07, 40), PRETO, 0, .035);
      add(cil(.56, .58, .86), PRETO, 0, .5);
      add(cil(.6, .61, .17), plastico(cor), 0, .17);
    } else if (tipo === 'capacete' || tipo === 'capacete-paz') {
      const paz = tipo === 'capacete-paz', am = plastico(paz ? '#8FD3FF' : '#FFC21A', .28);
      g.position.y = topo - .3;
      add(esfera(.76, true), am).scale.set(1, .8, .94);
      add(cil(paz ? .9 : .84, paz ? .9 : .84, .05, 40), am, 0, .02);
      if (paz) add(toro(.72, .06, Math.PI * 2, 40), plastico('#FFFFFF', .3), 0, .14).rotation.x = Math.PI / 2;   // faixa branca, sem emblema
      else {
        add(caixa(.92, .06, .34, .03), am, 0, .03, .78);
        add(geo('crista', () => new THREE.TorusGeometry(.7, .075, 10, 24, Math.PI).rotateY(Math.PI / 2)), am).scale.y = .86;
      }
    } else if (tipo === 'bone') {
      const m = plastico(cor);
      g.position.y = topo - .26;
      add(esfera(.74, true), m).scale.set(1, .62, .92);
      add(caixa(.8, .06, .56, .03), m, 0, .03, .9).rotation.x = .08;
      add(esfera(.075, false, 16), m, 0, .45);
    } else if (tipo === 'astronauta') {
      g.position.y = .02;
      add(geo('gola', () => new THREE.TorusGeometry(.6, .13, 14, 36).rotateX(Math.PI / 2)), plastico('#F3F5FA', .35));
      for (const s of [-1, 1]) add(cil(.12, .12, .1, 20), plastico('#C9D2E3', .35), s * .97, .72).rotation.z = Math.PI / 2;
      const vidro = new THREE.Mesh(esfera(.95), mats.vidro ||= new THREE.MeshStandardMaterial({
        color: '#DDEEFF', roughness: .05, metalness: 0, transparent: true, opacity: .22, depthWrite: false, envMapIntensity: 1.6 }));
      vidro.position.y = .72; vidro.renderOrder = 2; g.add(vidro);
      const brilho = new THREE.Mesh(geo('brilho', () => new THREE.TorusGeometry(.93, .035, 6, 20, .9)),
        mats.brilho ||= new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: .75, depthWrite: false }));
      brilho.position.y = .72; brilho.rotation.set(0, -.5, 1.9); brilho.renderOrder = 3; g.add(brilho);
    } else if (tipo === 'explorador') {
      const caqui = plastico('#D9B57A', .55);
      g.position.y = topo - .08; g.rotation.z = .06;
      add(cil(1.0, 1.0, .06, 40), caqui, 0, .03);
      add(cil(.5, .6, .48), caqui, 0, .3);
      add(cil(.61, .62, .13), plastico('#6B4423', .5), 0, .12);
    } else if (tipo === 'coroa-louros') {
      g.position.y = topo - .22; g.scale.setScalar(topo > 1.3 ? 1.12 : 1);
      [0, 1].forEach(par => peca(g, geo('louros' + par, () => {
        const folha = new THREE.SphereGeometry(.15, 10, 6), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), lista = [];
        for (let k = par; k < 10; k += 2) for (const lado of [-1, 1]) {
          const a = lado * (.3 + k * .27), dx = lado * Math.cos(a) * .78, dz = -lado * Math.sin(a) * .68;
          e.set(-.6, Math.atan2(dx, dz), lado * .35);
          m4.compose(new THREE.Vector3(Math.sin(a) * .78, (k % 2) * .06, Math.cos(a) * .68), q.setFromEuler(e), new THREE.Vector3(.5, .3, 1.3));
          lista.push(folha.clone().applyMatrix4(m4));
        }
        return juntar(lista);
      }), plastico(par ? '#2E9440' : '#4CC459', .45)));
    } else if (tipo === 'oculos') {
      g.position.set(0, .57 + OLHO_Y, .565);
      const lente = mats.lente ||= new THREE.MeshStandardMaterial({ color: '#BFE3FF', roughness: .05, transparent: true, opacity: .28, depthWrite: false });
      for (const s of [-1, 1]) {
        add(geo('aro', () => new THREE.TorusGeometry(.16, .032, 10, 28)), PRETO, s * OLHO_X);
        const l = new THREE.Mesh(geo('lente', () => new THREE.CircleGeometry(.16, 28)), lente); l.position.x = s * OLHO_X; g.add(l);
        add(caixa(.3, .04, .04, .015), PRETO, s * .52, .03);
        add(caixa(.04, .04, .62, .015), PRETO, s * .665, .03, -.3);
      }
      add(caixa(.13, .035, .035, .012), PRETO, 0, .03);
    } else if (tipo === 'oculos-lab') {   // óculos de proteção levantados na testa: os olhos continuam à vista
      g.position.set(0, .93, .5); g.rotation.x = -.35;
      add(geo('armacaoLab', () => {
        const ret = (w, h, r, x = 0) => { const s = new THREE.Path(); const x0 = x - w / 2, y0 = -h / 2;
          s.moveTo(x0 + r, y0); s.lineTo(x0 + w - r, y0); s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r); s.lineTo(x0 + w, y0 + h - r);
          s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h); s.lineTo(x0 + r, y0 + h); s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
          s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0); return s; };
        const forma = new THREE.Shape(ret(1.16, .4, .17).getPoints(6));
        forma.holes.push(ret(.44, .26, .1, -.27), ret(.44, .26, .1, .27));
        return new THREE.ExtrudeGeometry(forma, { depth: .07, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 2, curveSegments: 6 });
      }), plastico('#4F90C6', .3));
      const lente = mats.lenteLab ||= new THREE.MeshStandardMaterial({ color: '#BFE6FF', roughness: .05, transparent: true, opacity: .8, depthWrite: false, envMapIntensity: 1.5 });
      for (const s of [-1, 1]) {
        const l = new THREE.Mesh(caixa(.46, .28, .03, .012, 2), lente); l.position.set(s * .27, 0, .04); g.add(l);
        const br = new THREE.Mesh(caixa(.07, .2, .01, .004, 1), plastico('#FFFFFF', .2)); br.position.set(s * .27 - .1, .01, .062); br.rotation.z = -.5; g.add(br);
      }
      const faixa = new THREE.Mesh(geo('faixaLab', () => new THREE.TorusGeometry(.69, .045, 8, 40)), plastico(PRETA, .5));
      faixa.rotation.x = Math.PI / 2; faixa.scale.set(1, .86, 1); faixa.position.set(0, -.05, -.5); g.add(faixa);
    } else if (tipo === 'fone') {
      g.position.y = .57;
      add(geo('arcoFone', () => new THREE.TorusGeometry(.72, .065, 10, 32, Math.PI)), CINZA);
      for (const s of [-1, 1]) add(cil(.24, .24, .16, 28), plastico(cor), s * .74).rotation.z = Math.PI / 2;
      const haste = add(cil(.025, .025, .5, 8), CINZA, -.58, -.2, .3);
      haste.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(.5, -.3, .8).normalize());
      add(esfera(.065, false, 16), CINZA, -.44, -.29, .52);
    }
    return g;
  }

  // ---------- Acessórios de mão (os objetos do kit em versão de peça), presos à mão esquerda ----------
  const texPapel = () => textura('papel', (g, w, h) => {
    g.fillStyle = LADRILHO; g.fillRect(0, 0, w, h);
    g.fillStyle = '#B9B3D6'; for (let i = 0; i < 5; i++) g.fillRect(w * .16, h * (.2 + i * .15), w * (i % 2 ? .5 : .68), h * .045);
    g.strokeStyle = '#2FCB62'; g.lineWidth = w * .07; g.lineCap = g.lineJoin = 'round';
    g.beginPath(); g.moveTo(w * .58, h * .78); g.lineTo(w * .68, h * .87); g.lineTo(w * .86, h * .66); g.stroke();
  }, 128, 160);
  const texGlobo = () => textura('globoMao', (g, w, h) => {
    g.fillStyle = '#38B1DC'; g.fillRect(0, 0, w, h); g.fillStyle = '#7CCB4E';
    [[.18, .32, .1, .14], [.27, .62, .06, .14], [.5, .3, .08, .1], [.53, .55, .07, .14], [.72, .3, .14, .12], [.84, .68, .06, .06]]
      .forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(x * w, y * h, rx * w, ry * h, 0, 0, 7); g.fill(); });
    g.fillStyle = '#F6FAFD'; g.fillRect(0, 0, w, h * .07); g.fillRect(0, h * .93, w, h * .07);
  }, 256, 128);
  function acessorio(tipo, ctn) {
    const g = new THREE.Group(), add = (gg, mat, x = 0, y = 0, z = 0) => peca(g, gg, mat, x, y, z, ctn);
    if (tipo === 'prancheta') {
      g.position.set(0, -.6, .22); g.rotation.set(-.25, 0, .1);
      add(caixa(.5, .66, .05, .03), plastico('#B0743C', .4));
      const papel = new THREE.Mesh(geo('papelG', () => new THREE.PlaneGeometry(.42, .52)), mats.papel ||= new THREE.MeshStandardMaterial({ map: texPapel(), roughness: .5 }));
      papel.position.set(0, -.03, .03); g.add(papel);
      add(caixa(.22, .09, .07, .025), plastico('#A0A5A9', .3), 0, .3, .02);
    } else if (tipo === 'megafone') {
      g.position.set(-.05, -.62, .12); g.rotation.set(-.5, 0, .95); g.scale.setScalar(1.25);   // de lado, com a boca à mostra
      add(cil(.21, .09, .44, 28), plastico(AMARELO, .28), 0, .1);          // cone amarelo (guia §4.4)
      add(cil(.225, .225, .07, 28), plastico('#F0303A', .3), 0, .33);      // aro vermelho
      add(caixa(.09, .22, .1, .03), plastico(PRETA, .4), 0, -.06, -.12);   // punho
    } else if (tipo === 'maleta') {
      g.position.set(0, -.92, 0);
      add(caixa(.66, .46, .2, .06), plastico('#8A5A2E', .4));
      add(toro(.11, .03, Math.PI, 16), plastico(PRETA, .4), 0, .23);
      for (const s of [-1, 1]) add(caixa(.07, .07, .04, .015), plastico('#FFC93C', .3), s * .2, .12, .11);
    } else if (tipo === 'livro') {
      g.position.set(0, -.62, .16); g.rotation.set(-.3, .2, 0);
      add(caixa(.5, .64, .15, .03), plastico('#4F90C6', .35));
      add(caixa(.42, .58, .12, .01), plastico(LADRILHO, .5), .05, 0, 0);
      add(caixa(.1, .64, .155, .02), plastico(AMARELO, .3), -.22, 0, 0);
    } else if (tipo === 'globo') {
      g.position.set(0, -.72, .1);
      add(cil(.16, .2, .07, 24), plastico(PRETA, .4), 0, -.03);
      add(toro(.27, .025, Math.PI, 24), plastico(AMARELO, .3), 0, .3).rotation.set(0, Math.PI / 2, -.4);
      const bola = new THREE.Mesh(esfera(.24), mats.globoMao ||= new THREE.MeshStandardMaterial({ map: texGlobo(), roughness: .3 }));
      bola.position.y = .3; bola.rotation.z = .4; bola.castShadow = true; g.add(bola);
      bola.add(new THREE.Mesh(casca(esfera(.24)), ctn || tinta(TINTA)));
    } else if (tipo === 'microfone') {
      g.position.set(-.02, -.58, .14); g.rotation.set(-.5, 0, .35); g.scale.setScalar(1.2);
      add(cil(.065, .05, .46, 16), plastico(PRETA, .4), 0, .08);
      add(cil(.09, .09, .07, 16), plastico(AMARELO, .3), 0, .3);
      add(esfera(.15, false, 20), plastico('#D5DEEA', .35), 0, .43);
    } else if (tipo === 'luneta') {
      g.position.set(-.08, -.6, .12); g.rotation.set(-.55, 0, .75);
      add(cil(.1, .1, .3, 24), plastico(AMARELO, .28), 0, -.05);
      add(cil(.08, .08, .26, 24), plastico(AMARELO, .28), 0, .2);
      add(cil(.065, .065, .2, 24), plastico(AMARELO, .28), 0, .4);
      for (const y of [.1, .33]) add(cil(.105, .105, .04, 24), plastico(PRETA, .4), 0, y);
    } else return null;
    return g;
  }

  // ---------- Montagem do boneco ----------
  function resolver(av) {
    const eq = EQUIPES[av.pid], cor = '#' + new THREE.Color(av.cor || eq?.cor || '#9AA3B8').getHexString().toUpperCase();
    const daEquipe = eq && eq.cor.toUpperCase() === cor;
    return {
      cor, eq: daEquipe ? eq : null,
      calca: av.calca || (daEquipe ? eq.sombra : sombraDe(cor)),
      contorno: daEquipe ? eq.contorno : contornoDe(cor),
      forma: av.forma === null ? null : (av.forma || eq?.forma || null),
      pele: corDaLista(PELES, av.pele, '#F2C08E'),
      cabelo: corDaLista(CABELOS, av.cabelo, '#3B2414'),
      penteado: PENTEADOS.some(p => p.id === av.penteado) ? av.penteado : 'curto',
      chapeu: CHAPEUS.some(p => p.id === av.chapeu) ? av.chapeu : 'nenhum',
      acessorio: ACESSORIOS.some(p => p.id === av.acessorio) ? av.acessorio : 'nenhum',
      monitor: av.humano === false,
      roupa: av.roupa || null,
    };
  }

  const ease = {
    backOut: (x, s = 1.70158) => 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2,
    out: x => 1 - (1 - x) ** 2,
    in: x => x * x,
    inOut: x => (x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2),
  };
  const lim = x => Math.min(1, Math.max(0, x));
  const DUR = { acenar: 1.2, pular: .8, comemorar: 1.6, palmas: 1.2, triste: 1.5, surpreso: .6, votar: .9, girar: 1, apontar: 0, falar: 0,
    'bracos-cruzados': 0, pensar: 0, parado: 0 };
  const EXPR_DA_ACAO = { comemorar: 'alegre', palmas: 'alegre', pular: 'alegre', girar: 'alegre', triste: 'triste', surpreso: 'surpreso',
    votar: 'determinado', falar: 'falando', pensar: 'pensativo' };

  function criar(avatar = {}, { base = false, contorno = true, tijolinhos: comTijolinhos = true, mesclar = true } = {}) {
    const a = resolver(avatar);
    const ctn = contorno ? tinta(a.contorno) : null, ctnK = contorno ? tinta(TINTA) : null, escura = peleEscura(a.pele);
    const sobr = a.cabelo === '#C9CCD1' || a.cabelo === '#E8C25A' ? mistura(a.cabelo, '#3B2414', .55) : mistura(a.cabelo, TINTA, .35);
    const terno = a.roupa === 'terno';
    const mCamisa = plastico(terno ? '#4A4F5C' : a.cor, .32), mCalca = plastico(terno ? '#33363F' : a.calca, .4);
    const mPele = plastico(a.pele, .28), mEscuro = plastico(GRAFITE, .45);
    const b = new THREE.Group(), corpo = new THREE.Group();
    b.name = 'boneco'; b.userData.avatar = avatar;
    b.add(corpo);
    const proprios = [];   // o que é só deste boneco (descartar)

    const sombra = new THREE.Mesh(geo('sombra', () => new THREE.PlaneGeometry(2, 1.6).rotateX(-Math.PI / 2)),
      mats.sombra ||= new THREE.MeshBasicMaterial({ color: '#0B1F4B', map: texSombra(), transparent: true, opacity: .45, depthWrite: false }));
    sombra.position.y = .012; sombra.renderOrder = -1;
    b.add(sombra);
    let alturaBase = 0;
    if (base) {   // base de peão (guia §7.8): separa o boneco do território da própria cor
      peca(b, cil(1.05, 1.1, .22, 40), plastico(TINTA, .4), 0, .11);
      peca(b, cil(.96, .96, .28, 40), plastico(CREME, .3), 0, .36);
      alturaBase = .5; sombra.position.y = alturaBase + .012;
    }
    corpo.position.y = alturaBase;

    const perna = lado => {   // coxa + joelho (canela e sapato): dobra para sentar e para encolher no pulo
      const p = new THREE.Group(); p.position.set(lado * .24, .78, 0); corpo.add(p);
      peca(p, caixa(.4, .38, .46, .12), mCalca, 0, -.19, 0, ctn);
      const j = new THREE.Group(); j.position.y = -.3; p.add(j);
      peca(j, caixa(.4, .34, .46, .12), mCalca, 0, -.15, 0, ctn);
      peca(j, caixa(.44, .22, .6, .09), mEscuro, 0, -.37, .05, ctn);
      p.userData.joelho = j;
      return p;
    };
    const pernaE = perna(-1), pernaD = perna(1);
    const sentado = a.acessorio === 'cadeira';
    if (sentado) {   // cadeira de rodas (guia §7.3, inclusão): assento, encosto, rodas grandes com aro e rodinhas da frente
      const ch = new THREE.Group(); corpo.add(ch);
      const mG = plastico(GRAFITE, .4), mAro = plastico('#D5DEEA', .3), mCubo = plastico(AMARELO, .28);
      peca(ch, caixa(1.0, .14, .78, .05), mG, 0, .52, .08, ctn);
      peca(ch, caixa(.86, .06, .3, .025), mG, 0, .03, .5, ctn);   // apoio dos pés
      for (const s of [-1, 1]) peca(ch, cil(.04, .04, .3, 10), mAro, s * .66, .46, -.04).rotation.z = Math.PI / 2;   // eixo até a roda
      peca(ch, caixa(1.0, .76, .12, .05), mG, 0, .98, -.36, ctn);
      for (const s of [-1, 1]) {
        peca(ch, cil(.05, .05, .5, 12), mAro, s * .44, 1.36, -.36).rotation.x = .3;
        const roda = new THREE.Group(); roda.position.set(s * .86, .46, -.04); roda.rotation.z = Math.PI / 2; ch.add(roda);
        peca(roda, geo('pneu', () => new THREE.TorusGeometry(.4, .075, 12, 40).rotateX(Math.PI / 2)), plastico(PRETA, .5), 0, 0, 0, ctn);
        peca(roda, cil(.36, .36, .05, 32), mAro);
        peca(roda, cil(.11, .11, .09, 20), mCubo, 0, 0, 0, ctn);
        peca(ch, cil(.035, .035, .48, 10), mAro, s * .4, .3, .42);
        peca(ch, cil(.1, .1, .07, 20), plastico(PRETA, .5), s * .4, .1, .48).rotation.z = Math.PI / 2;
      }
    }
    const tronco = new THREE.Group(); tronco.position.y = .74; corpo.add(tronco);
    const gTronco = geo('tronco', () => {   // levemente trapezoidal: ombros mais largos que a cintura
      const g = new THREE.RoundedBoxGeometry(1.0, .78, .6, 3, .17), p = g.getAttribute('position');
      for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * (.94 + .06 * (p.getY(i) + .39) / .78));
      g.computeVertexNormals(); return g;
    });
    peca(tronco, caixa(1.0, .14, .62, .06), mEscuro, 0, .1, 0, ctn);
    const camisa = peca(tronco, gTronco, mCamisa, 0, .51, 0, ctn);
    peca(tronco, cil(.17, .19, .16, 20), mPele, 0, .92);
    if (terno) {   // âncora do telejornal: camisa branca e gravata amarela
      peca(tronco, caixa(.34, .5, .04, .02), plastico('#FFFFFF', .4), 0, .62, .3);
      peca(tronco, caixa(.12, .09, .05, .02), plastico(AMARELO, .3), 0, .82, .33, ctnK);
      peca(tronco, caixa(.12, .36, .04, .02), plastico(AMARELO, .3), 0, .6, .33, ctnK);
    } else if (a.forma && caminhoForma(a.forma)) {   // broche: disco creme com aro índigo e a forma da equipe
      const disco = peca(tronco, cil(.24, .24, .05, 36), plastico(CREME, .3), 0, .52, .31, ctnK);
      disco.rotation.x = Math.PI / 2;
      const f = new THREE.Mesh(geo('broche', () => new THREE.PlaneGeometry(.36, .36)),
        mats['f' + a.forma + a.cor] ||= new THREE.MeshStandardMaterial({ map: texForma(a.forma, a.cor), transparent: true, roughness: .3,
          polygonOffset: true, polygonOffsetFactor: -1 }));
      f.position.set(0, .52, .338); tronco.add(f);
    }
    const braco = lado => {
      const p = new THREE.Group(); p.position.set(lado * .62, .8, 0); tronco.add(p);
      peca(p, caixa(.3, .52, .36, .12), mCamisa, 0, -.2, 0, ctn);
      peca(p, caixa(.28, .27, .31, .11), mPele, 0, -.55, 0, ctn);
      return p;
    };
    const bracoE = braco(-1), bracoD = braco(1);
    const item = acessorio(a.acessorio, ctn);
    if (item) bracoE.add(item);
    // plaquinha de voto (ladrilho 1×2 creme com a forma): só aparece ao votar
    const placa = new THREE.Group(); placa.position.set(0, -.62, .1); placa.rotation.x = Math.PI; placa.visible = false; bracoD.add(placa);
    peca(placa, cil(.035, .035, .5, 10), plastico('#B0743C', .4), 0, .05, 0);
    peca(placa, caixa(.62, .5, .06, .03), plastico(LADRILHO, .35), 0, .5, 0, ctnK);
    if (a.forma && caminhoForma(a.forma)) {
      const f = new THREE.Mesh(geo('formaPlaca', () => new THREE.PlaneGeometry(.38, .38)),
        mats['f' + a.forma + a.cor] || new THREE.MeshStandardMaterial({ map: texForma(a.forma, a.cor), transparent: true }));
      f.position.set(0, .5, .035); placa.add(f);
    }

    const cabeca = new THREE.Group(); cabeca.position.y = .96; tronco.add(cabeca);
    let mRosto = null, mTela = null;
    if (a.monitor) {   // computador: cabeça de monitor com rosto de pixels e antena
      peca(cabeca, cil(.16, .2, .12, 20), mEscuro, 0, .04);
      peca(cabeca, caixa(1.3, 1.0, .9, .2, 4), plastico(PRETA, .35), 0, .6, 0, ctnK);
      mTela = new THREE.MeshStandardMaterial({ color: '#FFFFFF', map: texMonitor('feliz'), emissive: '#FFFFFF', emissiveMap: texMonitor('feliz'),
        emissiveIntensity: .6, roughness: .2 });
      proprios.push(mTela);
      peca(cabeca, caixa(1.16, .86, .04, .1, 2), plastico('#3D3866', .3), 0, .62, .455);
      const tela = new THREE.Mesh(caixa(1.04, .74, .04, .08, 2), [INVISIVEL, INVISIVEL, INVISIVEL, INVISIVEL, mTela, INVISIVEL]);
      tela.position.set(0, .62, .47); cabeca.add(tela);
      peca(cabeca, cil(.025, .025, .42, 8), mEscuro, .3, 1.28, 0).rotation.z = -.25;
      peca(cabeca, esfera(.1, false, 16), plastico(AMARELO, .28), .36, 1.5, 0, ctnK);
    } else {
      const gCab = caixa(CAB.w, CAB.h, CAB.d, CAB.r, 4);
      peca(cabeca, gCab, mPele, 0, CAB.h / 2 + .02, 0, ctn);
      mRosto = new THREE.MeshStandardMaterial({ map: rosto('feliz', escura, sobr), transparent: true, roughness: .4, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      proprios.push(mRosto);
      const face = new THREE.Mesh(gCab, [INVISIVEL, INVISIVEL, INVISIVEL, INVISIVEL, mRosto, INVISIVEL]);
      face.position.y = CAB.h / 2 + .02; cabeca.add(face);
      const topo = cabelo(cabeca, a.penteado, a.cabelo, ctn, COBREM.includes(a.chapeu));
      if (a.chapeu !== 'nenhum') cabeca.add(chapeu(a.chapeu, terno ? '#4A4F5C' : a.chapeu === 'cartola' && !a.eq && avatar.faixa ? avatar.faixa : a.cor, ctn, topo));
    }
    if (terno && a.chapeu === 'nenhum' && !a.monitor) cabeca.add(chapeu('fone', AMARELO, ctn, 1.28));

    // Tijolinhos da comemoração (12–20 na cor da equipe), em espaço local
    const N_TIJ = 16;
    const tijolinhos = new THREE.InstancedMesh(bloco(1, .6, 1, { lados: 8 }), plastico(a.cor, .3), N_TIJ);
    tijolinhos.frustumCulled = false; tijolinhos.count = 0; tijolinhos.castShadow = false;
    b.add(tijolinhos);
    const part = Array.from({ length: N_TIJ }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), s: 1 }));
    let partInicio = -1;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), esc = new THREE.Vector3();
    function soltarTijolinhos(t) {
      if (REDUZ) return;
      partInicio = t;
      part.forEach(p => {
        const ang = Math.random() * Math.PI * 2, vel = 1.5 + Math.random() * 2;
        p.p.set(0, alturaBase + 2.2, 0); p.v.set(Math.cos(ang) * vel, 5 + Math.random() * 3, Math.sin(ang) * vel);
        p.r.set(Math.random() * 6, Math.random() * 6, 0); p.w.set(Math.random() * 8 - 4, Math.random() * 8 - 4, Math.random() * 8 - 4);
        p.s = .16 + Math.random() * .1;
      });
      tijolinhos.count = N_TIJ;
    }
    function tiqueTijolinhos(t, dt) {
      if (partInicio < 0) return;
      const vida = t - partInicio;
      if (vida > 1.4) { tijolinhos.count = 0; partInicio = -1; return; }
      part.forEach((p, i) => {
        p.v.y -= 18 * dt; p.p.addScaledVector(p.v, dt);
        if (p.p.y < alturaBase + .1) { p.p.y = alturaBase + .1; p.v.y *= -.3; p.v.x *= .6; p.v.z *= .6; }
        p.r.x += p.w.x * dt; p.r.y += p.w.y * dt; p.r.z += p.w.z * dt;
        const s = p.s * (vida > 1.1 ? Math.max(0, 1 - (vida - 1.1) / .3) : Math.min(1, vida / .08));
        m4.compose(p.p, q.setFromEuler(p.r), esc.set(s, s, s));
        tijolinhos.setMatrixAt(i, m4);
      });
      tijolinhos.instanceMatrix.needsUpdate = true;
    }

    // ---------- Animação: pose = função do tempo da ação; transições suavizadas ----------
    const est = { acao: 'parado', t0: agora(), dur: 0, expr: 'feliz', mostrando: '', piscaEm: agora() + 1 + Math.random() * 3,
      olharEm: agora() + 3 + Math.random() * 4, olharDir: 1, olhar: 0, ultimo: 0, congelado: false, fase: Math.random() * 6 };
    const REPOUSO = { y: 0, sy: 1, giro: 0, bEx: 0, bEz: -.07, bDx: 0, bDz: .07, cabX: 0, cabY: 0, cabZ: 0, troX: 0, corZ: 0, pEx: 0, pDx: 0 };
    const atual = { ...REPOUSO };
    if (item) { atual.bEx = REPOUSO.bEx = -.45; }

    function poseAlvo(a, t) {
      const P = { ...REPOUSO }, anima = !REDUZ;
      if (anima) {   // respiração e balanço sutis
        const f = t * 2.2 + est.fase;
        P.cabZ = Math.sin(f * .55) * .035; P.bEz -= Math.sin(f) * .025; P.bDz += Math.sin(f) * .025;
      }
      P.cabY = est.olhar;
      if (est.acao === 'parado' && anima && !est.congelado) {   // olha para o lado de vez em quando
        if (t > est.olharEm + 1.6) { est.olharEm = t + 4 + Math.random() * 4; est.olharDir = Math.random() < .5 ? -1 : 1; }
        else if (t > est.olharEm) { const k = t - est.olharEm; P.cabY += est.olharDir * .35 * (k < .4 ? ease.inOut(k / .4) : k > 1.2 ? 1 - ease.inOut((k - 1.2) / .4) : 1); }
      }
      switch (est.acao) {
        case 'acenar': {
          const sobe = ease.backOut(lim(a / .18), 2.6), desce = ease.in(lim((a - .95) / .25));
          const balanca = anima && a > .18 && a < .95 ? Math.sin((a - .18) * Math.PI * 2 * 3) * .35 : 0;
          P.bDz = REPOUSO.bDz + (2.6 - REPOUSO.bDz) * sobe * (1 - desce) + balanca;
          P.cabZ = -.1 * sobe * (1 - desce); P.corZ = .05 * sobe * (1 - desce); break;
        }
        case 'pular': Object.assign(P, pulo(a, 1.6, anima)); break;
        case 'comemorar': {
          const k = a % .8, braco = lim(a / .12) * (1 - lim((a - 1.45) / .15));
          Object.assign(P, pulo(k, 1.0, anima));
          P.bDz = .07 + (2.7 - .07) * braco + (anima ? Math.sin(a * 14) * .12 : 0); P.bEz = -P.bDz; P.bDx = P.bEx = -.2 * braco; break;
        }
        case 'girar': {
          Object.assign(P, pulo(a, 1.3, anima));
          P.giro = anima ? Math.PI * 2 * ease.inOut(lim((a - .06) / .62)) : 0; P.bDz = 1.4; P.bEz = -1.4; break;
        }
        case 'palmas': {
          const bate = anima ? Math.abs(Math.sin(a * Math.PI * 4)) : .5;
          P.bDx = P.bEx = -1.25; P.bDz = -(.2 + (1 - bate) * .38); P.bEz = -P.bDz; P.cabX = -.05; break;
        }
        case 'triste': {
          P.cabX = .3; P.troX = .08; P.bDz = -.04; P.bEz = .04; P.bDx = P.bEx = .1; P.sy = .97;
          if (anima) P.corZ = Math.sin(t * 1.3) * .025; break;
        }
        case 'surpreso': {
          if (anima) { const k = lim(a / .5); P.y = Math.sin(k * Math.PI) * .4; P.sy = a < .06 ? .9 : 1 + Math.sin(k * Math.PI) * .05; }
          P.bDz = .55; P.bEz = -.55; P.cabX = -.08; break;
        }
        case 'votar': {
          const sobe = ease.backOut(lim(a / .25), 2), desce = ease.in(lim((a - .65) / .25));
          const k = sobe * (1 - desce);
          P.bDx = -2.3 * k; P.bDz = .07 + .4 * k; P.cabX = -.1 * k; P.cabZ = .06 * k; break;
        }
        case 'falar': {
          const c = anima ? (a % 1.2) / 1.2 : .5, gesto = Math.sin(c * Math.PI);
          P.bDx = -.55 - .5 * gesto; P.bDz = .3 + .25 * gesto; P.cabX = anima ? Math.sin(a * 5) * .04 : 0; P.corZ = .02 * gesto; break;
        }
        case 'apontar': { const k = ease.backOut(lim(a / .3), 1.4); P.bDx = -1.3 * k; P.bDz = .07 + .75 * k; P.cabY += .25 * k; P.corZ = -.03 * k; break; }
        case 'bracos-cruzados': { const k = ease.out(lim(a / .3)); P.bDx = P.bEx = -1.32 * k; P.bDz = -.62 * k; P.bEz = .62 * k; P.cabZ += .06 * k; break; }
        case 'pensar': { const k = ease.out(lim(a / .35)); P.bDx = -2.15 * k; P.bDz = .07 - .62 * k; P.cabZ = .12 * k; P.cabX = -.08 * k; break; }
      }
      return P;
    }
    // Pulo do guia (§7.6): agacha 0,08 s, sobe esticando, desce, assenta com back.out(3)
    function pulo(a, altura, anima) {
      if (!anima) return { bDz: .6, bEz: -.6 };
      const P = { bDz: .9, bEz: -.9, y: 0, sy: 1 };
      if (a < .08) { P.sy = 1 - .15 * ease.out(a / .08); P.bDz = P.bEz = 0; }
      else if (a < .36) { const k = (a - .08) / .28; P.y = altura * ease.out(k); P.sy = .85 + .23 * lim(k * 3) - .04 * lim(k * 2 - 1); }
      else if (a < .58) { const k = (a - .36) / .22; P.y = altura * (1 - ease.in(k)); P.sy = 1.04; }
      else if (a < .76) { P.sy = .88 + .12 * ease.backOut(lim((a - .58) / .18), 3); P.bDz = .3; P.bEz = -.3; }
      else { P.bDz = .07; P.bEz = -.07; }
      return P;
    }

    function aplicar(t, dt, direto) {
      let a = t - est.t0;
      if (est.dur && a > est.dur) { est.acao = 'parado'; est.t0 = t; a = 0; }
      if (REDUZ && est.dur && !est.congelado) a = est.dur * .5;   // movimento reduzido: a pose do meio da ação, parada
      const P = poseAlvo(a, t), k = direto || REDUZ ? 1 : 1 - Math.exp(-dt * (est.acao === 'parado' ? 9 : 26));
      for (const c in P) atual[c] += (P[c] - atual[c]) * k;
      atual.y = P.y; atual.sy = P.sy; atual.giro = P.giro;   // pulo e esticar: direto, sem atraso
      bracoE.rotation.set(atual.bEx, 0, atual.bEz); bracoD.rotation.set(atual.bDx, 0, atual.bDz);
      cabeca.rotation.set(atual.cabX, atual.cabY, atual.cabZ);
      tronco.rotation.x = atual.troX; corpo.rotation.set(0, atual.giro, atual.corZ);
      if (sentado) atual.y *= .2;
      corpo.position.y = alturaBase + atual.y;
      const larg = 1 / Math.sqrt(atual.sy);
      corpo.scale.set(larg, atual.sy, larg);
      tronco.scale.y = 1 + (REDUZ || est.congelado ? 0 : Math.sin(t * Math.PI + est.fase) * .015);   // respira a 0,5 Hz
      sombra.scale.setScalar(Math.max(.5, 1 - atual.y * .32));
      placa.visible = est.acao === 'votar' && (!est.dur || a < est.dur);
      if (placa.visible) placa.scale.setScalar(ease.backOut(lim(a / .2), 2) * (1 - lim((a - .75) / .15)) + .001);
      pernaE.rotation.x = pernaD.rotation.x = sentado ? -Math.PI / 2 : atual.y > .3 ? -.35 : 0;
      pernaE.userData.joelho.rotation.x = pernaD.userData.joelho.rotation.x = sentado ? Math.PI / 2 : atual.y > .3 ? .6 : 0;
      // expressão (pisca, fala em 2 quadros a 8 Hz)
      let ex = EXPR_DA_ACAO[est.acao] || est.expr;
      if (!REDUZ && !est.congelado) {
        if (ex === 'falando' && Math.floor(t * 8) % 2) ex = 'falando2';
        if (['feliz', 'determinado', 'pensativo'].includes(ex)) {
          if (t > est.piscaEm + .1) est.piscaEm = t + 2 + Math.random() * 3.5; else if (t > est.piscaEm) ex = 'piscar';
        }
      }
      if (ex !== est.mostrando) {
        est.mostrando = ex;
        // trocar uma textura por outra não pede material.needsUpdate (só uniforme): piscar e falar sem reavaliar o shader
        if (mRosto) mRosto.map = rosto(ex, escura, sobr);
        if (mTela) mTela.map = mTela.emissiveMap = texMonitor(ex);
      }
      tiqueTijolinhos(t, dt);
    }

    b.tique = () => {
      if (est.congelado) return;
      const t = agora(), dt = Math.min(.1, est.ultimo ? t - est.ultimo : 1 / 60);
      if (dt <= 0) return;
      est.ultimo = t;
      aplicar(t, dt, false);
    };
    camisa.onBeforeRender = b.tique;   // anda sozinho quando é desenhado (e para quando sai de cena)
    b.acao = (nome = 'parado', segundos) => {
      if (!ACOES.includes(nome)) nome = 'parado';
      est.congelado = false; est.acao = nome; est.t0 = agora();
      est.dur = segundos === undefined ? DUR[nome] : segundos;
      if (nome === 'comemorar' && comTijolinhos) soltarTijolinhos(est.t0);
      return b;
    };
    b.expressao = nome => { est.expr = EXPRESSOES.includes(nome) ? nome : 'feliz'; return b; };
    b.olhar = rad => { est.olhar = rad || 0; return b; };
    b.posar = (nome = 'parado', tempo = .4, expr) => {
      if (expr) b.expressao(expr);
      est.acao = ACOES.includes(nome) ? nome : 'parado'; est.dur = 0; est.congelado = true;
      est.t0 = 0; aplicar(tempo, 1, true);
      return b;
    };
    b.soltar = () => { est.congelado = false; est.ultimo = 0; return b; };
    b.descartar = () => { b.removeFromParent(); proprios.forEach(m => m.dispose()); tijolinhos.dispose(); };
    const unica = mesclar ? esqueletar(b, proprios, [placa]) : null;
    if (unica && !camisa.parent) unica.onBeforeRender = b.tique;
    Object.values(mats).forEach(fixo);   // materiais de cache ficam fora da faxina das cenas
    b.userData.alturaBase = alturaBase;
    b.userData.cabeca = cabeca;
    if (avatar.expressao) b.expressao(avatar.expressao);
    aplicar(agora(), 1, true);
    return b;
  }

  // ---------- Personagens fixos e sorteio (guia §7.3, §7.5) ----------
  const ancora = (av = {}) => ({ nome: 'Âncora', cor: '#4A4F5C', calca: '#33363F', forma: null, roupa: 'terno', pele: 'tom3', cabelo: 'preto',
    penteado: 'curto', chapeu: 'nenhum', ...av });
  function conselheiro(categoria, av = {}) {
    const c = CATEGORIAS[categoria] || CATEGORIAS.diplomacia;
    return { nome: 'Conselho de ' + c.cargo, cor: c.cor, calca: c.lado, forma: null, chapeu: c.chapeu, faixa: c.lado, pele: 'tom2', cabelo: 'castanho', penteado: 'curto', ...av };
  }
  // 6 tons humanos distribuídos entre as equipes (nenhum tom é "o normal"); penteados e chapéus variados
  function avataresIniciais(pids, semente = Math.floor(Math.random() * 1e6)) {
    let s = semente;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const mistura = lista => lista.map(x => [r(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    const tons = mistura(PELES.slice(0, 6)), pent = mistura(PENTEADOS.filter(p => p.id !== 'careca')), cabs = mistura(CABELOS.slice(0, 5));
    const chap = mistura(['cartola', 'bone', 'explorador', 'fone', 'oculos', 'nenhum', 'capacete', 'astronauta']);
    const aces = mistura(['prancheta', 'livro', 'globo', 'maleta', 'nenhum', 'luneta']);
    return pids.map((pid, i) => ({ pid, cor: EQUIPES[pid]?.cor, forma: EQUIPES[pid]?.forma, pele: tons[i % 6].id, cabelo: cabs[i % cabs.length].id,
      penteado: pent[i % pent.length].id, chapeu: chap[i % chap.length], acessorio: aces[i % aces.length], humano: true, comemoracao: 'comemorar' }));
  }

  return {
    criar, ancora, conselheiro, avataresIniciais,
    PELES, CABELOS, PENTEADOS, CHAPEUS, ACESSORIOS, COMEMORACOES, EXPRESSOES, ACOES, EQUIPES, CATEGORIAS,
    pecas: { caixa, cil, esfera, bloco, redonda, pino, plastico, tinta, casca, peca, juntar, textura, texForma, caminhoForma },
  };
})();
