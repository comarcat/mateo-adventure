// Bundles the whole game into ONE self-contained HTML file that runs straight from disk (double-click / file://)
// or on any static host (itch.io, GitHub Pages...).    Usage: node tools/bundle.mjs   ->  dist/index.html
// No dependencies. It understands the simple module style used in this project:
//   import { a, b } from './x.js';     export const|function|class name ...
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = 'src/main.js';
const mods = new Map();          // key -> {code, deps, exports}

function visit(key, stack = []) {
  if (mods.has(key)) return;
  if (stack.includes(key)) throw new Error('circular import: ' + [...stack, key].join(' -> '));
  let code = fs.readFileSync(path.join(root, key), 'utf8');
  const deps = [], exports = [];
  code = code.replace(/^import\s*\{([^}]*)\}\s*from\s*'([^']+)';?[ \t]*$/gm, (m, names, from) => {
    const dep = path.posix.normalize(path.posix.join(path.posix.dirname(key), from));
    deps.push(dep);
    const list = names.split(',').map((s) => s.trim()).filter(Boolean).map((s) => s.replace(/\s+as\s+/, ': '));
    return `const { ${list.join(', ')} } = __m[${JSON.stringify(dep)}];`;
  });
  code = code.replace(/^export\s+(const|let|var|function|class)\s+([A-Za-z0-9_$]+)/gm, (m, kind, name) => { exports.push(name); return `${kind} ${name}`; });
  if (/^\s*(import|export)\s/m.test(code.replace(/\/\/.*$/gm, ''))) {
    const bad = code.split('\n').find((l) => /^\s*(import|export)\s/.test(l));
    throw new Error(`unsupported import/export syntax in ${key}: ${bad}`);
  }
  stack = [...stack, key];
  for (const d of deps) visit(d, stack);
  mods.set(key, { code, deps, exports });       // map insertion order = dependency order
}
visit(entry);

let out = '(function () {\n"use strict";\nconst __m = {};\n';
for (const [key, m] of mods) {
  out += `// ---- ${key}\n__m[${JSON.stringify(key)}] = (function () {\n${m.code}\nreturn { ${m.exports.join(', ')} };\n})();\n`;
}
out += '})();\n';

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<script type="module" src="src\/main.js"><\/script>/, () => `<script>\n${out.replace(/<\/script>/g, '<\\/script>')}</script>`);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), html);
console.log(`bundled ${mods.size} modules -> dist/index.html (${(html.length / 1024).toFixed(0)} KB)`);
