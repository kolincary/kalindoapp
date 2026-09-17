const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(8100, 8130).map((l, i) => `${8101 + i}: ${l}`).join('\n'));
