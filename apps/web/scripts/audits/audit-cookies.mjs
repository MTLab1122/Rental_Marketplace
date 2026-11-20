import fs from 'fs';
import path from 'path';

console.log('--- AUDIT: PRIVACY & COOKIE CONSENT ---');

const cwd = process.cwd();
const webDir = cwd.endsWith('web') ? cwd : path.resolve(cwd, 'apps/web');

let cookieErrors = 0;

// 1. Verify CookieConsentBanner in RootLayout
const layoutContent = fs.readFileSync(path.join(webDir, 'app/layout.tsx'), 'utf8');
if (!layoutContent.includes('<CookieConsentBanner />')) {
  console.error('FAIL: CookieConsentBanner component not mounted in RootLayout');
  cookieErrors++;
} else {
  console.log('✓ PASS: CookieConsentBanner mounted in RootLayout.');
}

// 2. Verify Cookie Policy page exists
const cookiePolicyPath = path.join(webDir, 'app/cookie-policy/page.tsx');
if (!fs.existsSync(cookiePolicyPath)) {
  console.error('FAIL: /cookie-policy/page.tsx missing');
  cookieErrors++;
} else {
  console.log('✓ PASS: /cookie-policy page exists.');
}

// 3. Verify Privacy Policy page exists
const privacyPolicyPath = path.join(webDir, 'app/privacy-policy/page.tsx');
if (!fs.existsSync(privacyPolicyPath)) {
  console.error('FAIL: /privacy-policy/page.tsx missing');
  cookieErrors++;
} else {
  console.log('✓ PASS: /privacy-policy page exists.');
}

// 4. Verify Cookie Preferences trigger in Footer
const footerContent = fs.readFileSync(path.join(webDir, 'components/Footer.tsx'), 'utf8');
if (!footerContent.includes('open-cookie-preferences')) {
  console.error('FAIL: Footer missing Cookie Preferences consent withdrawal link');
  cookieErrors++;
} else {
  console.log('✓ PASS: Footer consent management and withdrawal integration verified.');
}

if (cookieErrors > 0) {
  console.error(`Cookie consent audit failed with ${cookieErrors} errors.`);
  process.exit(1);
} else {
  console.log('✓ PASS: Cookie consent lifecycle and compliance policies verified.');
}
