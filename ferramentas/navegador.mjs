// Controla um Chrome headless (com WebGL por software) para testes automáticos e capturas de tela.
// Uso em outro script:
//   import { abrirJogo } from './ferramentas/navegador.mjs';
//   const nav = await abrirJogo({ largura: 1920, altura: 1080 });   // serve a pasta do projeto e abre o index.html
//   await nav.js('mostrarTela("lobby")');                            // avalia expressão (aceita Promise)
//   await nav.foto('/caminho/captura.png');                          // salva PNG
//   await nav.esperarPor('document.querySelector("[data-teste=comecar]")');  // espera a expressão ficar verdadeira
//   await nav.clicar('[data-teste=comecar]'); await nav.teclar('Escape'); await nav.digitar('Equipe Arara');
//   await nav.clicarEm(800, 450); await nav.mover(800, 450);         // clique/passar o mouse em coordenadas (mapa 3D)
//   console.log(nav.erros);                                          // erros do console e exceções
//   await nav.fechar();
// Opções de abrirJogo: { pagina, largura, altura, movimentoReduzido, arquivo: true (abre por file://, sem servidor) }
// Uso direto (captura rápida):  node ferramentas/navegador.mjs [pagina.html] [saida.png] [largura] [altura] [expressao-antes-da-foto]
import { createServer } from 'node:http';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';

const RAIZ = new URL('..', import.meta.url).pathname;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.wav': 'audio/wav', '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.json': 'application/json', '.glb': 'model/gltf-binary' };
const espera = ms => new Promise(r => setTimeout(r, ms));
// WebGL pela placa de vídeo (Metal): ~10× mais rápido que por software. GI_SOFTWARE=1 força o SwiftShader (máquina sem GPU).
const GPU = process.env.GI_SOFTWARE ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=metal'];

export async function abrirJogo({ pagina = 'index.html', largura = 1920, altura = 1080, movimentoReduzido = false, pasta = RAIZ, arquivo = false } = {}) {
  const servidor = createServer(async (req, res) => {
    try {
      const caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname.replace(/\/$/, '/index.html'));
      const corpo = await readFile(join(pasta, caminho));
      res.writeHead(200, { 'Content-Type': TIPOS[extname(caminho)] || 'application/octet-stream' }).end(corpo);
    } catch { res.writeHead(404).end(); }
  }).listen(0, '127.0.0.1');
  await new Promise(r => servidor.once('listening', r));
  const base = arquivo ? 'file://' + pasta.replace(/\/?$/, '/') : `http://127.0.0.1:${servidor.address().port}/`;
  const porta = 9300 + Math.floor(Math.random() * 600);
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${await mkdtemp(join(tmpdir(), 'gi-nav-'))}`,
    '--no-first-run', '--mute-audio', '--autoplay-policy=no-user-gesture-required', ...GPU,
    '--hide-scrollbars', `--window-size=${largura},${altura}`, 'about:blank'], { stdio: 'ignore' });
  let alvo;
  for (let i = 0; i < 100 && !alvo; i++) {
    await espera(150);
    try { alvo = (await (await fetch(`http://127.0.0.1:${porta}/json/list`)).json()).find(t => t.type === 'page'); } catch { /* abrindo */ }
  }
  if (!alvo) { chrome.kill(); servidor.close(); throw new Error('o Chrome não abriu'); }
  const ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise(r => (ws.onopen = r));
  let seq = 0;
  const pend = new Map(), erros = [], logs = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled') {
      const t = m.params.args.map(a => a.value ?? a.description).join(' ');
      (m.params.type === 'error' ? erros : logs).push(t);
    }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon/.test(m.params.entry.url || '')) erros.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
  };
  const cmd = (method, params = {}) => new Promise(r => { const id = ++seq; pend.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Log.enable');
  await cmd('Emulation.setDeviceMetricsOverride', { width: largura, height: altura, deviceScaleFactor: 1, mobile: false });
  if (movimentoReduzido) await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await cmd('Page.navigate', { url: base + pagina });
  await espera(1500);

  const nav = {
    base, erros, logs, cmd,
    async js(expr) {
      const r = await cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
      return r.result?.result?.value;
    },
    async foto(caminho, { clip } = {}) {
      const r = await cmd('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
      await writeFile(caminho, Buffer.from(r.result.data, 'base64'));
      return caminho;
    },
    async clicar(seletor) {
      const p = await nav.js(`(() => { const el = document.querySelector(${JSON.stringify(seletor)}); if (!el) return null; el.scrollIntoView({ block: 'nearest' }); const b = el.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; })()`);
      if (!p) return false;
      await nav.clicarEm(p.x, p.y);
      return true;
    },
    async clicarEm(x, y) {
      await cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      for (const type of ['mousePressed', 'mouseReleased']) await cmd('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    },
    mover: (x, y) => cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }),
    // Tecla especial ('Enter', 'Escape', 'Tab', 'ArrowRight', ' ') ou um caractere
    async teclar(tecla) {
      const especiais = { Enter: 13, Escape: 27, Tab: 9, ' ': 32, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Backspace: 8 };
      const codigo = especiais[tecla] ?? tecla.toUpperCase().charCodeAt(0);
      const base = { key: tecla, code: tecla.length === 1 ? 'Key' + tecla.toUpperCase() : tecla, windowsVirtualKeyCode: codigo };
      await cmd('Input.dispatchKeyEvent', { type: 'keyDown', ...base, ...(tecla === 'Enter' ? { text: '\r' } : tecla.length === 1 ? { text: tecla } : {}) });
      await cmd('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
    },
    digitar: texto => cmd('Input.insertText', { text: texto }),
    // Espera uma expressão JS ficar verdadeira (devolve o valor); falha com mensagem clara se o tempo acabar
    async esperarPor(expr, { tempo = 20000, passo = 200 } = {}) {
      const limite = Date.now() + tempo;
      for (;;) {
        const v = await nav.js(`(() => { try { return ${expr}; } catch { return null; } })()`).catch(() => null);
        if (v) return v;
        if (Date.now() > limite) throw new Error(`tempo esgotado esperando: ${expr}`);
        await espera(passo);
      }
    },
    espera,
    async ir(pag) { await cmd('Page.navigate', { url: base + pag }); await espera(1500); },
    async fechar() { try { ws.close(); } catch { /* já fechado */ } chrome.kill(); servidor.close(); },
  };
  return nav;
}

// Execução direta: captura rápida de uma página
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const [, , pagina = 'index.html', saida = '/tmp/captura.png', largura = '1920', altura = '1080', expr] = process.argv;
  const nav = await abrirJogo({ pagina, largura: +largura, altura: +altura });
  if (expr) console.log('resultado:', await nav.js(expr).catch(e => 'ERRO ' + e.message));
  await espera(1200);
  await nav.foto(saida);
  console.log('foto:', saida, nav.erros.length ? '\nerros:\n' + nav.erros.join('\n') : '(sem erros no console)');
  await nav.fechar();
}
