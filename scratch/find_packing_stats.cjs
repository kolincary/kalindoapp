const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('setPackingStats') || l.includes('packingStats =') || l.includes('const [packingStats')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
