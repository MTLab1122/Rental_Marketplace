import fs from 'fs';
import path from 'path';

console.log('--- AUDIT: PERFORMANCE & CORE WEB VITALS ---');

const cwd = process.cwd();
const webDir = cwd.endsWith('web') ? cwd : path.resolve(cwd, 'apps/web');

let perfErrors = 0;

// 1. Verify next.config.ts image optimization
const nextConfig = fs.readFileSync(path.join(webDir, 'next.config.ts'), 'utf8');
if (!nextConfig.includes('image/avif') || !nextConfig.includes('image/webp')) {
  console.error('FAIL: Modern image formats (AVIF, WebP) missing in next.config.ts');
  perfErrors++;
} else {
  console.log('✓ PASS: AVIF and WebP modern image format delivery configured.');
}

// 2. Verify lazy loading on non-critical images in PropertyCard
const propCard = fs.readFileSync(path.join(webDir, 'components/PropertyCard.tsx'), 'utf8');
if (!propCard.includes('loading="lazy"')) {
  console.error('FAIL: PropertyCard images missing loading="lazy" attribute');
  perfErrors++;
} else {
  console.log('✓ PASS: PropertyCard images lazy load below the fold.');
}

// 3. Verify aspect ratio preservation for zero CLS
if (!propCard.includes('aspect-[16/10]')) {
  console.error('FAIL: PropertyCard container missing fixed aspect ratio to prevent CLS');
  perfErrors++;
} else {
  console.log('✓ PASS: Fixed aspect ratio container prevents Cumulative Layout Shift.');
}

if (perfErrors > 0) {
  console.error(`Performance audit failed with ${perfErrors} errors.`);
  process.exit(1);
} else {
  console.log('✓ PASS: Performance and Core Web Vitals optimizations verified.');
}
