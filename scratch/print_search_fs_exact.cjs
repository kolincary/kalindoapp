const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

console.log(lines.slice(1930, 1988).map((l, i) => `${1931 + i}: ${l}`).join('\n'));
