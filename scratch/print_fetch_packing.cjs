const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(4880, 5000).map((l, i) => `${4881 + i}: ${l}`).join('\n'));
