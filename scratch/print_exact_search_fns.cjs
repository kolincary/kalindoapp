const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

console.log(lines.slice(1935, 2085).map((l, i) => `${1936 + i}: ${l}`).join('\n'));
