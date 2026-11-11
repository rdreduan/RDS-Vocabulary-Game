import fs from 'node:fs';
import path from 'node:path';

// The workflow runs this script from the extracted project directory.
const project = process.cwd();
const source = path.join(project, 'original-main.jsx');
if (!fs.existsSync(source)) throw new Error('Original source missing: ' + source);

const code = fs.readFileSync(source, 'utf8');
const a = code.indexOf('const WORDS=[');
const b = code.indexOf('\n];', a);
if (a < 0 || b < 0) throw new Error('Original vocabulary array missing.');
const literal = code.slice(a + 'const WORDS='.length, b + 2);
const words = new Function('return ' + literal)();
if (!Array.isArray(words) || words.length < 100) throw new Error('Vocabulary validation failed.');
fs.writeFileSync(path.join(project, 'src/words.js'), 'const WORDS = ' + literal + ';\nexport default WORDS;\n');

const c = code.indexOf('const firebaseConfig =');
const d = code.indexOf('{', c);
const e = code.indexOf('\n};', d);
if (c < 0 || d < 0 || e < 0) throw new Error('Firebase config missing.');
const config = new Function('return (' + code.slice(d, e + 2) + ')')();
for (const key of ['apiKey', 'authDomain', 'projectId', 'appId']) {
  if (!config[key] || String(config[key]).startsWith('YOUR_')) throw new Error('Firebase ' + key + ' missing.');
}
fs.writeFileSync(path.join(project, 'src/firebase-config.js'), 'export const firebaseConfig = ' + JSON.stringify(config, null, 2) + ';\n');
console.log('Validated and preserved ' + words.length + ' vocabulary entries and Firebase web config.');
