const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(9920, 9990).map((l, i) => `${9921 + i}: ${l}`).join('\n'));
