'use strict';
/* Geografia Irada — o mascote "Globo Irado": o planeta de peças de óculos escuros, confiante e brincalhão (guia de arte §8.1).
   Mascote.iniciar(el) mostra o mascote dentro de el (usa o renderizador único do Cenas3D: nada de 3º contexto WebGL);
   Mascote.parar(); Mascote.reagir('feliz' | 'susto' | 'triste' | 'comemorar' | 'pensando');
   Mascote.criar() → THREE.Group com .tique(dt, t) e .reagir(nome) para as cenas (colapso, vitória);
   Mascote.retrato(reacao, tamanho) → Promise<dataURL> com a receita do estúdio (dicas, "Para conversar").
   A superfície gira por baixo do rosto; a terra vem de Mapa3D.territorioEm. */

const Mascote = (() => {
  const REDUZ = typeof RM !== 'undefined' ? RM : matchMedia('(prefers-reduced-motion: reduce)').matches;   // respeita também o ajuste do jogo (ui.js)
  const R = 10, PECAS = 1200, TINTA = '#1A1433', AMARELO = '#FFD21F';
  const OCEANOS = ['#58C6E4', '#38B1DC', '#2397CF'], TERRA = '#7CCB4E', AREIA = '#F2D58A', GELO = '#F6FAFD';
  const P = () => Bonecos.pecas;
  const ease = { backOut: (x, s = 1.70158) => 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2, inOut: x => (x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2) };
  const lim = x => Math.min(1, Math.max(0, x));

  // Território num ponto do globo: Mapa3D.territorioEm (contrato); sem o mapa carregado, a mesma conta direto em MAPA
  const K = [[.9986, -.062], [1, 0], [.9986, .062], [.9954, .124], [.99, .186], [.9822, .248], [.973, .31], [.96, .372], [.9427, .434], [.9216, .4958],
    [.8962, .5571], [.8679, .6176], [.835, .6769], [.7986, .7346], [.7597, .7903], [.7186, .8435], [.6732, .8936], [.6213, .9394], [.5722, .9761], [.5322, 1]]
    .map(([x, y]) => [x, y * 1.593415793900743]);
  function territorioNoMapa(lon, lat) {
    if (typeof MAPA === 'undefined') return null;
    const M = MAPA, fi = lat * Math.PI / 180, i = Math.min(18, Math.abs(fi) * 36 / Math.PI), i0 = Math.floor(i), di = i - i0;
    const [ax, ay] = K[i0], [bx, by] = K[i0 + 1], [cx, cy] = K[Math.min(19, i0 + 2)];
    const x = lon * Math.PI / 180 * (bx + di * (cx - ax) / 2 + di * di * (cx - 2 * bx + ax) / 2), y = Math.sign(fi) * (by + di * (cy - ay) / 2 + di * di * (cy - 2 * by + ay) / 2);
    const c = Math.floor((x - M.x0) / M.cel), r = Math.floor((M.y0 - y) / M.cel);
    if (r < 0 || r >= M.linhas) return lat < 0 ? 'antartida' : null;
    const ch = M.celulas[r * M.colunas + ((c % M.colunas) + M.colunas) % M.colunas];
    return ch === '.' || ch === '~' || ch === undefined ? null : M.territorios[M.alfabeto.indexOf(ch)] || 'terra';
  }
  function tipoDoLugar(lon, lat) {
    let t = null;
    try { t = typeof Mapa3D !== 'undefined' && Mapa3D.territorioEm ? Mapa3D.territorioEm(lon, lat) : territorioNoMapa(lon, lat); } catch { t = territorioNoMapa(lon, lat); }
    if (!t) return null;
    if (t === 'groenlandia' || t === 'antartida' || lat > 68 || lat < -60) return 'gelo';
    const deserto = (lat > 15 && lat < 31 && lon > -14 && lon < 33) || (lat > 15 && lat < 30 && lon > 38 && lon < 56) || (lat > -30 && lat < -20 && lon > 122 && lon < 142);
    return deserto ? 'areia' : 'terra';
  }

  // Lente com degradê índigo (de cima para baixo) e um risco de brilho
  const texLente = () => P().textura('lente-globo', (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1A1433'); gr.addColorStop(1, '#2B3A67');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, 16, 128);

  // Dobra uma geometria plana (no plano xy) sobre a esfera de raio r, em volta da direção +z
  function sobreEsfera(geo, r) {
    const p = geo.getAttribute('position'), v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.set(p.getX(i), p.getY(i), 0);
      const z = p.getZ(i), d = new THREE.Vector3(v.x, v.y, Math.sqrt(Math.max(.01, r * r - v.x * v.x - v.y * v.y))).normalize();
      p.setXYZ(i, d.x * (r + z), d.y * (r + z), d.z * (r + z));
    }
    geo.computeVertexNormals();
    return geo;
  }

  function criar() {
    const pc = P(), raiz = new THREE.Group(), corpo = new THREE.Group(), planeta = new THREE.Group(), rosto = new THREE.Group();
    raiz.name = 'globo-irado';
    raiz.add(corpo); corpo.add(planeta); corpo.add(rosto);
    const ctn = pc.tinta(TINTA), proprios = [];
    const mat = (cor, rug = .3) => pc.plastico(cor, rug);

    // ---------- O planeta de peças: ~1.200 peças em espiral de Fibonacci ----------
    planeta.add(new THREE.Mesh(pc.esfera(R - .05, false, 48), mat('#2A8FCB', .35)));
    const mar = [], terra = [];
    for (let i = 0; i < PECAS; i++) {
      const y = 1 - (i + .5) * 2 / PECAS, rr = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5));
      const n = new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr);
      const lat = Math.asin(y) * 180 / Math.PI, lon = Math.atan2(n.x, n.z) * 180 / Math.PI;
      const tipo = tipoDoLugar(lon, lat);
      (tipo ? terra : mar).push({ n, tipo, k: i });
    }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), cima = new THREE.Vector3(0, 1, 0), c = new THREE.Color();
    const imMar = new THREE.InstancedMesh(pc.redonda(.47, .3, { comPino: false, lados: 16 }), mat('#FFFFFF', .2), mar.length);
    const imTerra = new THREE.InstancedMesh(pc.redonda(.47, .48, { comPino: true, lados: 16 }), mat('#FFFFFF', .3), terra.length);
    mar.forEach((x, i) => {   // tom do mar pela distância à costa (claro perto da terra, fundo longe), como no mapa
      let d = 9;
      for (const t of terra) { const a = x.n.angleTo(t.n); if (a < d) d = a; }
      imMar.setMatrixAt(i, m4.compose(x.n.clone().multiplyScalar(R - .02), q.setFromUnitVectors(cima, x.n), new THREE.Vector3(1, 1, 1)));
      imMar.setColorAt(i, c.set(OCEANOS[d < .16 ? 0 : d < .36 ? 1 : 2]));
    });
    terra.forEach((x, i) => {
      imTerra.setMatrixAt(i, m4.compose(x.n.clone().multiplyScalar(R - .02), q.setFromUnitVectors(cima, x.n), new THREE.Vector3(1, 1, 1)));
      imTerra.setColorAt(i, c.set(x.tipo === 'gelo' ? GELO : x.tipo === 'areia' ? AREIA : TERRA).offsetHSL(0, 0, ((x.k * 9301 % 7) - 3) * .006));
    });
    [imMar, imTerra].forEach(im => { im.castShadow = true; im.receiveShadow = true; planeta.add(im); });
    proprios.push(imMar, imTerra);
    // contorno índigo da silhueta inteira (casca um pouco maior, faces de dentro)
    corpo.add(new THREE.Mesh(pc.esfera((R + .62) * 1.03, false, 48), ctn));

    // ---------- Óculos escuros (a marca dele) ----------
    const oculos = new THREE.Group(); oculos.position.set(0, 2.1, R + .3); rosto.add(oculos);
    const mLente = new THREE.MeshStandardMaterial({ map: texLente(), roughness: .1, metalness: 0, envMapIntensity: 1.2 });
    proprios.push(mLente);
    const gLente = pc.caixa(6.2, 3.2, 1.4, .7, 4), brilhos = [];
    [-1, 1].forEach(s => {
      const l = new THREE.Mesh(gLente, mLente); l.position.set(s * 3.55, 0, 0); l.rotation.y = s * .2; l.castShadow = true;
      l.add(new THREE.Mesh(pc.casca(gLente, .16), ctn)); oculos.add(l);
      const br = new THREE.Mesh(pc.caixa(.55, 2.6, .1, .05, 2), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: .8 }));
      br.position.set(-1.6, .1, .72); br.rotation.z = -.55; l.add(br); brilhos.push(br); proprios.push(br.material);
      const br2 = new THREE.Mesh(pc.caixa(.25, 1.4, .1, .05, 2), br.material); br2.position.set(-.95, .35, .72); br2.rotation.z = -.55; l.add(br2);
      const haste = new THREE.Mesh(pc.caixa(.55, .55, 6.2, .2), mat(TINTA, .2)); haste.position.set(s * 6.85, .5, -3.2); haste.rotation.y = s * -.32; oculos.add(haste);
    });
    const ponte = new THREE.Mesh(pc.caixa(1.6, .7, .7, .3), mat(TINTA, .2)); ponte.position.set(0, .6, .25); oculos.add(ponte);

    // olhos de verdade (aparecem só no susto, quando os óculos escorregam)
    const olhos = new THREE.Group(); olhos.visible = false; rosto.add(olhos);
    [-1, 1].forEach(s => {
      const dir = new THREE.Vector3(s * .3, .23, 1).normalize();
      const branco = new THREE.Mesh(pc.esfera(1.55, false, 32), mat('#FFFFFF', .2)); branco.scale.set(1, 1.15, .45);
      branco.position.copy(dir).multiplyScalar(R + .15); branco.lookAt(dir.clone().multiplyScalar(R * 2)); olhos.add(branco);
      branco.add(new THREE.Mesh(pc.casca(pc.esfera(1.55, false, 32), .12), ctn));
      const pupila = new THREE.Mesh(pc.esfera(.75, false, 24), mat(TINTA, .15)); pupila.position.set(s * -.15, -.1, .95); pupila.scale.set(1, 1, .5); branco.add(pupila);
      const luz = new THREE.Mesh(pc.esfera(.24, false, 12), new THREE.MeshBasicMaterial({ color: '#FFFFFF' })); luz.position.set(.25, .3, .4); pupila.add(luz);
    });

    // sobrancelhas: 2 blocos índigo inclinados 12° para dentro (a atitude)
    const sobr = [-1, 1].map(s => {
      const b = new THREE.Mesh(pc.caixa(2.7, .78, .7, .3), mat(TINTA, .25)); b.castShadow = true;
      b.userData.x = s * 3.4; rosto.add(b); return b;
    });
    const porSobr = (b, y) => { b.position.set(b.userData.x, y, Math.sqrt(R * R - b.userData.x ** 2 - y * y) + 1.25); b.rotation.x = -Math.asin(y / R) * .8; b.rotation.y = Math.asin(b.userData.x / R) * .8; };

    // boca: sorriso de lado com meia-lua de dentes; "O" no susto; arco invertido na tristeza
    const bocas = {};
    const sorriso = new THREE.Shape();
    sorriso.moveTo(-1.6, .35); sorriso.quadraticCurveTo(.6, -.1, 2.7, 1.25); sorriso.quadraticCurveTo(2.2, -1.9, -.1, -1.5); sorriso.quadraticCurveTo(-1.4, -1.1, -1.6, .35);
    const gSorriso = sobreEsfera(new THREE.ExtrudeGeometry(sorriso, { depth: .35, bevelEnabled: true, bevelThickness: .12, bevelSize: .12, bevelSegments: 3, curveSegments: 16 }).translate(0, -3.6, 0), R + .62);
    bocas.feliz = new THREE.Group(); rosto.add(bocas.feliz);
    const mBoca = mat('#4A1B1F', .35);
    const bocaM = new THREE.Mesh(gSorriso, mBoca); bocas.feliz.add(bocaM);
    bocaM.add(new THREE.Mesh(pc.casca(gSorriso, .14), ctn));
    const dentes = new THREE.Shape(); dentes.moveTo(-1.35, .26); dentes.quadraticCurveTo(.6, -.13, 2.45, 1.05); dentes.lineTo(2.25, .6); dentes.quadraticCurveTo(.5, -.62, -1.15, -.12); dentes.lineTo(-1.35, .26);
    const gDentes = sobreEsfera(new THREE.ExtrudeGeometry(dentes, { depth: .2, bevelEnabled: false, curveSegments: 16 }).translate(0, -3.6, 0), R + 1.05);
    const dentesM = new THREE.Mesh(gDentes, mat('#FFFFFF', .2)); bocas.feliz.add(dentesM);
    bocas.feliz.rotation.z = .1; bocas.feliz.position.x = .5;
    const anel = new THREE.Shape(); anel.absarc(0, 0, 1.15, 0, Math.PI * 2); const furo = new THREE.Path(); furo.absarc(0, 0, .55, 0, Math.PI * 2, true); anel.holes.push(furo);
    const gO = sobreEsfera(new THREE.ExtrudeGeometry(anel, { depth: .35, bevelEnabled: true, bevelThickness: .1, bevelSize: .1, bevelSegments: 2, curveSegments: 24 }).translate(0, -4, 0), R + .62);
    bocas.susto = new THREE.Group(); rosto.add(bocas.susto);
    const o = new THREE.Mesh(gO, mBoca); bocas.susto.add(o); o.add(new THREE.Mesh(pc.casca(gO, .12), ctn));
    const interior = new THREE.Mesh(sobreEsfera(new THREE.CircleGeometry(.6, 24).translate(0, -4, 0), R + .7), mat('#6B1020', .4)); bocas.susto.add(interior);
    const arco = new THREE.Shape(); arco.absarc(0, -1.6, 2.2, Math.PI * .2, Math.PI * .8); arco.absarc(0, -1.6, 1.55, Math.PI * .8, Math.PI * .2, true);
    const gTriste = sobreEsfera(new THREE.ExtrudeGeometry(arco, { depth: .35, bevelEnabled: true, bevelThickness: .1, bevelSize: .1, bevelSegments: 2, curveSegments: 20 }).translate(0, -2.6, 0), R + .62);
    bocas.triste = new THREE.Group(); rosto.add(bocas.triste);
    const tr = new THREE.Mesh(gTriste, mBoca); bocas.triste.add(tr); tr.add(new THREE.Mesh(pc.casca(gTriste, .12), ctn));
    bocas.susto.visible = bocas.triste.visible = false;

    // gota de suor azul-clara (colapso)
    const gota = new THREE.Group(); gota.position.set(-7.2, 5.2, 7.2); gota.visible = false; rosto.add(gota);
    const gotaM = new THREE.MeshStandardMaterial({ color: '#A8E9F5', roughness: .05, envMapIntensity: 1.5 }); proprios.push(gotaM);
    const bulbo = new THREE.Mesh(pc.esfera(.9, false, 24), gotaM); gota.add(bulbo);
    const ponta = new THREE.Mesh(new THREE.ConeGeometry(.78, 1.3, 24), gotaM); ponta.position.y = .95; gota.add(ponta);
    [bulbo, ponta].forEach(m => m.add(new THREE.Mesh(pc.casca(m.geometry, .14), ctn)));
    const brGota = new THREE.Mesh(pc.esfera(.22, false, 12), new THREE.MeshBasicMaterial({ color: '#FFFFFF' })); brGota.position.set(-.3, .25, .7); gota.add(brGota);

    // ---------- Braços: ombro de peça redonda 2×2 encaixado, braço amarelo, luva branca de desenho ----------
    const braco = s => {
      const enc = new THREE.Mesh(pc.redonda(1.25, .9, { comPino: false, lados: 32 }), mat(AMARELO, .28));
      enc.position.set(s * (R - .25), -.6, 0); enc.rotation.z = s * -Math.PI / 2; enc.castShadow = true; corpo.add(enc);
      enc.add(new THREE.Mesh(pc.casca(enc.geometry, .14), ctn));
      const piv = new THREE.Group(); piv.position.set(s * (R + .45), -.6, 0); corpo.add(piv);
      const g = new THREE.Group(); piv.add(g);
      const b = new THREE.Mesh(pc.caixa(1.55, 4.2, 1.55, .5), mat(AMARELO, .28)); b.position.y = -2.1; b.castShadow = true; g.add(b);
      b.add(new THREE.Mesh(pc.casca(b.geometry, .14), ctn));
      const punho = new THREE.Mesh(pc.cil(1.05, 1.05, .6, 24), mat('#FFFFFF', .3)); punho.position.y = -4.35; g.add(punho);
      punho.add(new THREE.Mesh(pc.casca(punho.geometry, .12), ctn));
      const luva = new THREE.Group(); luva.position.y = -5.45; g.add(luva);
      const palma = new THREE.Mesh(pc.caixa(2.1, 1.9, 1.3, .55), mat('#FFFFFF', .3)); palma.castShadow = true; luva.add(palma);
      palma.add(new THREE.Mesh(pc.casca(palma.geometry, .14), ctn));
      [-.62, 0, .62].forEach(x => {
        const d = new THREE.Mesh(pc.caixa(.6, 1.35, .9, .28), mat('#FFFFFF', .3)); d.position.set(x, -1.2 + Math.abs(x) * .25, 0); d.rotation.z = x * .18; luva.add(d);
        d.add(new THREE.Mesh(pc.casca(d.geometry, .12), ctn));
      });
      const polegar = new THREE.Mesh(pc.caixa(.6, 1.1, .85, .28), mat('#FFFFFF', .3)); polegar.position.set(s * -1.15, -.1, .15); polegar.rotation.z = s * -.9; luva.add(polegar);
      polegar.add(new THREE.Mesh(pc.casca(polegar.geometry, .12), ctn));
      return { piv, g };
    };
    const bE = braco(-1), bD = braco(1);

    // ---------- Pés: tênis índigo com sola branca, por baixo da esfera ----------
    [-1, 1].forEach(s => {
      const pe = new THREE.Group(); pe.position.set(s * 3.1, -R - .4, 1.2); pe.rotation.y = s * -.18; corpo.add(pe);
      const tenis = new THREE.Mesh(pc.caixa(2.9, 1.5, 4.2, .7), mat('#2B3A67', .3)); tenis.position.y = .5; tenis.castShadow = true; pe.add(tenis);
      tenis.add(new THREE.Mesh(pc.casca(tenis.geometry, .14), ctn));
      const sola = new THREE.Mesh(pc.caixa(3.05, .5, 4.35, .22), mat('#FFFFFF', .3)); sola.position.y = -.2; pe.add(sola);
      sola.add(new THREE.Mesh(pc.casca(sola.geometry, .12), ctn));
      const bico = new THREE.Mesh(pc.caixa(2.2, .7, 1.1, .3), mat('#FFFFFF', .3)); bico.position.set(0, .15, 1.75); pe.add(bico);
    });
    // sombra de contato elíptica
    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: P().textura('contato-globo', (g, n) => {
      const gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); gr.addColorStop(0, 'rgba(26,20,51,.3)'); gr.addColorStop(1, 'rgba(26,20,51,0)');
      g.fillStyle = gr; g.fillRect(0, 0, n, n); }, 128), transparent: true, depthWrite: false }));
    sombra.rotation.x = -Math.PI / 2; sombra.scale.set(22, 9, 1); sombra.position.y = -R - .85; sombra.renderOrder = -2; raiz.add(sombra); proprios.push(sombra.material);

    // ---------- Animação ----------
    const est = { reacao: 'feliz', t0: 0, ultimo: 0, suor: false, brilhoEm: 4 };
    const pose = { y: 0, rz: 0, bE: -.55, bD: .55, bEx: 0, bDx: 0, bDs: 1, ocY: 0, ocZ: 0, ocR: 0, sE: .21, sD: -.21, sYE: 0, sYD: 0 };
    function reagir(nome = 'feliz', { suor = false } = {}) {
      est.reacao = nome; est.t0 = performance.now() / 1000; est.suor = suor;
      bocas.feliz.visible = !['susto', 'triste'].includes(nome);
      bocas.susto.visible = nome === 'susto';
      bocas.triste.visible = nome === 'triste';
      olhos.visible = nome === 'susto';
      gota.visible = nome === 'triste' && suor;
      return raiz;
    }
    function tique(dt, t) {
      t ??= performance.now() / 1000;
      dt ??= Math.min(.1, est.ultimo ? t - est.ultimo : 1 / 60);
      est.ultimo = t;
      const a = t - est.t0, anima = !REDUZ;
      if (anima) planeta.rotation.y += dt * .35;
      const alvo = { y: anima ? Math.sin(t * Math.PI) * .6 : 0, rz: anima ? Math.sin(t * 1.3) * .05 : 0, bE: -.55, bD: .55, bEx: 0, bDx: 0, bDs: 1, ocY: 0, ocZ: 0, ocR: 0, sE: .21, sD: -.21, sYE: 0, sYD: 0 };
      let r = est.reacao;
      if ((r === 'susto' && a > 1.8) || (r === 'comemorar' && a > 1.7)) { reagir('feliz'); r = 'feliz'; }
      if (r === 'feliz') {   // acena com back.out(2) de tempos em tempos
        const ciclo = anima ? (t % 6) : 1, sobe = ease.backOut(lim(ciclo / .3), 2), desce = lim((ciclo - 1.7) / .3);
        alvo.bD = .55 + (2.55 - .55) * sobe * (1 - desce) + (anima && ciclo > .3 && ciclo < 1.7 ? Math.sin(ciclo * 18) * .3 : 0);
        if (!anima) alvo.bD = 2.55;
      } else if (r === 'susto') {
        alvo.ocY = -1.7; alvo.ocR = -.12; alvo.sE = alvo.sD = 0; alvo.sYE = alvo.sYD = 1; alvo.bE = -1.5; alvo.bD = 1.5;
        if (anima) alvo.y += Math.sin(lim(a / .45) * Math.PI) * 2.4;
      } else if (r === 'triste') {
        alvo.ocZ = .14; alvo.ocY = -.3; alvo.sE = -.3; alvo.sD = .3; alvo.sYE = alvo.sYD = .2; alvo.bE = -.15; alvo.bD = .15;
        if (anima) alvo.y = Math.sin(t * 1.2) * .25;
      } else if (r === 'comemorar') {
        alvo.bE = -2.7; alvo.bD = 2.7;
        if (anima) { const k = a % .8; alvo.y += Math.sin(lim(k / .7) * Math.PI) * 3; alvo.bD += Math.sin(a * 14) * .15; alvo.bE -= Math.sin(a * 14) * .15; }
        if (a < .1) est.brilhoEm = t;
      } else if (r === 'pensando') {
        alvo.bD = -.44; alvo.bDx = -1.07; alvo.bDs = 1.45; alvo.sYE = .7; alvo.sE = -.1;
      }
      const k = REDUZ ? 1 : 1 - Math.exp(-dt * 14);
      for (const c in alvo) if (c !== 'y') pose[c] += (alvo[c] - pose[c]) * k;
      pose.y = alvo.y;
      corpo.position.y = pose.y; corpo.rotation.z = pose.rz;
      bE.piv.rotation.set(pose.bEx, 0, pose.bE); bD.piv.rotation.set(pose.bDx, 0, pose.bD);
      bD.g.scale.y = pose.bDs;
      oculos.position.y = 2.1 + pose.ocY; oculos.rotation.z = pose.ocZ; oculos.rotation.x = pose.ocR;
      sobr[0].rotation.z = -pose.sE; sobr[1].rotation.z = -pose.sD;
      porSobr(sobr[0], 4.3 + pose.sYE); porSobr(sobr[1], 4.3 + pose.sYD);
      sombra.scale.set(22 - pose.y * .8, 9 - pose.y * .3, 1);
      sombra.material.opacity = 1 - Math.max(0, pose.y) * .06;
      // brilho cruzando as lentes a cada 8 s (e na comemoração)
      if (anima && t > est.brilhoEm + 8) est.brilhoEm = t;
      const kb = anima ? lim((t - est.brilhoEm) / .6) : 0;
      brilhos.forEach(b => { b.position.x = -1.6 + kb * 3.4 * (kb < 1 ? 1 : 0); b.material.opacity = kb > 0 && kb < 1 ? .95 : .8; });
      if (gota.visible && anima) gota.position.y = 5.2 - (a % 2.4) * .9;
    }
    reagir('feliz');
    tique(1 / 60, 0);
    raiz.tique = tique;
    raiz.reagir = reagir;
    raiz.descartar = () => { raiz.removeFromParent(); proprios.forEach(x => x.dispose()); };
    return raiz;
  }

  // ---------- No elemento da tela inicial (e onde mais for preciso) ----------
  let palco = null, modelo = null;
  function iniciar(el) {
    if (!el) return;
    if (palco && palco === Cenas3D.palco && palco.el === el) return;
    modelo = criar();
    const cena = new THREE.Scene(), camera = new THREE.PerspectiveCamera(22, 1, 1, 400);
    Cenas3D.renderizador();
    Cenas3D.luzes(cena, { raio: 18, centro: new THREE.Vector3(0, 0, 0), sombras: false });
    cena.add(modelo);
    palco = {
      nome: 'mascote', el, cena, camera, fundo: null, pausarMapa: false, bonecos: {},
      ajustar(w, h) {   // o globo inteiro (com braços e pés) cabe com folga
        const altura = 34, largura = 34, fov = THREE.MathUtils.degToRad(camera.fov);
        const d = Math.max(altura / 2 / Math.tan(fov / 2), largura / 2 / (Math.tan(fov / 2) * camera.aspect)) * 1.08;
        camera.position.set(0, 3, d); camera.lookAt(0, -.5, 0);
      },
      tique: (dt, t) => modelo.tique(dt, t),
      limpar: () => { modelo?.descartar(); modelo = null; },
    };
    Cenas3D.abrir(palco);
  }
  function parar() { if (palco) Cenas3D.fechar(palco); palco = null; }
  function reagir(nome) { modelo?.reagir(nome); }
  const cache = new Map();
  function retrato(reacao = 'feliz', tamanho = 256) {
    const chave = reacao + tamanho;
    if (!cache.has(chave)) cache.set(chave, Promise.resolve().then(() => {
      const m = criar(); m.reagir(reacao); m.tique(1, 1);
      const url = Cenas3D.estudio(m, { tamanho, centroY: -1, meia: 17.5, giro: 0, elev: 4, fov: 20 });
      m.descartar();
      return url;
    }));
    return cache.get(chave);
  }

  return { iniciar, parar, reagir, criar, retrato };
})();
