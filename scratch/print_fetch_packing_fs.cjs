const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(4980, 5045).map((l, i) => `${4981 + i}: ${l}`).join('\n'));
