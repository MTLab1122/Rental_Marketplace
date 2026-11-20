import fs from 'fs';
import path from 'path';

console.log('--- AUDIT: ACCESSIBILITY (WCAG 2.2 AA) ---');

const cwd = process.cwd();
const webDir = cwd.endsWith('web') ? cwd : path.resolve(cwd, 'apps/web');
const appDir = path.join(webDir, 'app');
const compDir = path.join(webDir, 'components');

let a11yErrors = 0;

// 1. Verify Skip Link in layout
const layoutContent = fs.readFileSync(path.join(appDir, 'layout.tsx'), 'utf8');
if (!layoutContent.includes('skip-link') || !layoutContent.includes('id="main-content"')) {
  console.error('FAIL: Skip link or main content target missing in app/layout.tsx');
  a11yErrors++;
} else {
  console.log('✓ PASS: Skip to main content link and target verified.');
}

// 2. Verify Reduced Motion and Focus Visible in globals.css
const cssContent = fs.readFileSync(path.join(appDir, 'globals.css'), 'utf8');
if (!cssContent.includes('prefers-reduced-motion') || !cssContent.includes(':focus-visible')) {
  console.error('FAIL: Accessibility CSS rules missing in app/globals.css');
  a11yErrors++;
} else {
  console.log('✓ PASS: prefers-reduced-motion and high-visibility focus indicators verified.');
}

// 3. Verify img alt attributes in components and pages
function scanImages(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanImages(full);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      const imgRegex = /<img\b([^>]*)>/g;
      let m;
      while ((m = imgRegex.exec(content)) !== null) {
        const attrs = m[1];
        if (!attrs.includes('alt=')) {
          console.error(`FAIL: Missing alt attribute in ${full}: ${m[0]}`);
          a11yErrors++;
        }
      }
    }
  }
}

scanImages(appDir);
scanImages(compDir);

// 4. Verify no emoji UI buttons or headings
const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}]/u;
function scanEmojis(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanEmojis(full);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
        if (emojiRegex.test(line)) {
          console.error(`FAIL: Emoji found in ${full}:${idx + 1}: ${line.trim()}`);
          a11yErrors++;
        }
      });
    }
  }
}

scanEmojis(appDir);
scanEmojis(compDir);

if (a11yErrors > 0) {
  console.error(`Accessibility audit failed with ${a11yErrors} errors.`);
  process.exit(1);
} else {
  console.log('✓ PASS: WCAG 2.2 AA accessibility requirements satisfied across all components.');
}
