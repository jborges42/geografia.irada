// Destrincha a logo oficial (img/logo.webp, enviada pelo cliente) nos recortes de img/marca/:
//   logo-1024|512|256 (.webp + .png para impressão) · emblema-512|256 (globo com a mão, quadrado) ·
//   palavra-1024|512 (letreiro GEOGRAFIA IRADA com a base) · favicon-32|180|512.png · e os SVGs de compatibilidade
//   img/logo.svg, logo-claro.svg, logo-mono.svg, logo-globo.svg, favicon.svg (a arte oficial embutida em data URI:
//   SVG aberto como <img> não carrega arquivo externo) e img/favicon.png.
// Uso: node ferramentas/recortar-logo.mjs [--previa pasta]   (precisa do Chrome e do cwebp)
// O que o recorte faz com a arte (e só isto): (1) a sombra de contato cinza-clara, sobra do fundo branco, vira sombra
// azul-marinho que dá o mesmo tom sobre o branco; (2) no emblema, completa a parte de baixo do globo que a base das
// letras esconde (anel verde, linha branca e oceano, varrendo o perfil real do próprio globo); a mão termina no punho;
// (3) na palavra, refaz a borda azul-marinho da base onde a faixa verde do punho e o globo a cobriam.
import { abrirJogo } from './navegador.mjs';
import { writeFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const RAIZ = new URL('..', import.meta.url).pathname, SAIDA = RAIZ + 'img/marca/';
const previa = process.argv.includes('--previa') ? process.argv[process.argv.indexOf('--previa') + 1] : null;

// Roda dentro do Chrome (canvas). Devolve { nome: dataURL PNG }.
async function noNavegador() {
  const im = new Image(); im.src = 'logo.webp'; await im.decode();
  const W = im.naturalWidth, H = im.naturalHeight;
  const tela = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
  const c0 = tela(W, H), g0 = c0.getContext('2d', { willReadFrequently: true }); g0.drawImage(im, 0, 0);
  const img = g0.getImageData(0, 0, W, H), d = img.data, at = (x, y) => (y * W + x) * 4;
  const lim = (v, a, b) => Math.min(b, Math.max(a, v));
  const liso = t => t * t * (3 - 2 * t);

  // ---------- 1. Sombra de contato: cinza-claro → azul-marinho com o mesmo tom sobre o branco ----------
  const SOMBRA = [11, 26, 61];
  for (let y = 780; y < H; y++) for (let x = 0; x < W; x++) {
    const i = at(x, y), a = d[i + 3], r = d[i], g = d[i + 1], b = d[i + 2];
    if (!a || Math.abs(r - g) > 18 || Math.abs(g - b) > 22) continue;
    const l = (r + g + b) / 3; if (l < 60) continue;
    d[i + 3] = Math.round(a * (255 - l) / (255 - 33)); d[i] = SOMBRA[0]; d[i + 1] = SOMBRA[1]; d[i + 2] = SOMBRA[2];
  }
  g0.putImageData(img, 0, 0);
  const px = (x, y) => { x = lim(Math.round(x), 0, W - 1); y = lim(Math.round(y), 0, H - 1); const i = at(x, y); return [d[i], d[i + 1], d[i + 2], d[i + 3]]; };

  // ---------- 2. Palavra: tudo o que está acima da borda de cima da base das letras some ----------
  // A borda da base = topo das letras brancas de GEOGRAFIA dilatado por um disco de 13 px (a espessura da borda medida
  // onde ela encosta no transparente); onde há vão transparente acima da base, vale a borda real.
  const branco = (x, y) => { const [r, g, b, a] = px(x, y); return a > 200 && r > 190 && g > 190 && b > 190; };
  const topoLetra = new Array(W).fill(Infinity);
  for (let x = 0; x < W; x++) for (let y = 540; y < 680; y++) if (branco(x, y) && branco(x, y + 8) && branco(x, y + 14)) { topoLetra[x] = y; break; }   // traço grosso: a linha branca do anel do globo não conta
  const BORDA = 13, topoBase = new Array(W), bordaReal = [];
  for (let x = 0; x < W; x++) {
    let t = Infinity;
    for (let dx = -BORDA; dx <= BORDA; dx++) { const tl = topoLetra[x + dx]; if (tl !== undefined) t = Math.min(t, tl - Math.sqrt(BORDA * BORDA - dx * dx)); }
    let real = -1;   // borda real: primeiro pixel opaco depois de um vão transparente (entre y 520 e as letras)
    for (let y = 524; y < Math.min(H, (isFinite(t) ? t : 700) + 4); y++) if (px(x, y)[3] > 128 && px(x, y - 5)[3] < 40) { real = y; break; }
    topoBase[x] = real >= 0 ? real : t; if (real >= 0) bordaReal[x] = true;
  }
  const navy = k => [[72, 105, 136], [89, 123, 164], [65, 90, 130], [33, 67, 106]][k] || [lim(33 - k * .9, 22, 33), lim(67 - k * 1.3, 56, 67), lim(106 - k * 1.7, 92, 106)];
  const pal = tela(W, H), gp = pal.getContext('2d'); gp.drawImage(c0, 0, 0);
  const pd = gp.getImageData(0, 0, W, H), p = pd.data;
  for (let x = 0; x < W; x++) {
    const t = topoBase[x]; if (!isFinite(t)) continue;
    const t0 = Math.floor(t);
    for (let y = 0; y < Math.min(H, t0); y++) p[at(x, y) + 3] = 0;
    if (bordaReal[x]) continue;
    for (let k = 0; k <= BORDA; k++) {   // repinta a borda onde ela não é base azul-marinho (oceano, faixa verde, contorno preto)
      const y = t0 + k, i = at(x, y), r = p[i], g = p[i + 1], b = p[i + 2];
      const ehBase = p[i + 3] > 200 && r >= 8 && r <= 95 && b - r >= 22 && b - r <= 95 && b >= 60 && g >= 40;
      if (k > 0 && (ehBase || branco(x, y))) continue;
      const [nr, ng, nb] = navy(k); p[i] = nr; p[i + 1] = ng; p[i + 2] = nb; p[i + 3] = k === 0 ? Math.round(255 * (1 - (t - t0))) : 255;
    }
  }
  gp.putImageData(pd, 0, 0);

  // ---------- 3. Emblema: globo + mão, com a parte de baixo do globo completada ----------
  // Medidas do globo (px da arte original): centro (426, 315); raio do corpo 297 até o contorno; o anel verde tem
  // ~60 px no lado de baixo à esquerda, afina por cima e some à direita. Escondido pela base: θ de ~40° a ~147°.
  const C = [426, 315], RB = 297, CORTE = 512;
  const larguraAnel = th => th >= 48 ? 60 * Math.pow(lim((th - 48) / (135 - 48), 0, 1), .6) : 0;   // 60 px até 135°, some em 48°
  // oceano logo acima do corte, por coluna (só pixels de oceano; embaixo da mão, interpolado; suavizado ±8 px):
  // o fundo do globo continua o mar que já está lá, sem emenda
  const oceano = (r, g, b) => b > r + 40 && b > g + 15 && !(r > 190 && g > 190);
  let mar = new Array(W).fill(null);
  for (let x = 0; x < W; x++) {
    const s = [0, 0, 0]; let n = 0;
    for (let y = CORTE - 12; y < CORTE - 4; y++) { const q = px(x, y); if (q[3] > 250 && oceano(q[0], q[1], q[2])) { s[0] += q[0]; s[1] += q[1]; s[2] += q[2]; n++; } }
    if (n >= 4) mar[x] = s.map(v => v / n);
  }
  const comMar = mar.map((v, x) => v ? x : -1).filter(x => x >= 0);
  for (let k = 0; k + 1 < comMar.length; k++) for (let x = comMar[k] + 1; x < comMar[k + 1]; x++) { const t = (x - comMar[k]) / (comMar[k + 1] - comMar[k]); mar[x] = mar[comMar[k]].map((v, j) => v + (mar[comMar[k + 1]][j] - v) * t); }
  for (let x = 0; x < W; x++) mar[x] ??= mar[x < comMar[0] ? comMar[0] : comMar[comMar.length - 1]];
  mar = mar.map((_, x) => { const s = [0, 0, 0]; let n = 0; for (let k = -8; k <= 8; k++) { const v = mar[lim(x + k, 0, W - 1)]; s[0] += v[0]; s[1] += v[1]; s[2] += v[2]; n++; } return s.map(v => v / n); });
  const faixaVerde = (r, g, b) => g > 100 && g > r + 12 && b < 90;
  // onde a mão termina: fundo da faixa verde do punho (+ contorno), por coluna
  const fimMao = new Array(W).fill(CORTE);
  for (let x = 322; x <= 500; x++) {
    let fundo = -1;
    for (let y = 498; y < 560; y++) { const [r, g, b] = px(x, y); if (faixaVerde(r, g, b)) fundo = y; }
    if (fundo > CORTE) { let y = fundo + 1; while (y < fundo + 7 && !branco(x, y) && px(x, y)[0] + px(x, y)[1] + px(x, y)[2] < 200) y++; fimMao[x] = Math.min(y, topoLetra[x] - 1); }
  }
  const amostra = (th, r) => { const a = th * Math.PI / 180; return px(C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r); };
  const em = tela(W, 700), ge = em.getContext('2d'), ed = ge.createImageData(W, 700), e = ed.data;
  for (let y = 0; y < 700; y++) for (let x = 0; x < W; x++) {
    const o = at(x, y);
    // original acima do corte (com 12 px de transição), mão inteira até o punho
    const lim0 = fimMao[x], orig = y < lim0 ? 1 : 0, mistura = lim0 === CORTE ? lim((CORTE - y) / 12, 0, 1) : orig;
    let rec = null;
    if (y > CORTE - 14) {
      const dx = x - C[0], dy = y - C[1], rho = Math.hypot(dx, dy), th = Math.atan2(dy, dx) * 180 / Math.PI;
      if (th > 30 && th < 165) {
        const w = larguraAnel(th), fora = RB + w;
        if (rho <= fora + 1.5) {
          // anel e borda: o perfil real a 145° (com a largura do verde ajustada); sem anel, a borda a 40°;
          // dentro do corpo, o oceano escuro da mesma borda a 40° (lá não há continente)
          const fundo = 1 - .1 * lim((y - CORTE) / 100, 0, 1), dentro = [...mar[x].map(v => v * fundo), 255];
          const borda = rho <= RB + 1.5 ? amostra(40, Math.max(rho, RB - 52)) : [0, 0, 0, 0], tb = liso(lim((rho - (RB - 45)) / 25, 0, 1));
          const dir = dentro.map((v, k) => v * (1 - tb) + borda[k] * tb);
          let cor = dir, t = 0;
          if (w > 6 && rho >= RB - 30) {
            const rs = rho <= RB + 6 ? rho : RB + 6 + (rho - RB - 6) * (60 - 6) / (w - 6), esq = amostra(145, Math.min(rs, 357));
            t = liso(lim((th - 48) / 30, 0, 1));   // linha branca e vão escuro somem junto com o anel, devagar
            cor = esq.map((v, k) => v * t + dir[k] * (1 - t));
          }
          const sombra = 1 - .12 * lim((147 - th) / 100, 0, 1) * t;   // a luz vem de cima à esquerda: o anel escurece embaixo
          rec = [cor[0] * sombra, cor[1] * sombra, cor[2] * sombra, cor[3] * lim(fora + 1.5 - rho, 0, 1)];
        }
      }
    }
    const src = px(x, y), m = rec ? mistura : (y < CORTE ? 1 : mistura);
    const A = src[3] * m, B = rec ? rec[3] * (1 - m) : 0, a = A + B;
    if (a <= 0) continue;
    for (let k = 0; k < 3; k++) e[o + k] = ((src[k] * A) + (rec ? rec[k] * B : 0)) / a;
    e[o + 3] = Math.min(255, a);
  }
  ge.putImageData(ed, 0, 0);

  // ---------- Saída ----------
  const caixa = (c, limiar = 6) => {   // retângulo do que é visível
    const g = c.getContext('2d'), { data } = g.getImageData(0, 0, c.width, c.height);
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (data[(y * c.width + x) * 4 + 3] > limiar) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
  };
  const recorte = (c, [x, y, w, h], quadrado = false, margem = 0) => {
    const L = quadrado ? Math.max(w, h) + 2 * margem : 0, cw = quadrado ? L : w + 2 * margem, ch = quadrado ? L : h + 2 * margem;
    const s = tela(cw, ch); s.getContext('2d').drawImage(c, x, y, w, h, Math.round((cw - w) / 2), Math.round((ch - h) / 2), w, h); return s;
  };
  // redução em degraus de metade (sem serrilhado) e ampliação bicúbica
  const escala = (c, largura, fundo = null, ocupar = 1) => {
    let s = c;
    while (s.width / 2 >= largura / ocupar) { const t = tela(Math.round(s.width / 2), Math.round(s.height / 2)), g = t.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(s, 0, 0, t.width, t.height); s = t; }
    const alt = Math.round(c.height * largura / c.width), t = tela(largura, alt), g = t.getContext('2d');
    if (fundo) { g.fillStyle = fundo; g.fillRect(0, 0, largura, alt); }
    g.imageSmoothingQuality = 'high';
    const w = largura * ocupar, h = alt * ocupar; g.drawImage(s, (largura - w) / 2, (alt - h) / 2, w, h);
    return t;
  };
  const completa = recorte(c0, caixa(c0), false, 2);
  const palavra = recorte(pal, caixa(pal), false, 2);
  const emblema = recorte(em, caixa(em), true, 4);
  const sai = {};
  for (const L of [1024, 512, 256]) sai[`logo-${L}.png`] = escala(completa, L).toDataURL('image/png');
  for (const L of [512, 256]) sai[`emblema-${L}.png`] = escala(emblema, L).toDataURL('image/png');
  for (const L of [1024, 512]) sai[`palavra-${L}.png`] = escala(palavra, L).toDataURL('image/png');
  sai['favicon-512.png'] = escala(emblema, 512).toDataURL('image/png');
  sai['favicon-32.png'] = escala(emblema, 32).toDataURL('image/png');
  sai['favicon-64.png'] = escala(emblema, 64).toDataURL('image/png');
  sai['favicon-180.png'] = escala(emblema, 180, '#22339A', .86).toDataURL('image/png');   // ícone de toque: fundo da mesa anil
  sai.medidas = JSON.stringify({ completa: [completa.width, completa.height], palavra: [palavra.width, palavra.height], emblema: [emblema.width, emblema.height] });
  return sai;
}

const nav = await abrirJogo({ pagina: 'img/logo.webp', largura: 400, altura: 300 });
const sai = await nav.js(`(${noNavegador})()`);
await nav.fechar();
if (nav.erros.length) throw new Error(nav.erros.join('\n'));
mkdirSync(SAIDA, { recursive: true });
const destino = previa || SAIDA;
mkdirSync(destino, { recursive: true });
const medidas = JSON.parse(sai.medidas); delete sai.medidas;
for (const [nome, url] of Object.entries(sai)) {
  if (nome === 'favicon-64.png') { writeFileSync((previa ? destino : RAIZ + 'img/') + (previa ? nome : 'favicon.png'), Buffer.from(url.split(',')[1], 'base64')); continue; }
  const png = destino + nome;
  writeFileSync(png, Buffer.from(url.split(',')[1], 'base64'));
  if (!nome.startsWith('favicon')) execFileSync('cwebp', ['-quiet', '-q', '92', '-alpha_q', '100', '-m', '6', '-sharp_yuv', '-metadata', 'none', png, '-o', png.replace(/\.png$/, '.webp')]);
}
// SVGs de compatibilidade: tudo o que apontava para a logo antiga passa a mostrar a oficial
if (!previa) {
  const dados = f => 'data:image/webp;base64,' + readFileSync(SAIDA + f).toString('base64');
  const svg = (arquivo, [w, h], titulo) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${titulo}">` +
    `<title>${titulo}</title><image href="${dados(arquivo)}" width="${w}" height="${h}"/></svg>\n`;
  const [cw, ch] = medidas.completa, completa = [1024, Math.round(ch * 1024 / cw)];
  const logo = svg('logo-1024.webp', completa, 'Geografia Irada');
  for (const f of ['logo.svg', 'logo-claro.svg', 'logo-mono.svg']) writeFileSync(RAIZ + 'img/' + f, logo);
  writeFileSync(RAIZ + 'img/logo-globo.svg', svg('emblema-512.webp', [512, 512], 'Geografia Irada'));
  writeFileSync(RAIZ + 'img/favicon.svg', svg('emblema-256.webp', [256, 256], 'Geografia Irada'));
}
console.log('medidas da arte (px):', JSON.stringify(medidas));
console.log(Object.keys(sai).filter(n => n !== 'favicon-64.png').map(n => { const f = destino + n; return `${n} ${(statSync(f).size / 1024).toFixed(0)} KB`; }).join(' · '));
