const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('components/AdminDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Sidebar items
content = content.replace(
   'view="PACKING_DATA" icon={Package} label="Data Packing" requiredPerm="view_packing"',
   'view="PACKING_DATA" icon={Package} label="Data Packing Copy" requiredPerm="view_packing"'
);
content = content.replace(
   'view="PACKING_2_DATA" icon={Package} label="Data Packing 2" requiredPerm="view_packing_2"',
   'view="PACKING_2_DATA" icon={Package} label="Data Packing" requiredPerm="view_packing_2"'
);

// 2. Quick select list
content = content.replace(
   "{ id: 'PACKING_DATA', label: 'Data Packing', icon: Package, color: 'blue' }",
   "{ id: 'PACKING_DATA', label: 'Data Packing Copy', icon: Package, color: 'blue' }"
);
content = content.replace(
   "{ id: 'PACKING_2_DATA', label: 'Data Packing 2', icon: Package, color: 'blue' }",
   "{ id: 'PACKING_2_DATA', label: 'Data Packing', icon: Package, color: 'blue' }"
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully updated sidebar item labels!');
