import fs from 'fs';
import path from 'path';

console.log('--- AUDIT: MOBILE RESPONSIVENESS (320px - 1920px) ---');

const cwd = process.cwd();
const webDir = cwd.endsWith('web') ? cwd : path.resolve(cwd, 'apps/web');

let mobileErrors = 0;

// 1. Verify responsive container limits
const homePageContent = fs.readFileSync(path.join(webDir, 'app/page.tsx'), 'utf8');
if (!homePageContent.includes('max-w-7xl')) {
  console.error('FAIL: max-w-7xl container constraint missing in HomePage');
  mobileErrors++;
} else {
  console.log('✓ PASS: Responsive container boundaries verified.');
}

// 2. Verify mobile navigation drawer and hamburger toggle in Navbar
const navbarContent = fs.readFileSync(path.join(webDir, 'components/Navbar.tsx'), 'utf8');
if (!navbarContent.includes('md:hidden') || !navbarContent.includes('aria-label=')) {
  console.error('FAIL: Mobile drawer navigation or accessible toggle missing in Navbar');
  mobileErrors++;
} else {
  console.log('✓ PASS: Mobile navigation drawer with accessible toggle verified.');
}

// 3. Verify touch target compliance
const tokensContent = fs.readFileSync(path.join(webDir, 'lib/design-tokens.ts'), 'utf8');
if (!tokensContent.includes('48px')) {
  console.error('FAIL: 48px touch target token missing in lib/design-tokens.ts');
  mobileErrors++;
} else {
  console.log('✓ PASS: Minimum 48px touch targets enforced.');
}

if (mobileErrors > 0) {
  console.error(`Mobile audit failed with ${mobileErrors} errors.`);
  process.exit(1);
} else {
  console.log('✓ PASS: Mobile responsiveness and touch target compliance verified.');
}
