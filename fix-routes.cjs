const fs = require('fs');

const target = 'swayam-consult-main/src/routeTree.gen.ts';

// Read current content
let content = fs.readFileSync(target, 'utf8');
console.log('File size:', content.length, 'bytes');

// Find all getParentRoute lines and their surrounding context
const lines = content.split('\n');
const adminChildRoutes = ['AdminIndexRoute', 'AdminAccountRoute', 'AdminConsultationsRoute', 'AdminContactEntriesRoute', 'AdminServicesRoute', 'AdminSettingsRoute', 'AdminTestimonialsRoute'];

let fixed = 0;
for (let i = 0; i < lines.length; i++) {
  for (const routeName of adminChildRoutes) {
    if (lines[i].includes('const ' + routeName + 'Route = ' + routeName + 'RouteImport.update({')) {
      // Next line should be id, then path, then getParentRoute
      const gpLine = i + 3; // 0: const, 1: id, 2: path, 3: getParentRoute
      if (gpLine < lines.length && lines[gpLine].includes('getParentRoute: () => rootRouteImport,')) {
        lines[gpLine] = lines[gpLine].replace('getParentRoute: () => rootRouteImport,', 'getParentRoute: () => AdminLayoutRoute,');
        console.log('Fixed line ' + (gpLine + 1) + ': ' + routeName);
        fixed++;
      }
    }
  }
}

if (fixed > 0) {
  fs.writeFileSync(target, lines.join('\n'));
  console.log('Wrote ' + fixed + ' fixes to file');

  // Verify
  const verify = fs.readFileSync(target, 'utf8');
  const count = (verify.match(/getParentRoute: \(\) => AdminLayoutRoute,/g) || []).length;
  console.log('Verification - AdminLayoutRoute refs: ' + count);
} else {
  console.log('No fixes applied - patterns not found');
}
