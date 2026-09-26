const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes("from('batches')") || l.includes('from("batches")')) {
    console.log(i + 1, l.trim());
  }
});
