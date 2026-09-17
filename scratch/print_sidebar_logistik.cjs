const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(9925, 9965).map((l, i) => `${9926 + i}: ${l}`).join('\n'));
