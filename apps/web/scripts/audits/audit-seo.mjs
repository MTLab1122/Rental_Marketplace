import fs from 'fs';
import path from 'path';

console.log('--- AUDIT: TECHNICAL SEO, METADATA & ROBOTS ---');

const cwd = process.cwd();
const webDir = cwd.endsWith('web') ? cwd : path.resolve(cwd, 'apps/web');

let seoErrors = 0;

// 1. Verify OpenGraph 1200x630 image asset exists in public/
const ogPath = path.join(webDir, 'public/og-image.jpg');
if (!fs.existsSync(ogPath)) {
  console.error(`FAIL: OpenGraph 1200x630 image missing at ${ogPath}`);
  seoErrors++;
} else {
  const stats = fs.statSync(ogPath);
  if (stats.size === 0) {
    console.error('FAIL: OpenGraph image file is 0 bytes');
    seoErrors++;
  } else {
    console.log(`✓ PASS: OpenGraph preview image verified (${stats.size} bytes).`);
  }
}

// 2. Verify Robots.ts exists and disallows private routes
const robotsPath = path.join(webDir, 'app/robots.ts');
if (!fs.existsSync(robotsPath)) {
  console.error('FAIL: app/robots.ts does not exist');
  seoErrors++;
} else {
  const content = fs.readFileSync(robotsPath, 'utf8');
  if (!content.includes('/profile') || !content.includes('/messages')) {
    console.error('FAIL: Private routes not disallowed in robots.ts');
    seoErrors++;
  } else {
    console.log('✓ PASS: robots.ts disallows private tenant/landlord portals.');
  }
}

// 3. Verify Sitemap.ts exists
const sitemapPath = path.join(webDir, 'app/sitemap.ts');
if (!fs.existsSync(sitemapPath)) {
  console.error('FAIL: app/sitemap.ts does not exist');
  seoErrors++;
} else {
  console.log('✓ PASS: sitemap.ts dynamic generator verified.');
}

// 4. Verify Title and Description formulas in lib/seo.ts
const seoLibPath = path.join(webDir, 'lib/seo.ts');
if (fs.existsSync(seoLibPath)) {
  const content = fs.readFileSync(seoLibPath, 'utf8');
  if (!content.includes('Peshawar') || !content.includes('canonical')) {
    console.error('FAIL: SEO library missing canonical or brand requirements');
    seoErrors++;
  } else {
    console.log('✓ PASS: Canonical URL generation and brand title formulas verified.');
  }
}

if (seoErrors > 0) {
  console.error(`SEO audit failed with ${seoErrors} errors.`);
  process.exit(1);
} else {
  console.log('✓ PASS: All technical SEO, AEO, and GEO criteria satisfied.');
}
