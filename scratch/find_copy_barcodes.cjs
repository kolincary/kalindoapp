const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('handleCopyAllBarcodes')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
