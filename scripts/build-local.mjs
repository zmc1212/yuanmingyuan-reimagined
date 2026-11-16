// 生成 file:// 双击可用的 IIFE 产物 dist/js/local.bundle.js
// 可复现命令:npm run build:local(即 node scripts/build-local.mjs)
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

await build({
  entryPoints: [path.join(root, 'dist/js/main.js')],
  outfile: path.join(root, 'dist/js/local.bundle.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  alias: {
    three: path.join(root, 'node_modules/three/build/three.module.js'),
    'three/addons': path.join(root, 'node_modules/three/examples/jsm'),
  },
  logLevel: 'info',
});

console.log('[build:local] 完成 → dist/js/local.bundle.js');
