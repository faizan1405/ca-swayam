import { readFileSync, writeFileSync } from 'fs';

const target = 'swayam-consult-main/src/routeTree.gen.ts';
let content = readFileSync(target, 'utf8');
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

  const verify = readFileSync(target, 'utf8');
  const count = (verify.match(/getParentRoute: \(\) => AdminLayoutRoute,/g) || []).length;
  console.log('Verification - AdminLayoutRoute refs: ' + count);
  const rootCount = (verify.match(/getParentRoute: \(\) => rootRouteImport,/g) || []).length;
  console.log('rootRouteImport refs remaining: ' + rootCount);
} else {
  console.log('No fixes applied - patterns not found');
}
