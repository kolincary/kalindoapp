const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(9980, 10030).map((l, i) => `${9981 + i}: ${l}`).join('\n'));
