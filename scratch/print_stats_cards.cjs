const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(13590, 13730).map((l, i) => `${13591 + i}: ${l}`).join('\n'));
