const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('fetchPackingStats') || l.includes('totalScans') || l.includes('LEADER_2') && l.includes('count')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
