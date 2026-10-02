// Gera ../dados/mapa.js: o mapa-múndi em "pinos" (projeção de Robinson), com o território de cada pino.
// Fonte: Natural Earth 1:50m (domínio público), via pacote world-atlas.
// Uso:  cd ferramentas && npm i && node gerar-mapa.mjs
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const topo = require('topojson-client');
const { geoContains, geoBounds, geoArea, geoCentroid } = require('d3-geo');
const { geoRobinson } = require('d3-geo-projection');

// Território → países (código ISO numérico do Natural Earth, ou o nome quando o país não tem código).
// A ordem define o índice de cada território em dados/mapa.js; os textos e números ficam em conteudo/territorios.js.
const TERRITORIOS = {
  canada: [124, 666],
  eua: [840, 630, 850, 16, 316, 580],
  mexico: [484],
  america_central: [320, 84, 340, 222, 558, 188, 591],
  caribe: [192, 332, 214, 388, 44, 780, 52, 28, 212, 308, 662, 659, 670, 531, 533, 60, 136, 92, 796, 660, 500, 534, 652, 663],
  brasil: [76],
  andes: [170, 218, 604, 68],
  venezuela_guianas: [862, 328, 740],
  cone_sul: [32, 152, 858, 600],
  ue: [40, 56, 100, 191, 196, 203, 208, 233, 246, 250, 276, 300, 348, 372, 380, 428, 440, 442, 470, 528, 616, 620, 642, 703, 705, 724, 752, 248, 'N. Cyprus', 20, 492, 674, 336],
  reino_unido: [826, 578, 352, 756, 438, 234, 831, 832, 833, 238, 654, 239],
  balcas: [688, 70, 499, 807, 8, 'Kosovo'],
  leste_europeu: [804, 112, 498],
  russia: [643],
  turquia: [792, 268, 51, 31],
  norte_africa: [504, 732, 12, 788, 434, 818],
  sahel: [478, 466, 854, 562, 148],
  africa_ocidental: [566, 288, 384, 686, 270, 624, 324, 694, 430, 768, 204, 132],
  africa_central: [180, 178, 140, 120, 266, 226, 678],
  africa_oriental: [231, 232, 262, 706, 'Somaliland', 404, 800, 834, 646, 108, 729, 728, 174, 690],
  africa_austral: [24, 516, 72, 716, 894, 508, 454, 450, 480, 86],
  africa_do_sul: [710, 426, 748],
  golfo: [682, 784, 634, 414, 48, 512, 887],
  levante: [376, 275, 422, 760, 400, 368],
  ira: [364],
  asia_central: [398, 860, 795, 417, 762, 496],
  afeg_paquistao: [4, 586],
  india: [356, 'Siachen Glacier'],
  sul_asia: [50, 524, 64, 144, 462],
  china: [156, 344, 446],
  taiwan: [158],
  japao_coreia: [392, 410],
  coreia_norte: [408],
  sudeste_continental: [104, 764, 418, 116, 704],
  sudeste_insular: [360, 458, 608, 702, 96, 626],
  australia: [36, 554, 574, 'Indian Ocean Ter.'],
  pacifico: [598, 90, 548, 242, 540, 258, 882, 776, 296, 583, 584, 585, 520, 798, 184, 570, 876, 612],
  groenlandia: [304],
  antartida: [10, 260, 334],
};

const COLUNAS = 200, LAT_NORTE = 84, LAT_SUL = -72;
const MINIMO = 8;   // territórios pequenos (ilhas, Taiwan, Coreia do Norte) ganham pinos no mar em volta até ter isso
const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // índice do território em cada pino
const FORA = '.', MAR = '~';

const ids = Object.keys(TERRITORIOS);
if (ids.length > ALFABETO.length) throw new Error('territórios demais para o alfabeto');
const mundo = require('world-atlas/countries-50m.json');
const paises = topo.feature(mundo, mundo.objects.countries).features;
const dono = paises.map(f => ids.findIndex(t => TERRITORIOS[t].includes(f.id ? +f.id : f.properties.name)));
const semDono = paises.filter((f, i) => dono[i] < 0).map(f => f.properties.name);
if (semDono.length) console.warn('Países sem território (ficam como mar):', semDono.join(', '));
const caixas = paises.map(f => geoBounds(f));

// Grade na projeção de Robinson "crua" (x para a direita, y para o norte), a mesma que o jogo usa em mapa3d.js
const proj = geoRobinson().scale(1).translate([0, 0]);
const cru = (lon, lat) => { const [x, y] = proj([lon, lat]); return [x, -y]; };
const X0 = cru(-180, 0)[0], CEL = (cru(180, 0)[0] - X0) / COLUNAS;
const Y0 = cru(0, LAT_NORTE)[1], LINHAS = Math.round((Y0 - cru(0, LAT_SUL)[1]) / CEL);

function paisEm(lon, lat) {
  for (let i = 0; i < paises.length; i++) {
    const [[a, b], [c, d]] = caixas[i];
    const naFaixa = a <= c ? lon >= a && lon <= c : lon >= a || lon <= c;
    if (naFaixa && lat >= b && lat <= d && geoContains(paises[i], [lon, lat])) return i;
  }
  return -1;
}

const grade = new Int16Array(COLUNAS * LINHAS).fill(-2); // -2 fora do mapa, -1 mar, ≥0 território
for (let r = 0; r < LINHAS; r++) for (let c = 0; c < COLUNAS; c++) {
  const x = X0 + (c + .5) * CEL, y = Y0 - (r + .5) * CEL;
  const ll = proj.invert([x, -y]);
  if (!ll || !isFinite(ll[0]) || Math.abs(ll[0]) > 180) continue;
  const [vx, vy] = cru(...ll);
  if (Math.hypot(vx - x, vy - y) > CEL * .01) continue; // fora do contorno da projeção
  const p = paisEm(...ll);
  grade[r * COLUNAS + c] = p < 0 ? -1 : dono[p];
}

const vizinhas = k => {
  const c = k % COLUNAS, r = (k - c) / COLUNAS, v = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const rr = r + dr, cc = (c + dc + COLUNAS) % COLUNAS; // o mapa dá a volta no antimeridiano
    if (rr >= 0 && rr < LINHAS) v.push(rr * COLUNAS + cc);
  }
  return v;
};

// Território pequeno cresce para o mar em volta (exagero proposital, como nos mapas de jogo)
ids.forEach((_, t) => {
  let celulas = [];
  grade.forEach((g, k) => g === t && celulas.push(k));
  if (!celulas.length) {
    // nem um pino caiu dentro: semeia no pino do centro do maior país do território
    const f = paises.filter((_, i) => dono[i] === t).sort((a, b) => geoArea(b) - geoArea(a))[0];
    const [x, y] = cru(...geoCentroid(f));
    const alvo = Math.floor((Y0 - y) / CEL) * COLUNAS + Math.floor((x - X0) / CEL);
    if (grade[alvo] === -1) { grade[alvo] = t; celulas = [alvo]; }
    else console.warn('não deu para semear', ids[t]);
  }
  for (let i = 0; celulas.length < MINIMO && i < celulas.length; i++) {
    for (const v of vizinhas(celulas[i])) if (grade[v] === -1 && celulas.length < MINIMO) { grade[v] = t; celulas.push(v); }
  }
});

// Âncora = pino mais "de dentro" do território (onde fica o marcador 3D); vizinhos = territórios que se tocam
const ancoras = {}, vizinhos = {}, contagem = {};
ids.forEach((id, t) => {
  const dist = new Map(), fila = [];
  grade.forEach((g, k) => { if (g === t && vizinhas(k).some(v => grade[v] !== t)) { dist.set(k, 0); fila.push(k); } });
  for (let i = 0; i < fila.length; i++) for (const v of vizinhas(fila[i])) {
    if (grade[v] === t && !dist.has(v)) { dist.set(v, dist.get(fila[i]) + 1); fila.push(v); }
  }
  let melhor = fila[0];
  dist.forEach((d, k) => { if (d > dist.get(melhor)) melhor = k; });
  ancoras[id] = [melhor % COLUNAS, Math.floor(melhor / COLUNAS)];
  contagem[id] = fila.length;
  const toca = new Set();
  grade.forEach((g, k) => { if (g === t) for (const v of vizinhas(k)) if (grade[v] >= 0 && grade[v] !== t) toca.add(ids[grade[v]]); });
  vizinhos[id] = [...toca];
});

const celulas = Array.from(grade, g => (g === -2 ? FORA : g === -1 ? MAR : ALFABETO[g])).join('');
const MAPA = { colunas: COLUNAS, linhas: LINHAS, x0: +X0.toFixed(6), y0: +Y0.toFixed(6), cel: +CEL.toFixed(6),
  latNorte: LAT_NORTE, latSul: LAT_SUL, alfabeto: ALFABETO, territorios: ids, ancoras, vizinhos, celulas };
writeFileSync(new URL('../dados/mapa.js', import.meta.url),
  `// Gerado por ferramentas/gerar-mapa.mjs a partir do Natural Earth 1:50m (domínio público). Não edite à mão.\n` +
  `// celulas: uma letra por pino, linha a linha ("${FORA}" fora do mapa, "${MAR}" mar, letra = índice do território no alfabeto).\n` +
  `const MAPA = ${JSON.stringify(MAPA)};\n`);
console.log(`${COLUNAS}×${LINHAS} pinos, ${grade.filter(g => g >= 0).length} de terra. Menores:`,
  Object.entries(contagem).sort((a, b) => a[1] - b[1]).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(', '));
