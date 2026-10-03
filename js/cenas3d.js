'use strict';
/* Geografia Irada — Cenas3D: as cenas de bonecos fora do mapa (lobby, provador, ONU, revelação, pódio, fim, foto, retratos).
   Um renderizador só (no máximo 2 contextos WebGL vivos: mapa + cenas), reaproveitado por tudo, inclusive pelo Mascote.
   A cena faz só o 3D: os textos por cima são HTML de quem chama (Cenas3D.ancora(pid) dá a posição de cada boneco na tela).
   Toda cena devolve uma Promise que resolve quando a entrada termina; Cenas3D.pular() leva ao estado final.
   Contrato (docs/ARQUITETURA.md): lobby, previa, salaONU + votos + fala, revelacao, podio, fim, foto, retrato, esconder. */

const Cenas3D = (() => {
  const REDUZ = typeof RM !== 'undefined' ? RM : matchMedia('(prefers-reduced-motion: reduce)').matches;   // respeita também o ajuste do jogo (ui.js)
  const rapido = () => typeof RAPIDO !== 'undefined' && RAPIDO;
  const TINTA = '#1A1433', CREME = '#FFF4DC', LADRILHO = '#FFF9EC', AMARELO = '#FFD21F', ESCURA = '#2E2752', PRETA = '#2B2747';
  const P = () => Bonecos.pecas;
  const som = (nome, o) => { try { if (typeof Som !== 'undefined') Som.efeito(nome, o); } catch { /* sem som */ } };
  const mapaPausar = v => { try { if (typeof Mapa3D !== 'undefined' && Mapa3D.pausar) Mapa3D.pausar(v); } catch { /* mapa ausente */ } };
  const fimTl = tl => new Promise(r => { if (!tl) return r(); if (rapido()) tl.timeScale(12); tl.eventCallback('onComplete', r); });
  const equipe = pid => Bonecos.EQUIPES[pid] || { cor: '#9AA3B8', sombra: '#5C6680', clara: '#C9CED6', forma: null };

  // ---------- Fundos (CSS no hospedeiro; a foto redesenha no canvas 2D) ----------
  const PINOS = 'radial-gradient(circle at 50% 42%, rgba(255,255,255,.07) 0 .5vh, rgba(0,0,0,.10) .52vh .7vh, transparent .74vh) 0 0 / 4vh 4vh';
  const LUZ = 'radial-gradient(60% 60% at 50% 52%, rgba(255,255,255,.16), rgba(255,255,255,0) 70%)';
  const FUNDOS = {
    mesa: `${LUZ}, ${PINOS}, linear-gradient(#3550C8, #22339A 55%, #141F66)`,
    crise: `${LUZ}, ${PINOS}, linear-gradient(#4A3FB0, #2E2380 55%, #1B1250)`,
    colapso: `${PINOS}, linear-gradient(#4A4F7A, #2E3150 55%, #1B1D33)`,
    noite: 'radial-gradient(circle at 50% 42%, rgba(255,255,255,.04) 0 .5vh, transparent .74vh) 0 0 / 4vh 4vh, radial-gradient(120% 95% at 50% 88%, #2A3C9A, #070A24 70%)',
    raios: `${LUZ}, repeating-conic-gradient(from 0deg at 50% 58%, rgba(255,255,255,.07) 0 6deg, rgba(255,255,255,0) 6deg 12deg), linear-gradient(#3550C8, #22339A 55%, #141F66)`,
  };

  // ---------- Renderizador único ----------
  let renderer = null, ambiente = null, timer = null, palco = null, palcoFundo = null, rodando = false, modo = window.PC_FRACO ? 'leves' : 'auto';
  let medidos = 0, somaDt = 0;
  const elCena = () => document.getElementById('cena');
  function obterRenderer() {
    if (renderer) return renderer;
    renderer = new THREE.WebGLRenderer({ antialias: !window.PC_FRACO, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !window.PC_FRACO;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    if (window.PC_FRACO) renderer.setPixelRatio(1);
    const cv = renderer.domElement;
    cv.setAttribute('aria-hidden', 'true');
    Object.assign(cv.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', touchAction: 'none' });
    const pm = new THREE.PMREMGenerator(renderer);
    ambiente = pm.fromScene(new THREE.RoomEnvironment(), .04).texture;
    pm.dispose();
    timer = new THREE.Timer();
    return renderer;
  }
  function graficos(m) {
    modo = m;
    if (!renderer) return;
    const leve = m === 'leves';
    renderer.shadowMap.enabled = !leve;
    renderer.setPixelRatio(leve ? 1 : Math.min(devicePixelRatio || 1, 2));
    if (palco) redimensionar();
  }

  // Luz da receita do estúdio de brinquedo (guia §4.2)
  function luzes(cena, { raio = 12, centro = new THREE.Vector3(), chave = 2.4, sombras = true } = {}) {
    cena.environment = ambiente;
    cena.environmentIntensity = .35;
    const hemi = new THREE.HemisphereLight('#EAF4FF', '#5B4C8C', .9);
    const luzChave = new THREE.DirectionalLight('#FFF1DC', chave);
    luzChave.position.set(-3, 6, 4).normalize().multiplyScalar(raio * 3).add(centro);
    luzChave.target.position.copy(centro);
    if (sombras) {
      luzChave.castShadow = true;
      luzChave.shadow.mapSize.set(2048, 2048);
      luzChave.shadow.radius = 4; luzChave.shadow.bias = -.0004; luzChave.shadow.normalBias = .02;
      Object.assign(luzChave.shadow.camera, { left: -raio, right: raio, top: raio, bottom: -raio, near: .5, far: raio * 7 });
    }
    const recorte = new THREE.DirectionalLight('#A8DBFF', 1.4);
    recorte.position.set(4, 3, -5).normalize().multiplyScalar(raio * 3).add(centro);
    recorte.target.position.copy(centro);
    cena.add(hemi, luzChave, luzChave.target, recorte, recorte.target);
    return { hemi, chave: luzChave, recorte };
  }
  // Mesa que recebe sombra (o fundo continua sendo o CSS)
  function chaoDeSombra(cena, tam = 80, opacidade = .22) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(tam, tam), new THREE.ShadowMaterial({ color: TINTA, opacity: opacidade }));
    m.rotation.x = -Math.PI / 2; m.receiveShadow = true; m.position.y = .001;
    cena.add(m);
    return m;
  }
  const texContato = () => P().textura('contato', (g, n) => {
    const gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    gr.addColorStop(0, 'rgba(26,20,51,.38)'); gr.addColorStop(1, 'rgba(26,20,51,0)');
    g.fillStyle = gr; g.fillRect(0, 0, n, n);
  }, 128);
  function contato(pai, x, z, rx, rz, y = .004) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texContato(), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.scale.set(rx * 2.3, rz * 2.3, 1); m.position.set(x, y, z); m.renderOrder = -2;
    pai.add(m);
    return m;
  }
  const malha = (g, mat, pai, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
    if (pai) pai.add(m);
    return m;
  };

  // Impressão (decal) num canvas; o texto usa as fontes do jogo
  function impressao(chave, w, h, desenhar) {
    return P().textura('imp' + chave, (g, W, H) => desenhar(g, W, H), w, h);
  }
  async function fontesProntas() {
    try { await Promise.all(['400 80px "Titan One"', '700 40px Fredoka', '900 40px Nunito'].map(f => document.fonts.load(f))); } catch { /* sem fontes */ }
  }
  function letraBolha(g, texto, x, y, px, { cor = '#FFFFFF', contorno = TINTA, fonte = 'Titan One', peso = 400, sombra = true } = {}) {
    g.font = `${peso} ${px}px "${fonte}", "Fredoka", system-ui, sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (sombra) { g.lineWidth = px * .34; g.strokeStyle = contorno; g.strokeText(texto, x, y + px * .07); }
    g.lineWidth = px * .34; g.strokeStyle = contorno; g.strokeText(texto, x, y);
    g.fillStyle = cor; g.fillText(texto, x, y);
  }

  // ---------- Hospedeiro, laço e enquadramento ----------
  function montarHost(el) {
    const cv = obterRenderer().domElement;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    if (cv.parentElement !== el) el.appendChild(cv);
    el.hidden = false;
    redimensionar();
  }
  function tamanhoHost() {
    const el = palco?.el || elCena();
    return { w: Math.max(1, el?.clientWidth || innerWidth), h: Math.max(1, el?.clientHeight || innerHeight) };
  }
  function redimensionar() {
    if (!renderer || !palco) return;
    const { w, h } = tamanhoHost();
    renderer.setSize(w, h, false);
    enquadrar(palco, w, h);
  }
  const obs = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => redimensionar()) : null;

  // Enquadra a caixa do palco na faixa [topo, base] da altura (frações), com margem; busca a distância certa
  const _v = new THREE.Vector3();
  function enquadrar(p, w, h) {
    const cam = p.camera, [topo, base] = p.faixa || [0, 1], faixaH = Math.max(1, h * (base - topo));
    cam.aspect = w / faixaH;
    cam.clearViewOffset();
    if (p.ajustar) { p.ajustar(w, faixaH); } else if (p.caixa) {
      const caixa = p.caixa, centro = caixa.getCenter(new THREE.Vector3()).add(p.mira || new THREE.Vector3());
      const dir = new THREE.Vector3().setFromSphericalCoords(1, Math.PI / 2 - THREE.MathUtils.degToRad(p.elev ?? 14), THREE.MathUtils.degToRad(p.giro ?? 0));
      const cantos = [];
      for (let i = 0; i < 8; i++) cantos.push(new THREE.Vector3(i & 1 ? caixa.max.x : caixa.min.x, i & 2 ? caixa.max.y : caixa.min.y, i & 4 ? caixa.max.z : caixa.min.z));
      const margem = p.margem ?? .86;
      let lo = .5, hi = cam.far * .8;   // a busca não pode passar do plano de fundo da câmera
      for (let k = 0; k < 26; k++) {
        const d = (lo + hi) / 2;
        cam.position.copy(centro).addScaledVector(dir, d); cam.lookAt(centro); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
        const cabe = cantos.every(c => { _v.copy(c).project(cam); return Math.abs(_v.x) <= margem && Math.abs(_v.y) <= margem && _v.z < 1; });
        if (cabe) hi = d; else lo = d;
      }
      cam.position.copy(centro).addScaledVector(dir, hi); cam.lookAt(centro);
      p.camBase = p.camGeral = { pos: cam.position.clone(), alvo: centro.clone() };
      p.ajusteGeral = { centro: centro.clone(), dir, d: hi };   // o foco do lobby anda e dá zoom a partir deste enquadramento
      if (p.camFoco?.k) aplicarCamFoco(p);
    }
    cam.setViewOffset(w, faixaH, 0, -h * topo, w, h);   // a faixa ocupa o pedaço certo do canvas
    cam.updateProjectionMatrix();
  }

  let trauma = 0;
  function quadro() {
    timer.update();
    const dt = Math.min(.1, timer.getDelta()), t = timer.getElapsed();
    if (!palco) return;
    palco.tique?.(dt, t);
    const cam = palco.camera;
    let tremeu = false;
    if (trauma > 0 && !REDUZ && palco.camBase) {
      trauma = Math.max(0, trauma - 1.6 * dt);
      const k = trauma * trauma * .25;
      cam.position.copy(palco.camBase.pos).add(_v.set((Math.random() - .5) * 2 * k, (Math.random() - .5) * 2 * k, 0));
      tremeu = true;
    }
    renderer.render(palco.cena, cam);
    if (tremeu && trauma === 0) cam.position.copy(palco.camBase.pos);
    if (modo === 'auto' && renderer.shadowMap.enabled) {   // computador fraco: tira sombras e baixa a resolução
      medidos++; somaDt += dt;
      if (medidos >= 90) { if (somaDt / medidos > .022) graficos('leves'), (modo = 'auto-leve'); medidos = 0; somaDt = 0; }
    }
  }
  function ligarLaco() {
    if (rodando) return;
    rodando = true;
    obterRenderer().setAnimationLoop(quadro);
  }
  function desligarLaco() { if (renderer) renderer.setAnimationLoop(null); rodando = false; }

  // Abre um palco: { nome, el, cena, camera, tique, fundo, faixa, caixa | ajustar, pausarMapa, bonecos }
  function abrir(p, { manterFundo = false } = {}) {
    obterRenderer();
    const el = p.el || elCena();
    if (!el) throw new Error('Cenas3D: falta o elemento #cena');
    p.el = el;
    if (palco && palco !== p) {
      if (manterFundo && palco.el === elCena() && el !== elCena()) {   // o provador abre por cima: a cena de trás fica congelada
        renderer.render(palco.cena, palco.camera);
        elCena().style.background = `url(${renderer.domElement.toDataURL()}) center / 100% 100% no-repeat, ${FUNDOS[palco.fundo] || 'transparent'}`;
        palcoFundo = palco;
      } else if (palco !== palcoFundo) descartarPalco(palco);
      palco.tl?.progress(1);
    }
    if (!manterFundo && palcoFundo && palcoFundo !== p) { descartarPalco(palcoFundo); palcoFundo = null; }   // a cena congelada atrás saiu de vez
    palco = p;
    if (obs) { obs.disconnect(); obs.observe(el); }
    if (el === elCena() || p.fundo) el.style.background = p.fundo ? FUNDOS[p.fundo] || p.fundo : 'transparent';
    renderer.domElement.style.pointerEvents = p.interativo ? 'auto' : 'none';
    montarHost(el);
    if (el === elCena() && p.pausarMapa !== false) mapaPausar(true);
    if (REDUZ && el === elCena()) { renderer.domElement.style.transition = 'none'; renderer.domElement.style.opacity = '0';
      requestAnimationFrame(() => { renderer.domElement.style.transition = 'opacity .2s'; renderer.domElement.style.opacity = '1'; }); }
    ligarLaco();
    return p;
  }
  function descartarPalco(p) {
    if (!p) return;
    p.tl?.kill();
    p.limpar?.();
    Object.values(p.bonecos || {}).forEach(b => b.descartar());
    p.cena.traverse(o => {   // o que é só desta cena (as peças de cache ficam para a próxima)
      if (!o.isMesh) return;
      if (o.isInstancedMesh) o.dispose();
      if (!o.geometry.userData.compartilhado) o.geometry.dispose();
      [].concat(o.material).forEach(m => { if (m && !m.userData.compartilhado) m.dispose(); });
    });
  }
  function esconder() {
    if (palco) descartarPalco(palco);
    if (palcoFundo && palcoFundo !== palco) descartarPalco(palcoFundo);
    palco = palcoFundo = null;
    desligarLaco();
    const el = elCena();
    if (el) { el.hidden = true; el.style.background = ''; }
    if (renderer?.domElement.parentElement) renderer.domElement.remove();
    mapaPausar(false);
    trauma = 0;
  }
  // Sai de um palco específico (o Mascote usa ao parar) sem mexer nos outros
  function fechar(p) { if (palco === p) esconder(); }
  function pular() { palco?.tl?.progress(1); }

  // Posição de um boneco na tela (px da janela): pés, topo da cabeça e se está à vista
  function ancora(pid) {
    const b = palco?.bonecos?.[pid];
    if (!b || !renderer) return null;
    const r = renderer.domElement.getBoundingClientRect(), cam = palco.camera;
    b.updateWorldMatrix(true, false);
    const pe = new THREE.Vector3(0, 0, 0).applyMatrix4(b.matrixWorld).project(cam);
    const topo = new THREE.Vector3(0, (b.userData.alturaBase || 0) + 3.9, 0).applyMatrix4(b.matrixWorld).project(cam);
    const px = v => ({ x: r.left + (v.x * .5 + .5) * r.width, y: r.top + (-v.y * .5 + .5) * r.height });
    return { x: px(pe).x, y: px(pe).y, topo: px(topo).y, visivel: Math.abs(pe.x) <= 1 && Math.abs(pe.y) <= 1.2 };
  }

  // ---------- Peças das cenas ----------
  // Pedestal redondo na cor da potência, tampo creme com anel de pinos e a forma branca na frente (guia §5.16)
  function pedestal(pid, { raio = 1.6, altura = 1.2, cor, aro = true } = {}) {
    const eq = equipe(pid), g = new THREE.Group(), pc = P();
    const c = cor || eq.cor, base = aro ? .3 : 0;
    if (aro) {
      const a = malha(pc.redonda(raio + .32, base, { comPino: false, lados: 48 }), pc.plastico(CREME, .3), g);
      a.add(new THREE.Mesh(pc.casca(a.geometry, .03), pc.tinta(TINTA)));
    }
    const corpoP = new THREE.Group(); corpoP.position.y = base; g.add(corpoP);
    const lado = malha(pc.redonda(raio, altura, { comPino: false, lados: 48 }), pc.plastico(c, .3), corpoP);
    lado.add(new THREE.Mesh(pc.casca(lado.geometry, .03), pc.tinta(TINTA)));
    malha(pc.redonda(raio - .02, .4, { comPino: false, lados: 48 }), pc.plastico(CREME, .3), corpoP, 0, altura);
    const anel = new THREE.InstancedMesh(pc.pino(12), pc.plastico(CREME, .3), 10);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; anel.setMatrixAt(i, m4.makeTranslation(Math.cos(a) * (raio - .45), altura + .4, Math.sin(a) * (raio - .45))); }
    anel.castShadow = false; anel.receiveShadow = true; corpoP.add(anel);
    if (eq.forma) {
      const arco = .62;
      const placa = new THREE.Mesh(new THREE.CylinderGeometry(raio + .006, raio + .006, altura * .78, 24, 1, true, -arco / 2, arco),
        new THREE.MeshStandardMaterial({ map: pc.texForma(eq.forma, '#FFFFFF'), transparent: true, roughness: .3, polygonOffset: true, polygonOffsetFactor: -1 }));
      placa.position.y = altura / 2; placa.userData.proprio = true;
      corpoP.add(placa);
    }
    g.userData.topo = base + altura + .4;
    return g;
  }
  // Tijolos soltos sobre a mesa (bancada de estúdio), longe do que importa
  function tijolosSoltos(pai, pontos, cores) {
    const pc = P();
    pontos.forEach(([x, z, tipo, giro], i) => {
      const [w, d] = tipo === 1 ? [1, 2] : tipo === 2 ? [2, 2] : [1, 1];
      const m = malha(pc.bloco(w, 1.2, d), pc.plastico(cores[i % cores.length], .3), pai, x, 0, z);
      m.rotation.y = giro;
      m.add(new THREE.Mesh(pc.casca(m.geometry, .025), pc.tinta(TINTA)));
    });
  }
  // Boneco que cai do alto e assenta (antecipação → queda → achata e volta)
  function cair(tl, b, quando, alturaFinal, { altura = 7, som: s = 'tijolo' } = {}) {
    if (REDUZ) { tl.set(b.position, { y: alturaFinal }, quando).set(b, { visible: true }, quando); return; }
    const e = b.scale.x;
    tl.set(b, { visible: true }, quando)
      .fromTo(b.position, { y: alturaFinal + altura }, { y: alturaFinal, duration: .34, ease: 'power2.in' }, quando)
      .fromTo(b.scale, { x: e * .94, y: e * 1.1, z: e * .94 }, { x: e * 1.08, y: e * .86, z: e * 1.08, duration: .08, ease: 'power2.out' }, quando + .34)
      .to(b.scale, { x: e, y: e, z: e, duration: .22, ease: 'back.out(3)' }, quando + .42)
      .call(() => som(s), null, quando + .34);
  }

  // ---------- Chuva de tijolinhos (comemoração do jogo; substitui o confete) ----------
  function chuva(cena, cores, { n = 120, raio = 9, altura = 16, duracao = 3, chao = 0 } = {}) {
    if (REDUZ) return { tique() {}, parar() {} };
    const pc = P(), mat = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: .3 });
    const metade = Math.round(n * .65);
    const grupos = [new THREE.InstancedMesh(pc.bloco(1, 1.2, 1, { lados: 8 }), mat, metade), new THREE.InstancedMesh(pc.bloco(2, 1.2, 2, { lados: 8 }), mat, n - metade)];
    const pecas = [], c = new THREE.Color(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3();
    grupos.forEach((im, gi) => {
      im.frustumCulled = false; im.castShadow = true; im.userData.proprio = false;
      for (let i = 0; i < im.count; i++) {
        im.setColorAt(i, c.set(cores[(i + gi) % cores.length]));
        const frente = Math.random() < .25, x = (Math.random() - .5) * raio * 2;
        const z = frente ? 1.5 + Math.random() * 2 : -1.2 - Math.random() * raio * .6;
        pecas.push({ im, i, nasce: Math.random() * duracao * .8, p: new THREE.Vector3(frente && Math.abs(x) < raio * .7 ? Math.sign(x || 1) * (raio * .7 + Math.random() * raio * .3) : x, altura + Math.random() * 4, z),
          v: new THREE.Vector3((Math.random() - .5) * 2, -2 - Math.random() * 3, (Math.random() - .5) * 2), r: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
          w: new THREE.Vector3(Math.random() * 6 - 3, Math.random() * 6 - 3, Math.random() * 6 - 3), esc: gi ? .24 : .3, parado: false });
      }
      im.instanceColor.needsUpdate = true;
      cena.add(im);
    });
    let tempo = 0;
    som('chuva', { vezes: 3 });
    return {
      tique(dt) {
        tempo += dt;
        for (const k of pecas) {
          let esc = 0;
          if (tempo > k.nasce) {
            if (!k.parado) {
              k.v.y -= 22 * dt; k.p.addScaledVector(k.v, dt);
              k.r.x += k.w.x * dt; k.r.y += k.w.y * dt; k.r.z += k.w.z * dt;
              if (k.p.y < chao + .3) { k.p.y = chao + .3; k.v.y *= -.25; k.v.x *= .5; k.v.z *= .5; k.w.multiplyScalar(.5); if (Math.abs(k.v.y) < .8) { k.parado = true; k.r.x = 0; k.r.z = 0; } }
            }
            esc = k.esc * (tempo > duracao + 1.6 ? Math.max(0, 1 - (tempo - duracao - 1.6) / .5) : 1);
          }
          m4.compose(k.p, q.setFromEuler(e.copy(k.r)), s.set(esc, esc, esc));
          k.im.setMatrixAt(k.i, m4);
        }
        grupos.forEach(im => (im.instanceMatrix.needsUpdate = true));
      },
      parar() { grupos.forEach(im => { im.removeFromParent(); im.dispose(); }); mat.dispose(); },
    };
  }

  // ---------- Estúdio fora da tela (retratos, foto, objetos): mesmo renderizador, tudo no mesmo instante ----------
  function fotografar(cena, camera, w, h) {
    const r = obterRenderer(), antes = r.getSize(new THREE.Vector2()), pr = r.getPixelRatio(), tela = r.domElement;
    // Desempenho: se cabe no canvas atual, desenha num canto dele (viewport + tesoura) em vez de redimensioná-lo duas vezes:
    // cada setSize realoca o framebuffer (era ~30% do custo de cada retrato no PC fraco)
    if (w <= tela.width && h <= tela.height) {
      r.setViewport(0, 0, w / pr, h / pr); r.setScissor(0, 0, w / pr, h / pr); r.setScissorTest(true);
      r.setClearColor(0x000000, 0); r.clear();
      r.render(cena, camera);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(tela, 0, tela.height - h, w, h, 0, 0, w, h);
      r.setScissorTest(false); r.setViewport(0, 0, antes.x, antes.y);
      if (palco && rodando) renderer.render(palco.cena, palco.camera);   // a cena visível volta no mesmo quadro
      return cv;
    }
    r.setPixelRatio(1); r.setSize(w, h, false);
    r.setClearColor(0x000000, 0); r.clear();
    r.render(cena, camera);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    cv.getContext('2d').drawImage(r.domElement, 0, 0);
    r.setPixelRatio(pr); r.setSize(antes.x, antes.y, false);
    if (palco && rodando) renderer.render(palco.cena, palco.camera);   // a cena visível volta no mesmo quadro
    return cv;
  }
  // Contorno de adesivo índigo (guia §4.2): silhueta deslocada em 24 + 12 direções, só o anel, por baixo da imagem
  function adesivo(fonte, tam, raioRel = .025) {
    const W = fonte.width, H = fonte.height, raio = Math.max(W, H) * raioRel;
    const sil = document.createElement('canvas'); sil.width = W; sil.height = H;
    const s = sil.getContext('2d');
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; s.drawImage(fonte, Math.cos(a) * raio, Math.sin(a) * raio); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; s.drawImage(fonte, Math.cos(a) * raio * .5, Math.sin(a) * raio * .5); }
    s.globalCompositeOperation = 'source-in'; s.fillStyle = TINTA; s.fillRect(0, 0, W, H);
    s.globalCompositeOperation = 'destination-out'; s.drawImage(fonte, 0, 0);
    s.globalCompositeOperation = 'source-over'; s.drawImage(fonte, 0, 0);
    const out = document.createElement('canvas'); out.width = tam.w; out.height = tam.h;
    const o = out.getContext('2d'); o.imageSmoothingQuality = 'high'; o.drawImage(sil, 0, 0, tam.w, tam.h);
    return out;
  }
  // Renderiza um objeto com a receita do estúdio e devolve dataURL PNG transparente (retratos, mascote, miniaturas)
  const estudio = (obj, opcoes) => estudioCanvas(obj, opcoes).toDataURL('image/png');
  function estudioCanvas(obj, { tamanho = 256, centroY = 0, meia = 1.6, giro = -15, elev = 8, fov = 20, contorno = true } = {}) {
    obterRenderer();
    const cena = new THREE.Scene();
    luzes(cena, { raio: meia * 3, centro: new THREE.Vector3(0, centroY, 0), sombras: false });
    obj.rotation.y = THREE.MathUtils.degToRad(giro);
    cena.add(obj);
    const cam = new THREE.PerspectiveCamera(fov, 1, .1, 200), d = meia / Math.tan(THREE.MathUtils.degToRad(fov / 2)), e = THREE.MathUtils.degToRad(elev);
    cam.position.set(0, centroY + Math.sin(e) * d, Math.cos(e) * d); cam.lookAt(0, centroY, 0);
    const lado = Math.min(1024, tamanho * 2);
    const cv = fotografar(cena, cam, lado, lado);
    cena.remove(obj);
    return contorno ? adesivo(cv, { w: tamanho, h: tamanho }) : cv;
  }

  // Retrato do boneco (guia §7.7): 'rosto' (placar, chips), 'busto' (conselheiros, tablet, âncora) ou 'corpo' (provador)
  const POSE_T = { acenar: .5, comemorar: .78, pular: .2, palmas: .12, votar: .45, falar: .3, apontar: .5, 'bracos-cruzados': 1, pensar: 1,
    triste: 1, surpreso: .25, girar: .04, parado: .4 };
  const QUADROS = { rosto: { centroY: 2.5, meia: 1.02 }, busto: { centroY: 2.45, meia: 1.62 }, corpo: { centroY: 1.75, meia: 2.05, elev: 12, giro: -22 } };
  const cacheRetratos = new Map();
  function retrato(avatar, { expressao = 'feliz', acao = 'parado', tamanho = 160, enquadramento } = {}) {
    const q = enquadramento || (tamanho < 120 ? 'rosto' : 'busto');
    const chave = JSON.stringify([avatar.pid, avatar.cor, avatar.forma, avatar.pele, avatar.cabelo, avatar.penteado, avatar.chapeu, avatar.acessorio,
      avatar.humano, avatar.roupa, avatar.calca, avatar.faixa, expressao, acao, tamanho, q]);
    // Cache com teto (o provador gera dezenas de miniaturas a cada troca): sai o retrato mais antigo, cada um ~50 KB de PNG
    if (cacheRetratos.size >= 240 && !cacheRetratos.has(chave)) cacheRetratos.delete(cacheRetratos.keys().next().value);
    if (!cacheRetratos.has(chave)) cacheRetratos.set(chave, Promise.resolve().then(() => {
      const b = Bonecos.criar(avatar, { contorno: true, mesclar: false });   // desenhado uma vez só: juntar as peças não compensa
      b.posar(acao, POSE_T[acao] ?? .4, expressao);
      b.traverse(o => { if (o.isMesh) o.castShadow = false; });
      b.children.forEach(o => { if (o.isMesh && o.material?.map && o.material.transparent && o.renderOrder === -1) o.visible = false; });   // sem a bolha de sombra
      let quadro = QUADROS[q];
      if (q === 'corpo') {
        b.rotation.y = THREE.MathUtils.degToRad(quadro.giro); b.updateMatrixWorld(true);
        const cx = new THREE.Box3().setFromObject(b), alt = cx.max.y - Math.min(0, cx.min.y), larg = Math.max(cx.max.x - cx.min.x, 2.4);
        quadro = { ...quadro, centroY: (cx.max.y + Math.min(0, cx.min.y)) / 2, meia: Math.max(alt / 2 + .25, larg / 2 + .2, 1.9) };
      }
      const cv = estudioCanvas(b, { tamanho, ...quadro });
      b.descartar();
      return cv.toDataURL('image/png');
    }));
    return cacheRetratos.get(chave);
  }

  // ---------- Lobby: delegações sobre pedestais (guia §5.16) ----------
  const POSES_LOBBY = ['acenar', 'bracos-cruzados', 'pular', 'palmas', 'acenar', 'girar'], ESC_LOBBY = 1.3;
  const chaveAvatar = a => JSON.stringify([a.cor, a.forma, a.pele, a.cabelo, a.penteado, a.chapeu, a.acessorio, a.humano]);
  function vagasLobby(n) { const passo = 4.1; return Array.from({ length: n }, (_, i) => { const x = (i - (n - 1) / 2) * passo; return [x, -Math.abs(x) * .12]; }); }
  // ---------- Foco no lobby: a câmera anda e dá zoom no boneco da vez; ele sobe no pedestal e ganha o holofote, os vizinhos encolhem e escurecem ----------
  // Só move câmera, escala, altura e luz (nenhum boneco é recriado). Sem movimento (reduzido, ?rapido): vai direto ao fim.
  const _alvoFoco = new THREE.Vector3();
  function aplicarCamFoco(p) {
    const g = p.ajusteGeral, f = p.camFoco;
    if (!g || !f) return;
    const alvo = _alvoFoco.copy(g.centro).lerp(_v.set(f.x, 4.3, 0), f.k), cam = p.camera;
    const razao = cam.aspect < 4.5 ? Math.min(p.razaoFoco ?? 1, 20 / (p.largura || 53)) : p.razaoFoco ?? 1;   // faixa pouco larga (celular em pé): chega mais perto
    cam.position.copy(alvo).addScaledVector(g.dir, g.d * THREE.MathUtils.lerp(1, razao, f.k));
    cam.lookAt(alvo);
    p.camBase = { pos: cam.position.clone(), alvo: alvo.clone() };
  }
  function focoLobby(pid, { animar = true } = {}) {
    const p = palco;
    if (!p || p.nome !== 'lobby') return;
    p.foco = pid || null;
    if (p.tl && p.tl.progress() < 1) { p.tl.then(() => p.foco === (pid || null) && focoLobby(pid, { animar })); return; }   // os bonecos ainda estão caindo nos pedestais
    const sel = pid && p.pedestais[pid], dur = REDUZ || rapido() || !animar ? 0 : .7;
    p.tlFoco?.kill();
    const tl = p.tlFoco = gsap.timeline();
    p.camFoco ||= { x: 0, k: 0 };
    const alvoCam = sel ? { x: sel.position.x, k: 1 } : { k: 0 };
    if (dur) tl.to(p.camFoco, { ...alvoCam, duration: dur, ease: 'power2.inOut', onUpdate: () => aplicarCamFoco(p) }, 0); else { Object.assign(p.camFoco, alvoCam); aplicarCamFoco(p); }
    const alt = (alvo, props, t = 0) => { if (dur) tl.to(alvo, { ...props, duration: dur, ease: 'power2.inOut' }, t); else Object.assign(alvo, props); };
    for (const [id, b] of Object.entries(p.bonecos)) {
      const ped = p.pedestais[id], eh = id === pid, s = eh ? 1.12 : pid ? .88 : 1, y0 = eh ? .55 : 0;
      if (!ped) continue;
      const k = s;
      if (dur) {
        tl.to(ped.scale, { x: k, y: k, z: k, duration: dur, ease: 'power2.inOut' }, 0).to(ped.position, { y: y0, duration: dur, ease: 'power2.inOut' }, 0)
          .to(b.scale, { x: ESC_LOBBY * k, y: ESC_LOBBY * k, z: ESC_LOBBY * k, duration: dur, ease: 'power2.inOut' }, 0).to(b.position, { y: ped.userData.topo * k + y0, duration: dur, ease: 'power2.inOut' }, 0);
      } else { ped.scale.setScalar(k); ped.position.y = y0; b.scale.setScalar(ESC_LOBBY * k); b.position.y = ped.userData.topo * k + y0; }
    }
    // quem não está em foco fica na penumbra: baixa a luz geral e acende o holofote
    alt(p.luz.hemi, { intensity: p.base.hemi * (pid ? .22 : 1) }); alt(p.luz.chave, { intensity: p.base.chave * (pid ? .22 : 1) }); alt(p.luz.recorte, { intensity: p.base.recorte * (pid ? .2 : 1) });
    alt(p.cena, { environmentIntensity: pid ? .06 : .35 });
    if (p.spot) {
      if (sel) { alt(p.spot.position, { x: sel.position.x }); alt(p.spot.target.position, { x: sel.position.x, y: 3, z: 0 }); }
      alt(p.spot, { intensity: pid ? 170 : 0 });
    }
    if (sel && p.bonecos[pid] && !REDUZ) p.bonecos[pid].acao('pular');
  }
  async function lobby(avatares = [], opcoes = {}) {
    if (palcoFundo?.nome === 'lobby' && palco?.nome === 'previa') { const p = palcoFundo; palcoFundo = null; abrir(p); }
    if (palco?.nome === 'lobby' && !opcoes.el) {
      if (opcoes.faixa && (opcoes.faixa[0] !== palco.faixa?.[0] || opcoes.faixa[1] !== palco.faixa?.[1])) { palco.faixa = opcoes.faixa; redimensionar(); }   // a janela mudou de formato
      return atualizarLobby(palco, avatares);
    }
    const cena = new THREE.Scene(), camera = new THREE.PerspectiveCamera(26, 1, .5, 400);
    const vagas = vagasLobby(avatares.length);
    const luz = luzes(cena, { raio: 16, centro: new THREE.Vector3(0, 2, 0) });
    chaoDeSombra(cena);
    const p = { nome: 'lobby', luz, base: { hemi: luz.hemi.intensity, chave: luz.chave.intensity, recorte: luz.recorte.intensity }, cena, camera, fundo: opcoes.fundo === undefined ? 'mesa' : opcoes.fundo, el: opcoes.el, faixa: opcoes.faixa || (opcoes.el ? [0, 1] : [.07, .58]),
      elev: 12, margem: .9, bonecos: {}, chaves: {}, pedestais: {}, vagas, avatares };
    const tl = p.tl = gsap.timeline();
    if (!window.PC_FRACO) {   // holofote sobre quem está em foco (nasce apagado: acender é só mudar a intensidade, sem recompilar nada)
      p.spot = new THREE.SpotLight('#FFF3C8', 0, 60, .3, .7, 1.2); p.spot.position.set(0, 18, 9);
      cena.add(p.spot, p.spot.target);
    }
    avatares.forEach((av, i) => {
      const [x, z] = vagas[i], ped = pedestal(av.pid);
      ped.position.set(x, 0, z); ped.rotation.y = -x * .025; cena.add(ped);
      contato(cena, x, z, 1.7, 1.7);
      p.pedestais[av.pid] = ped;
      colocarNoLobby(p, av, i, tl, .15 + i * .12);
    });
    const ponta = vagas.length ? Math.abs(vagas[0][0]) : 4;
    tijolosSoltos(cena, [[-ponta - 2.3, 1.6, 1, .5], [-ponta - 1.9, 2.9, 0, .2], [ponta + 2.2, 1.9, 0, -.4], [ponta + 2.5, .6, 1, 1.1]],
      [AMARELO, '#FFF4DC', AMARELO, '#FFF4DC']);
    const largura = Math.max(10, vagas.length * 4.1);
    p.largura = largura; p.razaoFoco = THREE.MathUtils.clamp(40 / largura, .3, 1);   // zoom do foco: cabem uns 3 pedestais
    p.caixa = new THREE.Box3(new THREE.Vector3(-largura / 2 - 1.6, 0, -2), new THREE.Vector3(largura / 2 + 1.6, 6.6, 2));
    let proxima = 3;
    p.tique = (dt, t) => {   // de vez em quando, um boneco faz a pose da personalidade (um foco por vez)
      if (REDUZ || t < proxima) return;
      proxima = t + 2.2 + Math.random() * 1.6;
      const pids = Object.keys(p.bonecos), pid = pids[Math.floor(Math.random() * pids.length)], b = p.bonecos[pid];
      const i = p.avatares.findIndex(a => a.pid === pid), pose = POSES_LOBBY[i % POSES_LOBBY.length];
      if (pose !== 'bracos-cruzados') b.acao(pose);
    };
    abrir(p);
    return fimTl(tl);
  }
  function colocarNoLobby(p, av, i, tl, quando) {
    const ped = p.pedestais[av.pid], b = Bonecos.criar(av);
    b.position.set(ped.position.x, ped.userData.topo, ped.position.z); b.scale.setScalar(ESC_LOBBY);
    b.rotation.y = -ped.position.x * .03;
    b.visible = false;
    p.cena.add(b);
    p.bonecos[av.pid] = b; p.chaves[av.pid] = chaveAvatar(av);
    const pose = POSES_LOBBY[i % POSES_LOBBY.length];
    if (pose === 'bracos-cruzados') b.acao(pose, 0);
    cair(tl, b, quando, ped.userData.topo);
    tl.call(() => { if (pose !== 'bracos-cruzados') b.acao(i % 2 ? 'pular' : 'acenar'); }, null, quando + .5);
    return b;
  }
  function atualizarLobby(p, avatares) {
    const tl = gsap.timeline();
    p.avatares = avatares;
    avatares.forEach((av, i) => {
      if (!p.pedestais[av.pid] || p.chaves[av.pid] === chaveAvatar(av)) return;
      p.bonecos[av.pid]?.descartar();
      const b = colocarNoLobby(p, av, i, tl, 0);
      tl.call(() => som('pop'), null, 0);
      if (b) { b.acao('surpreso'); if (p.foco) tl.call(() => focoLobby(p.foco, { animar: false }), null, .5); }
    });
    p.tl = tl;
    return fimTl(tl);
  }

  // ---------- Provador: boneco girando sobre base redonda (uma volta a cada 12 s; arrastar gira com inércia) ----------
  async function previa(avatar, opcoes = {}) {
    if (!avatar) {   // fecha a prévia e devolve a cena de trás
      if (palcoFundo) { const p = palcoFundo; palcoFundo = null; abrir(p); } else if (palco?.nome === 'previa') esconder();
      return;
    }
    if (palco?.nome === 'previa' && palco.pid === avatar.pid && (!opcoes.el || opcoes.el === palco.el)) return trocarPrevia(palco, avatar, opcoes.acao);
    const cena = new THREE.Scene(), camera = new THREE.PerspectiveCamera(24, 1, .3, 200), pc = P();
    luzes(cena, { raio: 6, centro: new THREE.Vector3(0, 1.8, 0) });
    chaoDeSombra(cena, 30, .2);
    const giro = new THREE.Group(); cena.add(giro);
    malha(pc.redonda(2.3, .4, { comPino: false, lados: 56 }), pc.plastico(ESCURA, .32), cena);
    const base = pedestal(avatar.pid, { raio: 1.85, altura: .8 }); base.position.y = .4; giro.add(base);
    contato(cena, 0, 0, 2.3, 2.3);
    const p = { nome: 'previa', cena, camera, fundo: opcoes.el ? null : (opcoes.fundo ?? 'mesa'), el: opcoes.el, interativo: !!opcoes.el,
      faixa: [0, 1], elev: 10, margem: .82, giro: 0, bonecos: {}, rodaGiro: giro, alturaPe: .4 + base.userData.topo, pid: avatar.pid };
    p.caixa = new THREE.Box3(new THREE.Vector3(-2.3, 0, -1.4), new THREE.Vector3(2.3, 5.4, 1.4));
    const b = Bonecos.criar(avatar); b.position.y = p.alturaPe; giro.add(b); p.bonecos[avatar.pid || 'previa'] = b;
    let vel = Math.PI * 2 / 12, arrastando = null;
    const cv = obterRenderer().domElement;
    const desce = e => { arrastando = { x: e.clientX, t: performance.now() }; cv.setPointerCapture?.(e.pointerId); };
    const move = e => {
      if (!arrastando) return;
      const dx = e.clientX - arrastando.x, agora = performance.now();
      giro.rotation.y += dx * .012; vel = dx * .012 / Math.max(.016, (agora - arrastando.t) / 1000);
      arrastando = { x: e.clientX, t: agora };
    };
    const sobe = () => { arrastando = null; };
    if (p.interativo) { cv.addEventListener('pointerdown', desce); cv.addEventListener('pointermove', move); addEventListener('pointerup', sobe); }
    p.limpar = () => { cv.removeEventListener('pointerdown', desce); cv.removeEventListener('pointermove', move); removeEventListener('pointerup', sobe); };
    p.tique = dt => {
      if (arrastando) return;
      const alvo = REDUZ ? 0 : Math.PI * 2 / 12;
      vel += (alvo - vel) * (1 - Math.exp(-dt * 1.6));   // inércia que volta ao giro lento
      giro.rotation.y += vel * dt;
    };
    abrir(p, { manterFundo: true });
    if (opcoes.acao) b.acao(opcoes.acao);
  }
  function trocarPrevia(p, avatar, acao) {
    const velho = Object.values(p.bonecos)[0];
    const b = Bonecos.criar(avatar); b.position.y = p.alturaPe; p.rodaGiro.add(b);
    velho?.descartar();
    p.bonecos = { [avatar.pid || 'previa']: b };
    som('pop');
    if (!REDUZ) gsap.timeline().fromTo(b.scale, { x: 1.08, y: .85, z: 1.08 }, { x: .96, y: 1.08, z: .96, duration: .14, ease: 'power2.out' })
      .to(b.scale, { x: 1, y: 1, z: 1, duration: .21, ease: 'back.out(3)' });
    if (acao) b.acao(acao);
    return Promise.resolve();
  }

  // ---------- Sala da ONU: diorama redondo, mesa em anel, telão, bandeirolas, delegações em volta ----------
  const texTelao = () => P().textura('telao', (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#16307A'); gr.addColorStop(1, '#0B1A4C');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(143,211,255,.12)'; g.lineWidth = 2;
    for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    if (typeof MAPA !== 'undefined') {   // o próprio mapa de peças do jogo, em pixels ciano
      const M = MAPA, px = Math.min((w * .86) / M.colunas, (h * .8) / M.linhas), x0 = (w - M.colunas * px) / 2, y0 = (h - M.linhas * px) / 2;
      g.fillStyle = '#6FE7FF';
      for (let k = 0; k < M.celulas.length; k++) { const ch = M.celulas[k]; if (ch === '.' || ch === '~') continue; g.fillRect(x0 + (k % M.colunas) * px, y0 + Math.floor(k / M.colunas) * px, px * .8, px * .8); }
    }
    const v = g.createRadialGradient(w / 2, h / 2, h * .2, w / 2, h / 2, w * .62); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(5,10,40,.55)');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
  }, 1024, 576);
  const texPiso = () => P().textura('pisoONU', (g, w, h) => {
    const n = 16, c = w / n;
    for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { g.fillStyle = (i + k) % 2 ? '#F3EAD6' : '#FFF4DC'; g.fillRect(i * c, k * c, c, c); }
    g.strokeStyle = 'rgba(26,20,51,.12)'; g.lineWidth = 2;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * c, 0); g.lineTo(i * c, h); g.stroke(); g.beginPath(); g.moveTo(0, i * c); g.lineTo(w, i * c); g.stroke(); }
    g.fillStyle = 'rgba(53,80,200,.18)'; g.beginPath(); g.arc(w / 2, h / 2, w * .2, 0, 7); g.fill();
  }, 1024, 1024);
  const texGlobo = () => P().textura('globoONU', (g, w, h) => {
    g.fillStyle = '#38B1DC'; g.fillRect(0, 0, w, h);
    if (typeof MAPA !== 'undefined') {
      const M = MAPA, cw = w / M.colunas, ch = h / M.linhas;
      g.fillStyle = '#7CCB4E';
      for (let k = 0; k < M.celulas.length; k++) { const c = M.celulas[k]; if (c === '.' || c === '~') continue; g.fillRect((k % M.colunas) * cw, Math.floor(k / M.colunas) * ch, cw + .5, ch + .5); }
    }
  }, 512, 256);

  // assentos em dois arcos (13 delegações): fila da frente (assento, mais perto da mesa) e fila de trás (assentoAtras, em pedestal mais alto)
  const SALA = { raio: 11.6, mesaIn: 2.3, mesaOut: 3.55, mesaY: 2.15, assento: 5.4, assentoAtras: 8.1, telaoZ: -10.4, esc: 1.3 };
  function montarSala(cena, emergencia) {
    const pc = P(), sala = new THREE.Group(); cena.add(sala);
    // plataforma do diorama: lateral índigo, fileira de pinos creme na borda, piso xadrez creme
    const base = malha(pc.redonda(SALA.raio, 1.2, { comPino: false, lados: 72 }), pc.plastico(ESCURA, .35), sala);
    base.add(new THREE.Mesh(pc.casca(base.geometry, .05), pc.tinta(TINTA)));
    const piso = malha(new THREE.CircleGeometry(SALA.raio - .2, 72), new THREE.MeshStandardMaterial({ map: texPiso(), roughness: .4 }), sala, 0, 1.205);
    piso.rotation.x = -Math.PI / 2; piso.castShadow = false; piso.userData.proprio = true;
    const nB = 44, borda = new THREE.InstancedMesh(pc.pino(12), pc.plastico(CREME, .3), nB), m4 = new THREE.Matrix4();
    for (let i = 0; i < nB; i++) { const a = i / nB * Math.PI * 2; borda.setMatrixAt(i, m4.makeTranslation(Math.cos(a) * (SALA.raio - .5), 1.2, Math.sin(a) * (SALA.raio - .5))); }
    borda.receiveShadow = true; sala.add(borda);
    // mesa em anel: tampo creme com faixa (anil na sessão geral, vermelha na emergência), sobre pés de tijolo
    const { mesaIn: ri, mesaOut: ro, mesaY } = SALA;
    const perfil = [[ri + .05, 0], [ro - .05, 0], [ro, .05], [ro, .4], [ro - .05, .45], [ri + .05, .45], [ri, .4], [ri, .05]].map(([x, y]) => new THREE.Vector2(x, y));
    const tampo = malha(new THREE.LatheGeometry(perfil, 72), pc.plastico(LADRILHO, .3), sala, 0, mesaY);
    tampo.userData.proprio = true;
    tampo.add(new THREE.Mesh(pc.casca(tampo.geometry, .04), pc.tinta(TINTA)));
    const faixa = malha(new THREE.CylinderGeometry(ro + .02, ro + .02, .2, 72, 1, true), pc.plastico(emergencia ? '#F0303A' : '#3550C8', .3), sala, 0, mesaY + .22);
    faixa.userData.proprio = true;
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .5; malha(pc.bloco(1, mesaY - 1.2, 1, { pinos: false }), pc.plastico(ESCURA, .35), sala, Math.cos(a) * (ri + ro) / 2, 1.2, Math.sin(a) * (ri + ro) / 2); }
    // globo de peças do jogo no centro (emblema próprio; nunca o da ONU)
    const globo = new THREE.Group(); globo.position.y = mesaY + 1.2; sala.add(globo);
    const bola = malha(pc.esfera(1.05, false, 48), new THREE.MeshStandardMaterial({ map: texGlobo(), roughness: .3 }), globo);
    bola.add(new THREE.Mesh(pc.casca(bola.geometry, .05), pc.tinta(TINTA)));
    bola.rotation.z = .41;
    malha(pc.redonda(.8, .4, { lados: 40 }), pc.plastico(AMARELO, .28), sala, 0, 1.2);
    malha(pc.cil(.12, .12, mesaY - .2, 12), pc.plastico(AMARELO, .28), sala, 0, 1.2 + (mesaY - .2) / 2 + .2);
    // telão ao fundo
    const telao = new THREE.Group(); telao.position.set(0, 1.2, SALA.telaoZ); sala.add(telao);
    malha(pc.bloco(10, 1.2, 1.4), pc.plastico(PRETA, .35), telao);
    const moldura = malha(pc.caixa(10.6, 6, .8, .25), pc.plastico(PRETA, .35), telao, 0, 4.3);
    moldura.add(new THREE.Mesh(pc.casca(moldura.geometry, .05), pc.tinta(TINTA)));
    const tela = malha(new THREE.PlaneGeometry(9.8, 5.3), new THREE.MeshStandardMaterial({ map: texTelao(), emissive: '#FFFFFF', emissiveMap: texTelao(), emissiveIntensity: .55, roughness: .25 }), telao, 0, 4.3, .41);
    tela.castShadow = false; tela.userData.proprio = true;
    for (let i = 0; i < 5; i++) malha(pc.pino(16), pc.plastico(AMARELO, .3), telao, -4 + i * 2, 7.3, 0).scale.set(1.2, 1.2, 1.2);
    return { sala, globo: bola, faixa };
  }
  function bandeirola(pid) {
    const eq = equipe(pid), pc = P(), g = new THREE.Group();
    const pe = malha(pc.bloco(2, .4, 2), pc.plastico(CREME, .3), g); pe.add(new THREE.Mesh(pc.casca(pe.geometry, .025), pc.tinta(TINTA)));
    malha(pc.cil(.1, .1, 5, 12), pc.plastico(CREME, .3), g, 0, 2.9);
    malha(pc.esfera(.22, false, 16), pc.plastico(AMARELO, .28), g, 0, 5.45);
    const pano = malha(pc.caixa(1.7, 2.3, .1, .05), pc.plastico(eq.cor, .32), g, .95, 4.05);
    pano.add(new THREE.Mesh(pc.casca(pano.geometry, .03), pc.tinta(TINTA)));
    if (eq.forma) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshStandardMaterial({ map: pc.texForma(eq.forma, '#FFFFFF'), transparent: true, roughness: .3 }));
      f.position.set(.95, 4.08, .06); f.userData.proprio = true; g.add(f);
    }
    return g;
  }
  async function salaONU(e, avatares = [], opcoes = {}) {
    const emergencia = !!opcoes.emergencia;
    const cena = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, .5, 400);
    const luz = luzes(cena, { raio: 14, centro: new THREE.Vector3(0, 2, -1) });
    if (emergencia) { luz.recorte.color.set('#FF6B6B'); luz.recorte.intensity = 2; }
    chaoDeSombra(cena, 120, .25);
    const { sala, globo } = montarSala(cena, emergencia);
    contato(cena, 0, 0, SALA.raio, SALA.raio, .003);
    // até 6 delegações cabem num arco só; com mais, as pares ficam atrás (arco maior, pedestal mais alto) e as ímpares na frente, intercaladas
    const n = avatares.length, duas = n > 7, abertura = duas ? 150 : 140, ini = duas ? -165 : -160;
    const angulos = Array.from({ length: n }, (_, i) => THREE.MathUtils.degToRad(n === 1 ? -90 : ini + i * abertura / (n - 1)));
    const p = { nome: 'salaONU', cena, camera, fundo: opcoes.fundo === undefined ? (emergencia ? 'crise' : 'mesa') : opcoes.fundo, el: opcoes.el,
      faixa: opcoes.faixa || [0, 1], elev: 27, margem: .94, bonecos: {}, assentos: {}, votosMostrados: [], globo };
    const tl = p.tl = gsap.timeline();
    const permanente = pid => { try { return !!POTENCIAS.find(x => x.id === pid)?.permanente; } catch { return false; } };
    avatares.forEach((av, i) => {
      const atras = duas && i % 2 === 0, a = angulos[i], R = atras ? SALA.assentoAtras : SALA.assento, x = Math.cos(a) * R, z = Math.sin(a) * R, olha = Math.atan2(-x, -z);
      const ped = pedestal(av.pid, { raio: .95, altura: atras ? 1.15 : .45 });
      ped.position.set(x, 1.2, z); ped.rotation.y = olha; sala.add(ped);
      const b = Bonecos.criar(av); b.scale.setScalar(SALA.esc);
      b.position.set(x, 1.2 + ped.userData.topo, z); b.rotation.y = olha;
      b.visible = false; sala.add(b);
      p.bonecos[av.pid] = b; p.assentos[av.pid] = { x, z, a };
      // plaquinha da delegação sobre a mesa (tijolo na cor, forma branca) + pino amarelo de quem tem veto (P5)
      const pl = new THREE.Group(); const rp = (SALA.mesaIn + SALA.mesaOut) / 2 + .35;
      pl.position.set(Math.cos(a) * rp, SALA.mesaY + .45, Math.sin(a) * rp); pl.rotation.y = olha; sala.add(pl);
      if (duas) pl.scale.setScalar(.55);   // 13 plaquinhas no mesmo anel: cada uma encolhe para não encostar na vizinha
      const t = malha(P().bloco(2, .6, 1), P().plastico(equipe(av.pid).cor, .3), pl);
      t.add(new THREE.Mesh(P().casca(t.geometry, .025), P().tinta(TINTA)));
      if (equipe(av.pid).forma) {
        const f = new THREE.Mesh(new THREE.PlaneGeometry(.5, .5), new THREE.MeshStandardMaterial({ map: P().texForma(equipe(av.pid).forma, '#FFFFFF'), transparent: true }));
        f.position.set(0, .3, -.51); f.rotation.y = Math.PI; f.userData.proprio = true; pl.add(f);
      }
      if (permanente(av.pid)) malha(P().redonda(.42, .4, { lados: 24 }), P().plastico(AMARELO, .28), pl, .55, .6, 0);
      cair(tl, b, .1 + i * .1, b.position.y, { som: 'pop' });
    });
    const pids = avatares.map(a => a.pid);
    // bandeirolas nos cantos da frente (as potências ao longo da lista); com duas filas de assentos, o fundo fica livre
    const flag = duas ? [[-1, 0], [1, 0], [-1, 1], [1, 1]] : [-1, 1].flatMap(s => [0, 1, 2].map(k => [s, k]));
    flag.forEach(([s, k], j) => {
      const pid = pids[(duas ? j * 3 : (s < 0 ? k : k + 3)) % Math.max(1, pids.length)] || PIDS[0], bd = bandeirola(pid);
      if (duas) { bd.position.set(s * (10.1 - k * .3), 1.2, 1.4 + k * 2.6); bd.rotation.y = -s * (.5 + k * .18); }
      else { bd.position.set(s * (6.6 + k * 1.05), 1.2, -6.6 + k * 1.9); bd.rotation.y = -s * (.5 + k * .18); }
      sala.add(bd);
    });
    p.caixa = duas ? new THREE.Box3(new THREE.Vector3(-10.4, 1, -11.6), new THREE.Vector3(10.4, 8.6, 7)) : new THREE.Box3(new THREE.Vector3(-8.6, 1, -9), new THREE.Vector3(8.6, 7.8, 6.5));
    p.tique = dt => { if (!REDUZ) globo.rotation.y += dt * .25; };
    abrir(p);
    return fimTl(tl);
  }
  // Votos revelados um a um: tijolinho sobre a cabeça, com a cor E o símbolo (✓ ✕ – ✋)
  const VOTO = {
    sim: { cor: '#3CD46A', tinta: '#FFFFFF' }, nao: { cor: '#F0303A', tinta: '#FFFFFF' },
    abst: { cor: '#E3E9F4', tinta: TINTA }, veto: { cor: '#B0001A', tinta: '#FFFFFF' },
  };
  const texVoto = tipo => P().textura('voto' + tipo, (g, w) => {
    const v = VOTO[tipo]; g.clearRect(0, 0, w, w); g.lineCap = g.lineJoin = 'round';
    const traco = (desenhar, larg) => { g.strokeStyle = TINTA; g.lineWidth = larg + w * .09; g.beginPath(); desenhar(); g.stroke(); g.strokeStyle = v.tinta; g.lineWidth = larg; g.beginPath(); desenhar(); g.stroke(); };
    if (tipo === 'sim') traco(() => { g.moveTo(w * .22, w * .52); g.lineTo(w * .42, w * .72); g.lineTo(w * .78, w * .3); }, w * .13);
    else if (tipo === 'nao') traco(() => { g.moveTo(w * .27, w * .27); g.lineTo(w * .73, w * .73); g.moveTo(w * .73, w * .27); g.lineTo(w * .27, w * .73); }, w * .13);
    else if (tipo === 'abst') { g.strokeStyle = TINTA; g.lineWidth = w * .14; g.beginPath(); g.moveTo(w * .26, w * .5); g.lineTo(w * .74, w * .5); g.stroke(); }
    else {   // mão espalmada desenhada (veto)
      const mao = new Path2D('M30 88 C22 80 16 66 14 56 C13 50 20 47 24 52 L30 62 L30 22 C30 15 39 15 39 22 L39 48 L41 48 L41 14 C41 7 50 7 50 14 L50 48 L52 48 L52 18 C52 11 61 11 61 18 L61 50 L63 50 L63 28 C63 21 72 21 72 28 L72 66 C72 80 64 90 52 90 L40 90 C36 90 33 90 30 88 Z');
      g.save(); g.scale(w / 100, w / 100); g.lineWidth = 9; g.strokeStyle = TINTA; g.stroke(mao); g.fillStyle = '#FFFFFF'; g.fill(mao); g.restore();
    }
  }, 256);
  async function votos(lista = {}) {
    const p = palco;
    if (!p || p.nome !== 'salaONU') return;
    p.votosMostrados.forEach(m => m.removeFromParent()); p.votosMostrados = [];
    const tl = p.tl = gsap.timeline(), pc = P();
    const ordem = Object.keys(p.bonecos).filter(pid => lista[pid]);
    let t = .1;
    ordem.forEach((pid, i) => {
      const tipo = lista[pid] in VOTO ? lista[pid] : 'abst', v = VOTO[tipo], b = p.bonecos[pid], veto = tipo === 'veto';
      const g = new THREE.Group(), esc = veto ? 1.6 : 1.15;
      const tij = malha(pc.bloco(1, 1.2, 1), pc.plastico(v.cor, .28), g, 0, -.6);
      tij.add(new THREE.Mesh(pc.casca(tij.geometry, .035), pc.tinta(TINTA)));
      const face = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9), new THREE.MeshStandardMaterial({ map: texVoto(tipo), transparent: true, roughness: .3, polygonOffset: true, polygonOffsetFactor: -1 }));
      face.position.set(0, 0, .505); face.userData.proprio = true; g.add(face);
      const y = b.position.y + 3.3 * b.scale.y + 1;
      g.position.set(b.position.x, y, b.position.z);
      g.lookAt(p.camera.position.x, y, p.camera.position.z);
      g.scale.setScalar(esc); g.visible = false;
      p.cena.add(g); p.votosMostrados.push(g);
      tl.call(() => b.acao('votar'), null, t);
      if (REDUZ) tl.set(g, { visible: true }, t + .3).call(() => som(veto ? 'trovao' : 'voto'), null, t + .3);
      else {
        tl.set(g, { visible: true }, t + .25)
          .fromTo(g.position, { y: y + 5 }, { y, duration: .42, ease: 'power2.in' }, t + .25)
          .fromTo(g.scale, { x: esc * .9, y: esc * 1.12, z: esc * .9 }, { x: esc * 1.1, y: esc * .86, z: esc * 1.1, duration: .07 }, t + .67)
          .to(g.scale, { x: esc, y: esc, z: esc, duration: .14, ease: 'back.out(3)' }, t + .74)
          .call(() => { som(veto ? 'trovao' : 'tijolo', { i }); if (veto) { trauma = Math.min(1, trauma + .6); b.acao('apontar', 1.2); } }, null, t + .67);
      }
      t += veto ? 1.1 : .6;
    });
    tl.to({}, { duration: .4 }, t);
    return fimTl(tl);
  }
  // Quem fala: a câmera chega perto, as outras delegações olham para ele; fala(null) volta à mesa inteira
  async function fala(pid) {
    const p = palco;
    if (!p || p.nome !== 'salaONU') return;
    Object.entries(p.bonecos).forEach(([id, b]) => {
      if (id === pid) { b.olhar(0); b.acao('falar', 0); return; }
      if (b.userData.acaoFala) b.acao('parado');
      if (!pid) { b.olhar(0); return; }
      const alvo = p.bonecos[pid].position, ang = Math.atan2(alvo.x - b.position.x, alvo.z - b.position.z) - b.rotation.y;
      b.olhar(Math.max(-.9, Math.min(.9, Math.atan2(Math.sin(ang), Math.cos(ang)))));
    });
    Object.values(p.bonecos).forEach(b => (b.userData.acaoFala = false));
    if (pid && p.bonecos[pid]) p.bonecos[pid].userData.acaoFala = true;
    const cam = p.camera, geral = p.camGeral;
    if (!geral) return;
    let pos = geral.pos.clone(), alvo = geral.alvo.clone();
    if (pid && p.bonecos[pid]) {   // plano de quem fala: a câmera vem do meio da mesa, de frente para a delegação
      const b = p.bonecos[pid], dir = new THREE.Vector3(b.position.x, 0, b.position.z).normalize();
      alvo = new THREE.Vector3(b.position.x, b.position.y + 2.3, b.position.z);
      pos = alvo.clone().addScaledVector(dir, -18).add(new THREE.Vector3(0, 4.4, 0));
    }
    som('whoosh');
    const olhar = (p.camBase?.alvo || geral.alvo).clone();
    p.camBase = { pos, alvo };
    if (REDUZ) { cam.position.copy(pos); cam.lookAt(alvo); return; }
    const tl = p.tl = gsap.timeline({ onUpdate: () => cam.lookAt(olhar) });
    tl.to(cam.position, { x: pos.x, y: pos.y, z: pos.z, duration: 1.1, ease: 'power2.inOut' }, 0)
      .to(olhar, { x: alvo.x, y: alvo.y, z: alvo.z, duration: 1.1, ease: 'power2.inOut' }, 0);
    return fimTl(tl);
  }

  // ---------- Revelação: noite, pedestal de tijolos, holofote de baixo na cor do papel ----------
  const COR_PAPEL = { diplomata: '#8FE3FF', infiltrado: '#FF6B6B', missao: AMARELO };
  const texFeixe = () => P().textura('feixe', (g, w, h) => {
    const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.6, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }, 16, 128);
  async function revelacao(avatar, papel, opcoes = {}) {
    const cor = COR_PAPEL[papel] || '#FFFFFF', pc = P();
    const cena = new THREE.Scene(), camera = new THREE.PerspectiveCamera(24, 1, .3, 200);
    const luz = luzes(cena, { raio: 7, centro: new THREE.Vector3(0, 2.5, 0), chave: 1.9 });
    luz.hemi.intensity = .6;
    luz.recorte.color.set(cor); luz.recorte.intensity = 1.6;   // a cor do papel no contorno; a cor da equipe continua legível
    const baixo = new THREE.PointLight(cor, 8, 12, 1.6); baixo.position.set(0, 1.2, 3); cena.add(baixo);
    chaoDeSombra(cena, 40, .3);
    const ped = new THREE.Group(); cena.add(ped);
    const degrau = malha(pc.redonda(2.25, .8, { comPino: false, lados: 56 }), pc.plastico(ESCURA, .32), ped);
    degrau.add(new THREE.Mesh(pc.casca(degrau.geometry, .04), pc.tinta(TINTA)));
    const topo = pedestal(avatar.pid, { raio: 1.65, altura: .9 }); topo.position.y = .8; ped.add(topo);
    contato(cena, 0, 0, 2.4, 2.4);
    const feixe = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 1.2, 7, 48, 1, true),
      new THREE.MeshBasicMaterial({ color: cor, map: texFeixe(), transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    const yPe = .8 + topo.userData.topo;
    feixe.position.set(0, yPe + 3.3, -.3); feixe.userData.proprio = true; cena.add(feixe);
    const b = Bonecos.criar(avatar); b.scale.setScalar(1.5); b.position.y = yPe; cena.add(b);
    const POSE = { diplomata: 'acenar', infiltrado: 'bracos-cruzados', missao: 'pensar' }, pose = POSE[papel] || 'parado';
    b.acao(pose, pose === 'acenar' ? undefined : 0);
    if (papel === 'infiltrado' || papel === 'missao') b.expressao('determinado');
    const p = { nome: 'revelacao', cena, camera, fundo: opcoes.fundo === undefined ? 'noite' : opcoes.fundo, el: opcoes.el, faixa: opcoes.faixa || [.2, .76],
      elev: 7, margem: .96, bonecos: { [avatar.pid || 'eu']: b } };
    p.caixa = new THREE.Box3(new THREE.Vector3(-2.3, 0, -2), new THREE.Vector3(2.3, yPe + 5.4, 2));
    let aceno = 2.6;
    p.tique = (dt, t) => {
      if (!REDUZ) feixe.material.opacity = .3 + Math.sin(t * 1.4) * .05;
      if (pose === 'acenar' && t > aceno) { aceno = t + 2.6; b.acao('acenar'); }   // o diplomata acena de novo de tempos em tempos
    };
    const tl = p.tl = gsap.timeline();
    if (!REDUZ) {
      tl.fromTo(feixe.scale, { y: .01 }, { y: 1, duration: .5, ease: 'power2.out' }, 0)
        .fromTo(baixo, { intensity: 0 }, { intensity: 8, duration: .5 }, 0)
        .fromTo(b.scale, { x: .01, y: .01, z: .01 }, { x: 1.5, y: 1.5, z: 1.5, duration: .5, ease: 'back.out(1.8)' }, .15);
    }
    abrir(p);
    return fimTl(tl);
  }

  // ---------- Pódio: colunas de tijolos sobem (3º, 2º, 1º), o boneco cai e comemora, chuva de tijolinhos ----------
  const texNumero = (n, cor) => P().textura('num' + n + cor, (g, w, h) => {
    g.clearRect(0, 0, w, h); letraBolha(g, String(n), w / 2, h * .54, h * .72, { cor });
  }, 256, 256);
  async function podio(ranking = [], avatares = [], opcoes = {}) {
    await fontesProntas();
    const pids = ranking.map(r => (typeof r === 'string' ? r : r.pid || r.id)).filter(Boolean);
    const avDe = pid => avatares.find(a => a.pid === pid) || { pid };
    const cena = new THREE.Scene(), camera = new THREE.PerspectiveCamera(28, 1, .5, 400), pc = P();
    const luz = luzes(cena, { raio: 14, centro: new THREE.Vector3(0, 3, 0) });
    chaoDeSombra(cena, 100, .24);
    const holofote = new THREE.SpotLight('#FFF3C8', 0, 40, .3, .7, 1.2); holofote.position.set(0, 18, 6); holofote.target.position.set(0, 6, 0);
    cena.add(holofote, holofote.target);
    const LUGARES = [{ x: 0, tijolos: 5 }, { x: -3.6, tijolos: 4 }, { x: 3.6, tijolos: 3 }];
    const p = { nome: 'podio', cena, camera, fundo: opcoes.fundo === undefined ? 'raios' : opcoes.fundo, el: opcoes.el, faixa: opcoes.faixa || [.06, .86],
      elev: 9, margem: .9, bonecos: {}, mira: new THREE.Vector3(0, -.4, 0) };
    const tl = p.tl = gsap.timeline();
    const QUANDO = [6.5, 3.0, .8];   // 1º, 2º, 3º
    let chuvaAtiva = null;
    pids.slice(0, 3).forEach((pid, i) => {
      const eq = equipe(pid), L = LUGARES[i], col = new THREE.Group(); col.position.set(L.x, .3, 0); cena.add(col);
      const aro = malha(pc.caixa(3.7, .3, 3.7, .08), pc.plastico(CREME, .3), cena, L.x, .15, 0);   // a cor da equipe não encosta na mesa anil
      aro.add(new THREE.Mesh(pc.casca(aro.geometry, .03), pc.tinta(TINTA)));
      contato(cena, L.x, 0, 2, 2);
      const quando = QUANDO[i];
      for (let k = 0; k < L.tijolos; k++) {
        const ult = k === L.tijolos - 1;
        const t = malha(pc.bloco(3, 1.2, 3, { pinos: ult }), pc.plastico(ult ? eq.clara : eq.cor, .3), col, 0, k * 1.2);
        t.add(new THREE.Mesh(pc.casca(t.geometry, .03), pc.tinta(TINTA)));
        t.visible = false;
        const quedaEm = quando + k * .09;
        if (REDUZ) tl.set(t, { visible: true }, quando);
        else tl.set(t, { visible: true }, quedaEm).fromTo(t.position, { y: k * 1.2 + 6 }, { y: k * 1.2, duration: .32, ease: 'power2.in' }, quedaEm)
          .fromTo(t.scale, { y: .88 }, { y: 1, duration: .14, ease: 'back.out(3)' }, quedaEm + .32)
          .call(() => som('tijolo', { i: k, ultimo: ult }), null, quedaEm + .32);
      }
      const num = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), new THREE.MeshStandardMaterial({ map: texNumero(i + 1, '#FFFFFF'), transparent: true, roughness: .3, polygonOffset: true, polygonOffsetFactor: -1 }));
      num.position.set(0, (L.tijolos - 1.5) * 1.2, 1.53); num.userData.proprio = true; num.visible = false; col.add(num);
      tl.set(num, { visible: true }, quando + L.tijolos * .09 + .3);
      const b = Bonecos.criar(avDe(pid)); b.scale.setScalar(1.35); b.position.set(L.x, L.tijolos * 1.2 + .5, 0); b.visible = false; cena.add(b);
      p.bonecos[pid] = b;
      const pousa = quando + L.tijolos * .09 + .55;
      cair(tl, b, pousa, b.position.y, { altura: 9 });
      tl.call(() => b.acao(avDe(pid).comemoracao || 'comemorar'), null, pousa + .5);
      if (i === 0) {
        if (!REDUZ) tl.fromTo(holofote, { intensity: 0 }, { intensity: 110, duration: 2.6, ease: 'power1.in' }, 3.9);
        else tl.set(holofote, { intensity: 110 }, quando);
        tl.call(() => { som('sucesso'); chuvaAtiva = chuva(cena, pids.slice(0, 3).map(x => equipe(x).cor).concat([AMARELO, '#FFFFFF']), { raio: 9, altura: 18 }); }, null, pousa + .4);
        for (let k = 0; k < 10; k++) tl.call(() => som('tique', { semitons: k }), null, 4.4 + k * .2 - k * k * .006);   // rufar crescendo
      }
    });
    // 4º a 6º: na mesa, aplaudindo ("também brilharam" é o HTML de quem chama)
    pids.slice(3).forEach((pid, k) => {
      // 4º em diante: dois lados, em colunas de duas fileiras (a de trás num pedestal mais alto)
      const trasF = Math.floor(k / 2) % 2, x = (k % 2 ? 1 : -1) * (7.6 + Math.floor(k / 4) * 2.6), z = -1.2 - trasF * 2.4;
      const ped = pedestal(pid, { raio: 1.05, altura: .5 + trasF * .7 }); ped.position.set(x, 0, z); cena.add(ped);
      contato(cena, x, z, 1.1, 1.1);
      const b = Bonecos.criar(avDe(pid)); b.scale.setScalar(1.2); b.position.set(x, ped.userData.topo, z); b.rotation.y = -Math.sign(x) * .3; b.visible = false; cena.add(b);
      p.bonecos[pid] = b;
      cair(tl, b, .3 + k * .15, b.position.y, { som: 'pop' });
      tl.call(() => b.acao('palmas', 0), null, 7.2);
    });
    tl.to({}, { duration: 1.2 }, 8.4);
    const meia = pids.length > 9 ? 13.6 : pids.length > 3 ? 10.5 : 6;
    p.caixa = new THREE.Box3(new THREE.Vector3(-meia, 0, -2), new THREE.Vector3(meia, 11, 2));
    p.tique = dt => chuvaAtiva?.tique(dt);
    p.limpar = () => chuvaAtiva?.parar();
    abrir(p);
    return fimTl(tl);
  }

  // ---------- Fim: bonecos em fila (comemorando na vitória; tristes no colapso, com o Globo Irado) ----------
  async function fim(vitoria, avatares = [], opcoes = {}) {
    const cena = new THREE.Scene(), camera = new THREE.PerspectiveCamera(26, 1, .5, 400), pc = P();
    const luz = luzes(cena, { raio: 14, centro: new THREE.Vector3(0, 2, 0), chave: vitoria ? 2.4 : 1.7 });
    if (!vitoria) { luz.hemi.color.set('#C9D2E8'); luz.recorte.intensity = .9; }
    chaoDeSombra(cena, 100, .22);
    const n = avatares.length, duas = n > 7, passo = duas ? 1.5 : 2.7, largura = Math.max(1, n) * passo + (duas ? 3.4 : 1.2);   // 13 delegações: duas fileiras intercaladas
    const palcoT = malha(pc.bloco(Math.round(largura), .4, 4), pc.plastico(vitoria ? CREME : '#D5DAE6', .32), cena, 0, 0, 0);
    palcoT.add(new THREE.Mesh(pc.casca(palcoT.geometry, .03), pc.tinta(TINTA)));
    contato(cena, 0, 0, largura / 2 + .4, 2.4);
    const p = { nome: 'fim', cena, camera, fundo: opcoes.fundo === undefined ? (vitoria ? 'raios' : 'colapso') : opcoes.fundo, el: opcoes.el,
      faixa: opcoes.faixa || [.1, .9], elev: 10, margem: .9, bonecos: {} };
    const tl = p.tl = gsap.timeline();
    let chuvaAtiva = null, globo = null;
    avatares.forEach((av, i) => {
      const b = Bonecos.criar(av); b.position.set((i - (n - 1) / 2) * passo, .6, duas && i % 2 ? -1.8 : .4); b.visible = false; cena.add(b);
      p.bonecos[av.pid] = b;
      cair(tl, b, .1 + i * .1, .6, { som: 'pop' });
      tl.call(() => (vitoria ? b.acao(av.comemoracao || 'comemorar') : b.acao('triste', 0)), null, .9 + i * (vitoria ? .14 : .08));
    });
    if (vitoria) tl.call(() => { chuvaAtiva = chuva(cena, Object.values(Bonecos.EQUIPES).map(x => x.cor).concat([AMARELO]), { raio: largura / 2 + 2 }); }, null, 1.2);
    if (typeof Mascote !== 'undefined' && Mascote.criar) {   // o Globo Irado acima da fila: comemora na vitória, sua frio no colapso
      globo = Mascote.criar(); globo.scale.setScalar(.16); globo.position.set(0, 6.3, -4.2); cena.add(globo);
      tl.call(() => (vitoria ? globo.reagir('comemorar') : globo.reagir('triste', { suor: true })), null, .8);
    }
    tl.to({}, { duration: .6 }, 1.6);
    p.caixa = new THREE.Box3(new THREE.Vector3(-largura / 2, 0, -2), new THREE.Vector3(largura / 2, globo ? 8.4 : 5.2, 2.4));
    p.tique = (dt, t) => { chuvaAtiva?.tique(dt); globo?.tique(dt, t); };
    p.limpar = () => chuvaAtiva?.parar();
    abrir(p);
    if (vitoria) { /* comemorações espalhadas de vez em quando */
      let prox = 4;
      const tq = p.tique;
      p.tique = (dt, t) => {
        tq(dt, t);
        if (REDUZ || t < prox) return;
        prox = t + 2.5;
        const bs = Object.values(p.bonecos); bs[Math.floor(Math.random() * bs.length)]?.acao('pular');
        if (Math.random() < .5) globo?.reagir('comemorar');
      };
    }
    return fimTl(tl);
  }

  // ---------- Foto oficial da cúpula: 2 fileiras sobre o pedestal, faixa com o título e a data ----------
  async function foto(avatares = [], titulo = 'CÚPULA 2050', { largura = 1600, altura = 900, data } = {}) {
    await fontesProntas();
    obterRenderer();
    const pc = P(), cena = new THREE.Scene(), camera = new THREE.PerspectiveCamera(24, largura / altura, .5, 400);
    luzes(cena, { raio: 12, centro: new THREE.Vector3(0, 3, 0) });
    chaoDeSombra(cena, 80, .22);
    const n = avatares.length, atras = avatares.slice(0, Math.ceil(n / 2)), frente = avatares.slice(Math.ceil(n / 2));
    const passoF = 3.3, larg = Math.max(atras.length, frente.length) * passoF + 2;
    const ALT = 3.6;   // arquibancada de 3 tijolos: a fileira de trás aparece inteira por cima da da frente
    const degrau = malha(pc.bloco(Math.round(larg), ALT, 2.2), pc.plastico(LADRILHO, .32), cena, 0, 0, -1.7);
    degrau.add(new THREE.Mesh(pc.casca(degrau.geometry, .03), pc.tinta(TINTA)));
    malha(pc.caixa(Math.round(larg) - .1, .5, .1, .04), pc.plastico(AMARELO, .28), cena, 0, ALT - .7, -.58);
    const piso = malha(pc.bloco(Math.round(larg) + 2, .4, 6), pc.plastico(CREME, .32), cena, 0, -.4, -.4);
    piso.add(new THREE.Mesh(pc.casca(piso.geometry, .03), pc.tinta(TINTA)));
    const POSES = ['acenar', 'comemorar', 'bracos-cruzados', 'apontar', 'palmas', 'acenar'];
    const pose = (b, i) => b.posar(POSES[i % POSES.length], POSE_T[POSES[i % POSES.length]], 'alegre');
    atras.forEach((av, i) => { const b = Bonecos.criar(av); b.scale.setScalar(1.15); b.position.set((i - (atras.length - 1) / 2) * passoF, ALT, -1.7); cena.add(b); pose(b, i); });
    frente.forEach((av, i) => { const b = Bonecos.criar(av); b.scale.setScalar(1.15); b.position.set((i - (frente.length - 1) / 2) * passoF, 0, 1); cena.add(b); pose(b, i + 3); });
    // faixa com cauda de andorinha (§4.5), impressa com o título e a data
    const quando = data || new Date().toLocaleDateString('pt-BR');
    const tex = impressao('foto' + titulo + quando, 1024, 256, (g, w, h) => {
      g.fillStyle = '#F0303A'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, h * .06, w, h * .07);
      letraBolha(g, titulo, w / 2, h * .46, h * .44);
      g.font = `900 ${h * .15}px Nunito, system-ui, sans-serif`; g.fillStyle = '#FFE8A8'; g.textAlign = 'center'; g.fillText(quando, w / 2, h * .84);
    });
    const faixa = new THREE.Group(); faixa.position.set(0, ALT + 6.6, -3.4); cena.add(faixa);
    const fw = Math.min(larg + 1, 12), fh = fw / 4;
    const corpo = malha(pc.caixa(fw, fh, .2, .06), [pc.plastico('#F0303A'), pc.plastico('#F0303A'), pc.plastico('#F0303A'), pc.plastico('#F0303A'),
      new THREE.MeshStandardMaterial({ map: tex, roughness: .32 }), pc.plastico('#F0303A')], faixa);
    corpo.add(new THREE.Mesh(pc.casca(corpo.geometry, .04), pc.tinta(TINTA)));
    [-1, 1].forEach(s => {
      const forma = new THREE.Shape(); const L = fh * .9;
      forma.moveTo(0, -fh * .42); forma.lineTo(L, -fh * .42); forma.lineTo(L * .72, 0); forma.lineTo(L, fh * .42); forma.lineTo(0, fh * .42);
      const cauda = malha(new THREE.ExtrudeGeometry(forma, { depth: .16, bevelEnabled: true, bevelSize: .03, bevelThickness: .03, bevelSegments: 2 }), pc.plastico('#A3141F', .32), faixa, s * (fw / 2 - .25), -fh * .18, -.35);
      cauda.scale.x = s; cauda.add(new THREE.Mesh(pc.casca(cauda.geometry, .03), pc.tinta(TINTA)));
    });
    [-1, 1].forEach(s => { malha(pc.cil(.12, .12, ALT + 6.6, 12), pc.plastico(CREME, .3), cena, s * (fw / 2 - .6), (ALT + 6.6) / 2, -3.6); malha(pc.esfera(.24, false, 16), pc.plastico(AMARELO, .28), cena, s * (fw / 2 - .6), ALT + 6.5, -3.6); });
    // câmera: tudo cabe com folga
    const caixa = new THREE.Box3(new THREE.Vector3(-larg / 2 - .5, -.4, -3.6), new THREE.Vector3(larg / 2 + .5, ALT + 6.6 + fh / 2 + .3, 2));
    const p = { camera, caixa, elev: 16, margem: .9, mira: new THREE.Vector3(0, 0, 0) };
    enquadrar(p, largura, altura);
    const cv = fotografar(cena, camera, largura, altura);
    const out = document.createElement('canvas'); out.width = largura; out.height = altura;
    const g = out.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, altura); gr.addColorStop(0, '#3550C8'); gr.addColorStop(.55, '#22339A'); gr.addColorStop(1, '#141F66');
    g.fillStyle = gr; g.fillRect(0, 0, largura, altura);
    const luzR = g.createRadialGradient(largura / 2, altura * .52, 0, largura / 2, altura * .52, altura * .9); luzR.addColorStop(0, 'rgba(255,255,255,.16)'); luzR.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = luzR; g.fillRect(0, 0, largura, altura);
    const passo = altura * .04;
    for (let y = passo / 2; y < altura; y += passo) for (let x = passo / 2; x < largura; x += passo) {
      g.fillStyle = 'rgba(0,0,0,.10)'; g.beginPath(); g.arc(x, y + 1, passo * .17, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.arc(x, y, passo * .13, 0, 7); g.fill();
    }
    g.drawImage(cv, 0, 0);
    const usados = []; cena.traverse(o => { if (o.name === 'boneco') usados.push(o); });
    descartarPalco({ cena, bonecos: { ...usados } });
    return out.toDataURL('image/png');
  }

  // ---------- Fora da tela do jeito do Mascote: palco num elemento qualquer ----------
  function renderizador() { return obterRenderer(); }

  return {
    lobby, focoLobby, previa, salaONU, votos, fala, revelacao, podio, fim, foto, retrato, esconder, pular, ancora,
    graficos, estudio, abrir, fechar, renderizador, luzes, chaoDeSombra,
    get ativa() { return palco?.nome || null; },
    get palco() { return palco; },
  };
})();
