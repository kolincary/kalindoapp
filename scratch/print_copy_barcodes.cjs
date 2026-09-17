const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(8467, 8530).map((l, i) => `${8468 + i}: ${l}`).join('\n'));
