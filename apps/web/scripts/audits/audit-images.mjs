import fs from 'fs';
import path from 'path';

console.log('--- AUDIT: ASSETS & IMAGES ---');

const cwd = process.cwd();
const webDir = cwd.endsWith('web') ? cwd : path.resolve(cwd, 'apps/web');
const publicDir = path.join(webDir, 'public');

let imgErrors = 0;

const requiredAssets = [
  'favicon.ico',
  'favicon.svg',
  'og-image.jpg',
  'og-image.png',
  'apple-touch-icon.png',
];

for (const asset of requiredAssets) {
  const filePath = path.join(publicDir, asset);
  if (!fs.existsSync(filePath)) {
    console.error(`FAIL: Required public asset missing: ${asset}`);
    imgErrors++;
  } else {
    const size = fs.statSync(filePath).size;
    if (size === 0) {
      console.error(`FAIL: Asset ${asset} is empty (0 bytes)`);
      imgErrors++;
    } else {
      console.log(`✓ PASS: Asset ${asset} verified (${size} bytes).`);
    }
  }
}

if (imgErrors > 0) {
  console.error(`Images audit failed with ${imgErrors} errors.`);
  process.exit(1);
} else {
  console.log('✓ PASS: All public brand assets, icons, and OG images are verified.');
}
