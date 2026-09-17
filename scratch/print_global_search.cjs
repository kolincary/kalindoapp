const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(1930, 2075).map((l, i) => `${1931 + i}: ${l}`).join('\n'));
