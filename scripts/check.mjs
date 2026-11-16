// 全模块语法检查:node --check 每一个 JS 模块
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsRoot = path.join(root, 'dist/js');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.js') && name !== 'local.bundle.js') out.push(p);
  }
  return out;
}

const files = walk(jsRoot);
let bad = 0;
for (const f of files) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (e) {
    bad++;
    console.error(`✗ ${path.relative(root, f)}\n${e.stderr}`);
  }
}
console.log(`[check] ${files.length - bad}/${files.length} 模块语法通过`);
if (bad > 0) process.exit(1);
