import { build } from 'esbuild';
import { writeFileSync, rmSync } from 'node:fs';
const usados = 'AdditiveBlending BackSide Box3 BoxGeometry BufferAttribute BufferGeometry CanvasTexture CapsuleGeometry CircleGeometry Color ConeGeometry CylinderGeometry DirectionalLight DoubleSide Euler ExtrudeGeometry Float32BufferAttribute FrontSide Group HemisphereLight IcosahedronGeometry InstancedBufferAttribute InstancedMesh LatheGeometry LinearFilter MOUSE MathUtils Matrix4 Mesh MeshBasicMaterial MeshStandardMaterial NearestFilter NeutralToneMapping Object3D PCFShadowMap PMREMGenerator Path PerspectiveCamera Plane PlaneGeometry PointLight Quaternion Raycaster RepeatWrapping RingGeometry SRGBColorSpace Scene ShadowMaterial Shape Sphere SphereGeometry SpotLight TOUCH Timer TorusGeometry Vector2 Vector3 Vector4 WebGLRenderer';
const variantes = {
  tudo: `export * from 'three';`,
  usados: `export { ${usados.split(' ').join(', ')} } from 'three';`,
};
const addons = `
export { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
export { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
export { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
export { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
export { N8AOPass } from 'n8ao';`;
for (const [n, v] of Object.entries(variantes)) {
  const tmp = process.cwd() + '/.e-' + n + '.js'; writeFileSync(tmp, v + addons);
  const r = await build({ entryPoints: [tmp], bundle: true, format: 'iife', globalName: 'THREE', minify: true, legalComments: 'inline', write: false, metafile: true, logLevel: 'error' });
  rmSync(tmp); console.log(n, (r.outputFiles[0].contents.length / 1024).toFixed(0), 'KB');
}
