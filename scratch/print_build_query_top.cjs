const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(4758, 4780).map((l, i) => `${4759 + i}: ${l}`).join('\n'));
