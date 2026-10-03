// Gera ../lib/three.min.js: o Three.js (ES modules) empacotado como script clássico com a global THREE,
// para o jogo funcionar sem build e até abrindo o index.html direto do disco.
// Desempenho: exporta só o que o jogo usa (antes era `export *`: 1089 KB; agora ~880 KB, menos para baixar e compilar
// no computador da escola). Precisa de outra classe? Acrescente o nome em USADOS (ou a linha do complemento em ADDONS)
// e rode:  cd ferramentas && node gerar-three.mjs   — o gerador confere se todo THREE.X do projeto foi exportado.
import { build } from 'esbuild';
import { writeFileSync, rmSync, readFileSync, readdirSync } from 'node:fs';

const USADOS = `AdditiveBlending AmbientLight BackSide BatchedMesh Box3 BoxGeometry BufferAttribute BufferGeometry CanvasTexture CapsuleGeometry
  CircleGeometry Clock Color ConeGeometry CylinderGeometry DirectionalLight DoubleSide Euler ExtrudeGeometry Float32BufferAttribute
  FrontSide Group HemisphereLight IcosahedronGeometry InstancedBufferAttribute InstancedMesh LatheGeometry LinearFilter MOUSE
  MathUtils Matrix4 Mesh MeshBasicMaterial MeshLambertMaterial MeshStandardMaterial NearestFilter NeutralToneMapping Object3D
  PCFShadowMap PMREMGenerator Path PerspectiveCamera Plane PlaneGeometry PointLight Quaternion REVISION Raycaster RepeatWrapping
  RingGeometry SRGBColorSpace Scene ShadowMaterial Shape Skeleton SkinnedMesh Sphere SphereGeometry Sprite SpriteMaterial SpotLight TOUCH Texture
  Timer TorusGeometry Uint16BufferAttribute Vector2 Vector3 Vector4 WebGLRenderer`.split(/\s+/).filter(Boolean);
const ADDONS = `
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
export { N8AOPass } from 'n8ao';
`;
// Conferência: todo THREE.Nome usado nos scripts do jogo e nas vitrines precisa estar exportado
const exportados = new Set([...USADOS, ...[...ADDONS.matchAll(/(?:as )?(\w+)(?=[,\s]*[},])/g)].map(m => m[1])]);
const raiz = new URL('../', import.meta.url);
const arquivos = [...readdirSync(new URL('js/', raiz)).map(f => 'js/' + f), ...readdirSync(new URL('ferramentas/', raiz)).filter(f => f.endsWith('.html')).map(f => 'ferramentas/' + f)];
const faltam = new Set();
for (const f of arquivos) for (const [, nome] of readFileSync(new URL(f, raiz), 'utf8').matchAll(/THREE\.([A-Za-z_]\w*)/g)) if (!exportados.has(nome)) faltam.add(`${nome} (${f})`);
if (faltam.size) { console.error('Falta exportar do Three.js:', [...faltam].join(', ')); process.exit(1); }

const tmp = new URL('./.entrada-three.js', import.meta.url).pathname;
writeFileSync(tmp, `export { ${USADOS.join(', ')} } from 'three';\n${ADDONS}`);
const r = await build({
  entryPoints: [tmp], bundle: true, format: 'iife', globalName: 'THREE', minify: true, legalComments: 'inline',
  outfile: new URL('../lib/three.min.js', import.meta.url).pathname, logLevel: 'warning', metafile: true,
});
rmSync(tmp);
const kb = Object.values(r.metafile.outputs)[0].bytes / 1024;
console.log(`lib/three.min.js gerado (${kb.toFixed(0)} KB)`);
