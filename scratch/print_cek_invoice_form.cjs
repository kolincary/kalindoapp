const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

console.log(lines.slice(18500, 18600).map((l, i) => `${18501 + i}: ${l}`).join('\n'));
