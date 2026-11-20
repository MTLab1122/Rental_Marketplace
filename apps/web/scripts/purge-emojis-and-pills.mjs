import fs from 'fs';
import path from 'path';

// Exact string mappings for emojis and pills
const replacements = [
  // Pills
  { search: /rounded-full(?!\s*border-4)/g, replace: 'rounded-md' },
  { search: /rounded-m3-full/g, replace: 'rounded-md' },

  // Emojis with icons or clean text
  { search: /<span>🇵🇰<\/span>\s*/g, replace: '' },
  { search: /🇵🇰\s*/g, replace: '' },
  { search: /<span>🔍<\/span>/g, replace: '<SearchIcon className="w-4 h-4 text-navy-400" />' },
  { search: /🔍\s*/g, replace: '' },
  { search: /<span>📍<\/span>/g, replace: '<MapPinIcon className="w-3.5 h-3.5 text-navy-400" />' },
  { search: /📍\s*/g, replace: '' },
  { search: /🛏️\s*/g, replace: '' },
  { search: /🚿\s*/g, replace: '' },
  { search: /🛋️\s*/g, replace: '' },
  { search: /🎓\s*/g, replace: '' },
  { search: /👨‍👩‍👧‍👦\s*/g, replace: '' },
  { search: /👨‍👩‍👧\s*/g, replace: '' },
  { search: /🛡️\s*/g, replace: '' },
  { search: /🔥\s*/g, replace: '' },
  { search: /<span>🔥<\/span>/g, replace: '' },
  { search: /<span>✨<\/span>/g, replace: '' },
  { search: /✨\s*/g, replace: '' },
  { search: /<span>🔔<\/span>/g, replace: '' },
  { search: /🔔\s*/g, replace: '' },
  { search: /<span>🕒<\/span>/g, replace: '' },
  { search: /🕒\s*/g, replace: '' },
  { search: /<span>🏘️<\/span>/g, replace: '' },
  { search: /🏘️\s*/g, replace: '' },
  { search: /🎯\s*/g, replace: '' },
  { search: /<span>💬<\/span>/g, replace: '' },
  { search: /💬\s*/g, replace: '' },
  { search: /🎉\s*/g, replace: '' },
  { search: /⚠️\s*/g, replace: '' },
  { search: /🔒\s*/g, replace: '' },
  { search: /icon="🔒"/g, replace: 'icon="lock"' },
  { search: /icon="❤️"/g, replace: 'icon="heart"' },
  { search: /icon="📬"/g, replace: 'icon="inbox"' },
  { search: /icon="🔔"/g, replace: 'icon="bell"' },
  { search: /icon="💬"/g, replace: 'icon="chat"' },
  { search: /icon="🔍"/g, replace: 'icon="search"' },
  { search: /icon="🏠"/g, replace: 'icon="home"' },
  { search: /icon="🎓"/g, replace: 'icon="student"' },
  { search: /❤️\s*/g, replace: '' },
  { search: /🤍\s*/g, replace: '' },
  { search: /📬\s*/g, replace: '' },
  { search: /✅\s*/g, replace: '' },
  { search: /📌\s*/g, replace: '' },
  { search: /⚡\s*/g, replace: '' },
  { search: /💎\s*/g, replace: '' },
  { search: /🎁\s*/g, replace: '' },
  { search: /📊\s*/g, replace: '' },
  { search: /📄\s*/g, replace: '' },
  { search: /🤳\s*/g, replace: '' },
  { search: /🚫\s*/g, replace: '' },
  { search: /👉\s*/g, replace: '' },
  { search: /🚩\s*/g, replace: '' },
  { search: /🍲\s*/g, replace: '' },
  { search: /📶\s*/g, replace: '' },
  { search: /🚌\s*/g, replace: '' },
  { search: /🏛️\s*/g, replace: '' },
  { search: /🏥\s*/g, replace: '' },
  { search: /📖\s*/g, replace: '' },
  { search: /🏢\s*/g, replace: '' },
  { search: /💰\s*/g, replace: '' },
  { search: /👥\s*/g, replace: '' },
  { search: /💧\s*/g, replace: '' },
  { search: /🏡\s*/g, replace: '' },
  { search: /📜\s*/g, replace: '' },
  { search: /⚙️\s*/g, replace: '' },
  { search: /🔑\s*/g, replace: '' },
  { search: /✉️\s*/g, replace: '' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  for (const { search, replace } of replacements) {
    content = content.replace(search, replace);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      processFile(full);
    }
  }
}

walkDir('apps/web/app');
walkDir('apps/web/components');
console.log('Batch purge complete.');
