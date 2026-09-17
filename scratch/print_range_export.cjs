const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(8015, 8100).map((l, i) => `${8016 + i}: ${l}`).join('\n'));
