const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(4470, 4520).map((l, i) => `${4471 + i}: ${l}`).join('\n'));
