import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const target = join(__dirname, 'src', 'routeTree.gen.ts');
let content = readFileSync(target, 'utf8');
console.log('Target:', target);
console.log('File size:', content.length, 'bytes');

const lines = content.split('\n');
const adminChildRoutes = ['AdminIndexRoute', 'AdminAccountRoute', 'AdminConsultationsRoute', 'AdminContactEntriesRoute', 'AdminServicesRoute', 'AdminSettingsRoute', 'AdminTestimonialsRoute'];

let fixed = 0;
for (let i = 0; i < lines.length; i++) {
  for (const routeName of adminChildRoutes) {
    if (lines[i].includes('const ' + routeName + 'Route = ' + routeName + 'RouteImport.update({')) {
      const gpLine = i + 3;
      if (gpLine < lines.length && lines[gpLine].includes('getParentRoute: () => rootRouteImport,')) {
        lines[gpLine] = lines[gpLine].replace('getParentRoute: () => rootRouteImport,', 'getParentRoute: () => AdminLayoutRoute,');
        console.log('Fixed line ' + (gpLine + 1) + ': ' + routeName);
        fixed++;
      }
    }
  }
}

if (fixed > 0) {
  writeFileSync(target, lines.join('\n'));
  console.log('Wrote ' + fixed + ' fixes');
} else {
  console.log('No fixes applied');
}

// Verify
const verify = readFileSync(target, 'utf8');
const count = (verify.match(/getParentRoute: \(\) => AdminLayoutRoute,/g) || []).length;
console.log('AdminLayoutRoute refs: ' + count);
const rootCount = (verify.match(/getParentRoute: \(\) => rootRouteImport,/g) || []).length;
console.log('rootRouteImport refs: ' + rootCount);
