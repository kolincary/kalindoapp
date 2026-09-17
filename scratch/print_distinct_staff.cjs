const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(4280, 4340).map((l, i) => `${4281 + i}: ${l}`).join('\n'));
