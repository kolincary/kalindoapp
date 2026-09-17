const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('SidebarSection title="Data Logistik"') || l.includes('title="Data Logistik"')) {
    console.log(`Line ${i+1}: ${l}`);
  }
});
