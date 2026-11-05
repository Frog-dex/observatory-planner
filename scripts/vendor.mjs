// Copies the exact Three.js files the pages import from node_modules into ./lib
// (the pages use an import map: "three" → ./lib/three.module.js, "three/addons/" → ./lib/jsm/).
// Run after bumping the `three` version in package.json:  npm install && npm run vendor
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SRC = 'node_modules/three';
const OUT = 'lib';
const FILES = [
  ['build/three.module.js', 'three.module.js'],
  ['build/three.core.js', 'three.core.js'],
  ['examples/jsm/loaders/GLTFLoader.js', 'jsm/loaders/GLTFLoader.js'],
  ['examples/jsm/utils/BufferGeometryUtils.js', 'jsm/utils/BufferGeometryUtils.js'],
  ['examples/jsm/utils/SkeletonUtils.js', 'jsm/utils/SkeletonUtils.js'],
  ['examples/jsm/libs/meshopt_decoder.module.js', 'jsm/libs/meshopt_decoder.module.js'],
  ['examples/jsm/controls/OrbitControls.js', 'jsm/controls/OrbitControls.js'],
  ['LICENSE', 'LICENSE'],
];
rmSync(OUT, { recursive: true, force: true });
for (const [from, to] of FILES) {
  const dest = join(OUT, to);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(join(SRC, from), dest);
}
const { version } = JSON.parse(readFileSync(join(SRC, 'package.json'), 'utf8'));
writeFileSync(join(OUT, 'VERSION'), `three ${version}\n`);
console.log(`vendored three ${version} → ${OUT}/ (${FILES.length} files)`);
