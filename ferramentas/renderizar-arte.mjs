// Kit de ilustração (guia de arte §4.2): fotografa os objetos de peças no estúdio da vitrine
// (ferramentas/vitrine-arte.html?render=<nomes>) no Chrome sem janela, grava img/arte/<nome>.webp (512 px, ≤ 25 KB),
// embute tudo em js/arte.js (bloco ARTE_IMG). A logo oficial é recortada por ferramentas/recortar-logo.mjs.
// Uso: node ferramentas/renderizar-arte.mjs [todos | nome,nome,…] [--sem-render]
import { abrirJogo } from './navegador.mjs';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, statSync } from 'node:fs';

const RAIZ = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2), lista = args.find(a => !a.startsWith('--')) || 'todos';
const PASTA = RAIZ + 'img/arte/';
mkdirSync(PASTA, { recursive: true });

// 1. Objetos 3D
if (!args.includes('--sem-render')) {
  const nav = await abrirJogo({ pagina: `ferramentas/vitrine-arte.html?render=${encodeURIComponent(lista)}`, largura: 640, altura: 640 });
  try {
    await nav.esperarPor('window.pronto === true', { tempo: 1800000, passo: 1000 });
    const falhas = await nav.js('window.falhas || {}');
    for (const [n, e] of Object.entries(falhas)) console.log(`FALHOU ${n}: ${e.split('\n').slice(0, 3).join(' ')}`);
    const nomes = await nav.js('Object.keys(window.resultados || {})');
    for (const n of nomes) {
      const { url, q, kb } = await nav.js(`window.resultados[${JSON.stringify(n)}]`);
      writeFileSync(PASTA + n + '.webp', Buffer.from(url.split(',')[1], 'base64'));
      console.log(`${n}.webp  ${kb} KB  (qualidade ${q})`);
    }
  } finally {
    if (nav.erros.length) console.log('erros no console:', nav.erros.slice(0, 8).join(' | '));
    await nav.fechar();
  }
}

// 2. Embute em js/arte.js, na ordem de ARTE (os nomes sem render continuam com o ícone provisório)
const ARQ = RAIZ + 'js/arte.js', fonte = readFileSync(ARQ, 'utf8');
const ordem = [...fonte.matchAll(/^  '([a-z0-9-]+)': '[^']*',$/gm)].map(m => m[1]);
const feitos = readdirSync(PASTA).filter(f => f.endsWith('.webp')).map(f => f.slice(0, -5))
  .sort((a, b) => (ordem.indexOf(a) + 1 || 999) - (ordem.indexOf(b) + 1 || 999));
const linhas = feitos.map(n => `  '${n}': 'data:image/webp;base64,${readFileSync(PASTA + n + '.webp').toString('base64')}',`).join('\n');
const ini = fonte.indexOf('// ARTE_IMG:INICIO'), fim = fonte.indexOf('// ARTE_IMG:FIM');
writeFileSync(ARQ, fonte.slice(0, ini) + `// ARTE_IMG:INICIO\nconst ARTE_IMG = {\n${linhas}\n};\n` + fonte.slice(fim));
const total = feitos.reduce((s, n) => s + statSync(PASTA + n + '.webp').size, 0);
const faltam = ordem.filter(n => !feitos.includes(n));
console.log(`js/arte.js: ${feitos.length} objetos embutidos (${(total / 1024).toFixed(0)} KB em WebP; orçamento do kit: 1.536 KB)` +
  (faltam.length ? `\nainda provisórios: ${faltam.join(', ')}` : ''));

// (O logotipo não sai mais daqui: a logo oficial e os img/logo*.svg saem de ferramentas/recortar-logo.mjs.)
