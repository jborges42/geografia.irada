// Gera ../dados/modelos.js: os modelos 3D de ferramentas/modelos/*.glb embutidos em base64 (o jogo abre por file://,
// sem buscar arquivo). Origem e licenças em ferramentas/modelos/catalogo.json (Kenney, CC0 1.0, e modelos próprios,
// CC0 1.0). Escala: 1 unidade = 1 pino do mapa; pivô no chão; frente para +Z.
// Uso no jogo: new THREE.GLTFLoader().parse(Modelos3D.buffer('arvore-folhosa'), '', gltf => …) — js/mapa3d.js já faz isso.
// Rodar:  cd ferramentas && node gerar-modelos.mjs
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';

const PASTA = new URL('./modelos/', import.meta.url), SAIDA = new URL('../dados/modelos.js', import.meta.url);
const catalogo = JSON.parse(readFileSync(new URL('catalogo.json', PASTA), 'utf8'));
const arquivos = readdirSync(PASTA).filter(f => f.endsWith('.glb')).sort();
const semCatalogo = arquivos.filter(f => !catalogo.some(m => m.id + '.glb' === f));
if (semCatalogo.length) throw new Error('modelo sem licença no catálogo: ' + semCatalogo.join(', '));

const linhas = arquivos.map(f => `    '${f.slice(0, -4)}': '${readFileSync(new URL(f, PASTA)).toString('base64')}',`);
writeFileSync(SAIDA, `'use strict';
/* Geografia Irada — modelos 3D embutidos (GLB em base64). Gerado por ferramentas/gerar-modelos.mjs; não edite à mão.
   Origem e licenças: ferramentas/modelos/catalogo.json (Kenney, CC0 1.0, e modelos próprios, CC0 1.0).
   Uso: new THREE.GLTFLoader().parse(Modelos3D.buffer('arvore-folhosa'), '', gltf => cena.add(gltf.scene)). */
const Modelos3D = (() => {
  const B64 = {
${linhas.join('\n')}
  };
  const buffer = id => Uint8Array.from(atob(B64[id]), c => c.charCodeAt(0)).buffer;
  return { ids: Object.keys(B64), buffer };
})();
`);
console.log(`dados/modelos.js gerado: ${arquivos.length} modelos, ${(statSync(SAIDA).size / 1024).toFixed(0)} KB`);
