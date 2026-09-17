const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(4230, 4280).map((l, i) => `${4231 + i}: ${l}`).join('\n'));
