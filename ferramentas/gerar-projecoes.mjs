// Gera ../dados/projecoes.js: contornos do mundo em 3 projeções (SVG) para o "Laboratório de projeções" do manual
// (EM13MAT509 e EM13CHS106). Destaca Groenlândia, África e Brasil para comparar as áreas.
// Uso: cd ferramentas && node gerar-projecoes.mjs
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const topo = require('topojson-client');
const d3 = require('d3-geo');
const { geoRobinson } = require('d3-geo-projection');
const mundo = require('world-atlas/countries-110m.json');
const paises = topo.feature(mundo, mundo.objects.countries).features;
const terra = topo.merge(mundo, mundo.objects.countries.geometries.filter(g => g.id !== '010'));
const AFRICA = ['012','024','072','108','120','132','140','148','174','178','180','204','226','231','232','262','266','270','288','324','384','404','426','430','434','450','454','466','478','480','504','508','516','562','566','624','646','678','686','694','706','710','716','728','729','732','748','768','788','800','818','834','854','894'];
const africa = topo.merge(mundo, mundo.objects.countries.geometries.filter(g => AFRICA.includes(g.id) || g.properties.name === 'Somaliland'));
const um = id => ({ type: 'FeatureCollection', features: paises.filter(f => f.id === id) });
const L = 900, A = 520;
const PROJ = {
  robinson: { nome: 'Robinson', proj: geoRobinson(), texto: 'Equilibra as distorções: nem as áreas nem os ângulos são perfeitos, mas o mapa parece "natural". É a projeção do mapa do jogo.' },
  mercator: { nome: 'Mercator', proj: d3.geoMercator().clipExtent(null), recorte: [[-180, -80], [180, 84]], texto: 'Conserva os ângulos (ótima para navegar), mas aumenta muito as áreas perto dos polos: a Groenlândia parece do tamanho da África.' },
  peters: { nome: 'Gall-Peters', proj: d3.geoEquirectangular(), equivalente: true, texto: 'Conserva as áreas (equivalente): a África aparece com seu tamanho real, cerca de 14 vezes a Groenlândia, mas as formas ficam esticadas.' },
};
// Gall-Peters = cilíndrica equivalente com paralelo padrão 45°
const gallPeters = d3.geoProjection((l, f) => [l * Math.cos(Math.PI / 4), Math.sin(f) / Math.cos(Math.PI / 4)]);
PROJ.peters.proj = gallPeters;
const saida = {};
for (const [id, p] of Object.entries(PROJ)) {
  const limite = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[-180, (p.recorte?.[0][1] ?? -60)], [180, (p.recorte?.[0][1] ?? -60)], [180, (p.recorte?.[1][1] ?? 84)], [-180, (p.recorte?.[1][1] ?? 84)], [-180, (p.recorte?.[0][1] ?? -60)]]] } };
  const cantosMercator = { type: 'Feature', geometry: { type: 'MultiPoint', coordinates: [[-180, -58], [180, 84]] } };
  p.proj.fitExtent([[6, 6], [L - 6, A - 6]], id === 'mercator' ? cantosMercator : { type: 'Sphere' });
  const caminho = d3.geoPath(p.proj).digits(1);
  const [[x0, y1], [x1, y0]] = id === 'mercator' ? [p.proj([-180, -58]), p.proj([180, 84])] : [[0, 0], [0, 0]];
  saida[id] = { nome: p.nome, texto: p.texto, largura: L, altura: A,
    contorno: id === 'mercator' ? `M${x0.toFixed(1)} ${y0.toFixed(1)}H${x1.toFixed(1)}V${y1.toFixed(1)}H${x0.toFixed(1)}Z` : caminho({ type: 'Sphere' }),
    terra: caminho(terra), groenlandia: caminho(um('304')), africa: caminho(africa), brasil: caminho(um('076')) };
}
const txt = `// Gerado por ferramentas/gerar-projecoes.mjs (Natural Earth 1:110m, domínio público). Não edite à mão.\n// Contornos em SVG para comparar projeções no Laboratório de projeções do manual.\nconst PROJECOES = ${JSON.stringify(saida)};\n`;
writeFileSync(new URL('../dados/projecoes.js', import.meta.url), txt);
console.log('dados/projecoes.js', (txt.length / 1024).toFixed(0), 'KB');
