// Sonda de desempenho injetada antes da página por `node teste.mjs --medir` (não vai para o jogo).
// Guarda o instante de cada quadro, as tarefas longas, as trocas de fase do HUD e conta timers e listeners globais.
(() => {
  const ativos = { intervalos: new Set(), globais: 0 };
  const sI = setInterval, cI = clearInterval, sT = setTimeout;
  window.setInterval = function (f, ms, ...a) { const id = sI.call(this, f, ms, ...a); ativos.intervalos.add(id); return id; };
  window.clearInterval = function (id) { ativos.intervalos.delete(id); return cI.call(this, id); };
  const aE = EventTarget.prototype.addEventListener, rE = EventTarget.prototype.removeEventListener;
  const global = t => t === window || t === document;   // listeners que não morrem com o elemento
  EventTarget.prototype.addEventListener = function (...a) { if (global(this) && !(a[2] && a[2].once)) ativos.globais++; return aE.apply(this, a); };
  EventTarget.prototype.removeEventListener = function (...a) { if (global(this)) ativos.globais--; return rE.apply(this, a); };
  window.__ativos = ativos;
  // tarefas longas e quadros
  window.__lt = [];
  try { new PerformanceObserver(l => l.getEntries().forEach(e => __lt.push([e.startTime, e.duration]))).observe({ type: 'longtask', buffered: true }); } catch { }
  // quadros longos (> 150 ms) com os scripts que pesaram (Long Animation Frames, Chrome 123+): quem causa cada travada
  window.__loaf = [];
  try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (e.duration > 150) __loaf.push({ t: e.startTime, dur: Math.round(e.duration), estilo: Math.round(e.styleAndLayoutDuration),
    scripts: e.scripts.map(x => ({ dur: Math.round(x.duration), quem: `${x.invoker} ${x.sourceFunctionName || ''} ${(x.sourceURL || '').split('/').pop()}:${x.sourceCharPosition}`, forcado: Math.round(x.forcedStyleAndLayoutDuration) })) }); }))
    .observe({ type: 'long-animation-frame', buffered: true }); } catch { }
  window.__q = []; (function f(t) { __q.push(t); requestAnimationFrame(f); })(performance.now());
  // trocas de fase do HUD (plantao, cena, dilema, decisoes, computador, balanco…) e de tela
  window.__fases = [];
  new MutationObserver(ms => ms.forEach(m => {
    const v = m.target.getAttribute(m.attributeName);
    if (v) __fases.push([performance.now(), (m.attributeName === 'data-tela' ? 'tela:' : '') + v]);
  })).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-fase', 'data-tela'] });

  // Resumo desde a marca anterior: FPS, quadros lentos, maior quadro, tarefas longas e travada de entrada de cada fase
  // (maior quadro nos 2 s depois de entrar nela)
  let marca = 0;
  window.__resumo = () => {
    const t0 = marca, t1 = performance.now(); marca = t1;
    const q = __q.filter(t => t >= t0), d = []; for (let i = 1; i < q.length; i++) d.push(q[i] - q[i - 1]);
    const s = [...d].sort((a, b) => a - b), dur = (q[q.length - 1] - q[0]) / 1000 || 1;
    const lt = __lt.filter(([t]) => t >= t0).map(x => x[1]);
    const entradas = {};
    for (const [t, f] of __fases.filter(([t]) => t >= t0)) {
      let maior = 0; for (let i = 1; i < __q.length; i++) if (__q[i] > t && __q[i - 1] < t + 2000) maior = Math.max(maior, __q[i] - Math.max(__q[i - 1], t));
      entradas[f] = Math.max(entradas[f] || 0, Math.round(maior));
    }
    __q.splice(0, Math.max(0, __q.length - 2));   // sem crescer sem limite numa partida longa
    return { fpsMandato: +(d.length / dur).toFixed(1), p95Mandato: +(s[Math.floor(s.length * .95)] || 0).toFixed(1),
      pctLentos: +(100 * d.filter(x => x > 50).length / Math.max(1, d.length)).toFixed(1), maiorQuadro: Math.round(s[s.length - 1] || 0),
      tarefasLongas: lt.length, maiorTarefa: Math.round(Math.max(0, ...lt)), tarefas200: lt.filter(x => x > 200).length, entradas,
      quadrosLongos: __loaf.filter(x => x.t >= t0).sort((a, b) => b.dur - a.dur).slice(0, 8)
        .map(x => ({ fase: (__fases.filter(([t]) => t <= x.t).pop() || [])[1], ...x })) };
  };
  // FPS da página parada numa janela de ms
  window.__fps = async (ms = 3000) => {
    const q0 = __q.length; await new Promise(ok => sT(ok, ms));
    const q = __q.slice(q0), d = []; for (let i = 1; i < q.length; i++) d.push(q[i] - q[i - 1]);
    const s = [...d].sort((a, b) => a - b);
    return { fps: +(d.length / (q[q.length - 1] - q[0]) * 1000).toFixed(1), p95: +(s[Math.floor(s.length * .95)] || 0).toFixed(1) };
  };
  // Draw calls e triângulos por segundo de um renderizador; CPU por quadro desenhado do laço do mapa
  window.__info = async (r, ms = 2000) => {
    r.info.autoReset = false; r.info.reset(); const f0 = r.info.render.frame;
    const a = performance.now(); await new Promise(ok => sT(ok, ms)); const seg = (performance.now() - a) / 1000;
    const out = { callsSeg: Math.round(r.info.render.calls / seg), trisSegM: +(r.info.render.triangles / seg / 1e6).toFixed(1), quadros: Math.round((r.info.render.frame - f0) / seg) };
    r.info.autoReset = true; return out;
  };
  window.__cpuMapa = async (ms = 2000) => {
    const r = Mapa3D.renderer, orig = r.setAnimationLoop.bind(r), cpu = [];
    const religar = () => { Mapa3D.pausar(true); Mapa3D.pausar(false); };
    r.setAnimationLoop = fn => orig(fn && (x => { const f0 = r.info.render.frame, a = performance.now(); fn(x); if (r.info.render.frame !== f0) cpu.push(performance.now() - a); }));
    religar(); await new Promise(ok => sT(ok, ms)); r.setAnimationLoop = orig; religar();
    const l = cpu.slice(2); return l.length ? +(l.reduce((a, b) => a + b, 0) / l.length).toFixed(2) : null;
  };
})();
