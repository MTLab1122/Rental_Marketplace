import fs from 'fs';
import path from 'path';

console.log('--- AUDIT: LINKS & NAVIGATION ---');

const cwd = process.cwd();
const webDir = cwd.endsWith('web') ? cwd : path.resolve(cwd, 'apps/web');
const appDir = path.join(webDir, 'app');
const compDir = path.join(webDir, 'components');

// 1. Collect all valid App Router routes
function getAvailableRoutes(dir, baseRoute = '') {
  const routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...getAvailableRoutes(full, `${baseRoute}/${entry.name}`));
    } else if (entry.name === 'page.tsx' || entry.name === 'page.js') {
      routes.push(baseRoute === '' ? '/' : baseRoute);
    }
  }
  return routes;
}

const availableRoutes = getAvailableRoutes(appDir);

function matchRoute(target) {
  if (target === '/') return true;
  const pathWithoutQuery = target.split('?')[0].split('#')[0];
  if (pathWithoutQuery === '' || pathWithoutQuery === '/') return true;

  // External URLs or mailto
  if (/^https?:\/\//.test(pathWithoutQuery) || pathWithoutQuery.startsWith('mailto:')) return true;

  const targetParts = pathWithoutQuery.split('/').filter(Boolean);

  for (const route of availableRoutes) {
    const routeParts = route.split('/').filter(Boolean);
    if (routeParts.length !== targetParts.length) continue;

    let matched = true;
    for (let i = 0; i < routeParts.length; i++) {
      const rp = routeParts[i];
      const tp = targetParts[i];
      if (rp.startsWith('[') && rp.endsWith(']')) {
        continue;
      }
      if (rp !== tp) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
}

const linkRegex = /href=["']([^"']+)["']/g;
const routerPushRegex = /router\.push\(['"`]([^'"`]+)['"`]\)/g;

let totalLinksChecked = 0;
const brokenLinks = [];

function scanDirForLinks(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirForLinks(full);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      const content = fs.readFileSync(full, 'utf8');
      let m;
      while ((m = linkRegex.exec(content)) !== null) {
        const link = m[1];
        if (!link.startsWith('#') && !link.startsWith('{')) {
          totalLinksChecked++;
          if (!matchRoute(link)) {
            brokenLinks.push({ file: full, link });
          }
        }
      }
      while ((m = routerPushRegex.exec(content)) !== null) {
        const link = m[1];
        totalLinksChecked++;
        if (!matchRoute(link)) {
          brokenLinks.push({ file: full, link });
        }
      }
    }
  }
}

scanDirForLinks(appDir);
scanDirForLinks(compDir);

console.log(`Total internal links checked: ${totalLinksChecked}`);
if (brokenLinks.length > 0) {
  console.error(`Found ${brokenLinks.length} broken links:`, brokenLinks);
  process.exit(1);
} else {
  console.log('✓ PASS: All internal navigation links resolve to valid routes. 0 broken links.');
}
