const fs = require('fs');
const content = fs.readFileSync('components/Dashboard.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('leader_pending_scans')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
