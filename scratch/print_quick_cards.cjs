const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(12080, 12120).map((l, i) => `${12081 + i}: ${l}`).join('\n'));
