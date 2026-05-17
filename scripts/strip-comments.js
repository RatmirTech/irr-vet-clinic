const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', '.claude', 'uploads', 'public']);

function stripJs(src) {
  let out = '';
  let i = 0;
  const n = src.length;
  let inS = false, inD = false, inT = false, inRegex = false;
  let prevTok = '';
  while (i < n) {
    const c = src[i];
    const c2 = src[i + 1];
    if (!inS && !inD && !inT && !inRegex) {
      if (c === '/' && c2 === '/') {
        while (i < n && src[i] !== '\n') i++;
        continue;
      }
      if (c === '/' && c2 === '*') {
        i += 2;
        while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
        i += 2;
        continue;
      }
    }
    if (!inD && !inT && !inRegex && c === "'" && src[i - 1] !== '\\') inS = !inS;
    else if (!inS && !inT && !inRegex && c === '"' && src[i - 1] !== '\\') inD = !inD;
    else if (!inS && !inD && !inRegex && c === '`' && src[i - 1] !== '\\') inT = !inT;
    out += c;
    if (/\S/.test(c)) prevTok = c;
    i++;
  }
  return out.replace(/\n[ \t]*\n[ \t]*\n+/g, '\n\n');
}

function stripPug(src) {
  const lines = src.split('\n');
  const out = [];
  let inBlockComment = false;
  let blockIndent = -1;
  for (const line of lines) {
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;
    if (inBlockComment) {
      if (trimmed === '' || indent > blockIndent) continue;
      inBlockComment = false;
    }
    if (trimmed.startsWith('//-') || (trimmed.startsWith('//') && !trimmed.startsWith('//='))) {
      const rest = trimmed.replace(/^\/\/-?/, '').trim();
      if (rest === '') {
        inBlockComment = true;
        blockIndent = indent;
      }
      continue;
    }
    out.push(line);
  }
  return out.join('\n').replace(/\n\n\n+/g, '\n\n');
}

function stripSql(src) {
  return src.replace(/--[^\n]*\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\n\n+/g, '\n\n');
}

function walk(dir, list) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, list);
    else list.push(full);
  }
}

const files = [];
walk(ROOT, files);

let processed = 0;
let skipped = 0;
for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  let stripper = null;
  if (ext === '.js') stripper = stripJs;
  else if (ext === '.pug') stripper = stripPug;
  else if (ext === '.sql') stripper = stripSql;
  if (!stripper) { skipped++; continue; }

  if (file === __filename) { skipped++; continue; }

  try {
    const src = fs.readFileSync(file, 'utf8');
    const result = stripper(src);
    if (result !== src) {
      fs.writeFileSync(file, result, 'utf8');
      processed++;
      console.log('  stripped:', path.relative(ROOT, file));
    }
  } catch (e) {
    console.warn('  ! skip', file, e.message);
  }
}

console.log(`\nГотово. Обработано файлов: ${processed}, пропущено: ${skipped}`);
