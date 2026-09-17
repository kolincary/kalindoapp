const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

console.log(lines.slice(14050, 14130).map((l, i) => `${14051 + i}: ${l}`).join('\n'));
