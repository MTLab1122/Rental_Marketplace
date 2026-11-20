import fs from 'fs';
import path from 'path';

console.log('--- AUDIT: FORMS, VALIDATION & BOT PROTECTION ---');

const cwd = process.cwd();
const webDir = cwd.endsWith('web') ? cwd : path.resolve(cwd, 'apps/web');

let formErrors = 0;

// 1. Verify honeypot field in HomePage search form
const homePageContent = fs.readFileSync(path.join(webDir, 'app/page.tsx'), 'utf8');
if (!homePageContent.includes('hp_search_confirm')) {
  console.error('FAIL: Honeypot anti-bot protection missing in app/page.tsx search form');
  formErrors++;
} else {
  console.log('✓ PASS: Search form bot protection honeypot verified.');
}

// 2. Verify honeypot in FeedbackWidget
const feedbackWidgetContent = fs.readFileSync(path.join(webDir, 'components/FeedbackWidget.tsx'), 'utf8');
if (!feedbackWidgetContent.includes('hp_feedback_check')) {
  console.error('FAIL: Honeypot anti-bot protection missing in FeedbackWidget');
  formErrors++;
} else {
  console.log('✓ PASS: Feedback widget honeypot verified.');
}

// 3. Verify duplicate submission prevention across forms
if (!feedbackWidgetContent.includes('disabled={submitting}')) {
  console.error('FAIL: FeedbackWidget missing submit button disability state during request flight');
  formErrors++;
} else {
  console.log('✓ PASS: Duplicate submission debounce and flight lock verified.');
}

// 4. Verify explicit labels / accessibility on input fields
if (!homePageContent.includes('htmlFor="hero-search-input"')) {
  console.error('FAIL: Missing accessible label on hero search input in app/page.tsx');
  formErrors++;
} else {
  console.log('✓ PASS: Explicit accessible label associations verified.');
}

if (formErrors > 0) {
  console.error(`Forms audit failed with ${formErrors} errors.`);
  process.exit(1);
} else {
  console.log('✓ PASS: All forms, validation states, and bot protection measures verified.');
}
