const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(4975, 5050).map((l, i) => `${4976 + i}: ${l}`).join('\n'));
