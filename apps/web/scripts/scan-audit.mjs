import fs from 'fs';
import path from 'path';

// Match actual pictographic emojis
const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}]/u;
// Purple CSS classes and hex codes (not comments)
const purpleRegex = /(bg|text|border|ring|shadow|from|to|via)-purple|fuchsia|violet|#a855f7|#8b5cf6|#9333ea|#7e22ce|#6b21a8|#581c87|#3b0764/i;
// Pill shapes on buttons, badges, chips, inputs
const pillRegex = /\b(rounded-full|rounded-m3-full)\b(?!.*border-4)/;
const fakeMetricsRegex = /(10,?000\+\s*happy|50,?000\+\s*listings|satisfied tenants)/i;

const results = {
  emojis: [],
  purples: [],
  pills: [],
  fakeMetrics: [],
};

function scan(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(full);
    } else if (/\.(tsx|ts|jsx|js|css)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        // Ignore comments
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;

        if (emojiRegex.test(line)) {
          results.emojis.push({ file: full, lineNum, text: line.trim() });
        }
        if (purpleRegex.test(line)) {
          results.purples.push({ file: full, lineNum, text: line.trim() });
        }
        if (pillRegex.test(line)) {
          results.pills.push({ file: full, lineNum, text: line.trim() });
        }
        if (fakeMetricsRegex.test(line)) {
          results.fakeMetrics.push({ file: full, lineNum, text: line.trim() });
        }
      });
    }
  }
}

scan('apps/web/app');
scan('apps/web/components');
scan('apps/web/lib');

fs.writeFileSync('apps/web/scripts/audit-output.json', JSON.stringify(results, null, 2), 'utf8');

function group(list) {
  const map = {};
  list.forEach(item => {
    const rel = item.file.replace(/\\/g, '/').replace(/.*apps\/web\//, '');
    map[rel] = (map[rel] || 0) + 1;
  });
  return map;
}

console.log('PURPLE OCCURRENCES:', results.purples.length, group(results.purples));
console.log('PILL OCCURRENCES:', results.pills.length, group(results.pills));
console.log('EMOJI OCCURRENCES:', results.emojis.length, group(results.emojis));
console.log('FAKE METRICS OCCURRENCES:', results.fakeMetrics.length);
