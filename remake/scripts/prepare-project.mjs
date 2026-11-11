import fs from 'node:fs';
import path from 'node:path';

const project = path.resolve('RDS_Vocabulary_Game_Project');
const source = path.join(project, 'src/main.jsx');
const target = path.join(project, 'src/words.js');

if (!fs.existsSync(source)) throw new Error('Original vocabulary source was not found.');
const code = fs.readFileSync(source, 'utf8');
const start = code.indexOf('const WORDS=[');
if (start < 0) throw new Error('Could not locate the original WORDS dataset.');
const end = code.indexOf('\n];', start);
if (end < 0) throw new Error('Could not locate the end of the original WORDS dataset.');
const literal = code.slice(start + 'const WORDS='.length, end + 2);
new Function('return ' + literal)();
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, 'const WORDS = ' + literal + ';\nexport default WORDS;\n', 'utf8');
console.log('Preserved original vocabulary entries:', new Function('return ' + literal)().length);