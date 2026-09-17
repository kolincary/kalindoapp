const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

console.log(lines.slice(12350, 12450).map((l, i) => `${12351 + i}: ${l}`).join('\n'));
