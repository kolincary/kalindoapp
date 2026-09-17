const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(8130, 8180).map((l, i) => `${8131 + i}: ${l}`).join('\n'));
