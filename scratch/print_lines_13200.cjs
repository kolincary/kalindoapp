const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(13200, 13240).map((l, i) => `${13201 + i}: ${l}`).join('\n'));
