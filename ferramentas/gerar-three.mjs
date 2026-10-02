// Gera ../lib/three.min.js: o Three.js (ES modules) empacotado como script clássico com a global THREE,
// para o jogo funcionar sem build e até abrindo o index.html direto do disco.
// Para usar outro complemento (addon), acrescente a linha em ENTRADA e rode:  cd ferramentas && node gerar-three.mjs
import { build } from 'esbuild';
import { writeFileSync, rmSync } from 'node:fs';

const ENTRADA = `
export * from 'three';
export { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
export { clone as clonarComEsqueleto } from 'three/addons/utils/SkeletonUtils.js';
export { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
export { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
export { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
export { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
export { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';
export { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
export { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
export { N8AOPass, N8AOPostPass } from 'n8ao';
`;
const tmp = new URL('./.entrada-three.js', import.meta.url).pathname;
writeFileSync(tmp, ENTRADA);
const r = await build({
  entryPoints: [tmp], bundle: true, format: 'iife', globalName: 'THREE', minify: true, legalComments: 'inline',
  outfile: new URL('../lib/three.min.js', import.meta.url).pathname, logLevel: 'warning', metafile: true,
});
rmSync(tmp);
const kb = Object.values(r.metafile.outputs)[0].bytes / 1024;
console.log(`lib/three.min.js gerado (${kb.toFixed(0)} KB)`);
