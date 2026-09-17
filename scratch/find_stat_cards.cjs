const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('TOTAL SCANS') || l.includes('ACTIVE STAFF') || l.includes('Total paket ter-scan')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
