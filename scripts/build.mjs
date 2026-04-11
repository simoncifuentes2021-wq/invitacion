import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const dist = resolve(root, 'dist');

if (existsSync(dist)) {
  rmSync(dist, { recursive: true, force: true });
}

mkdirSync(dist, { recursive: true });

for (const file of ['index.html', 'styles.css', 'script.js']) {
  cpSync(resolve(root, file), resolve(dist, file));
}

const publicDir = resolve(root, 'public');
if (existsSync(publicDir)) {
  cpSync(publicDir, dist, { recursive: true });
}

console.log('Build listo en dist/');
