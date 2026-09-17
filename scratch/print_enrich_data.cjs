const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

console.log(lines.slice(4935, 4985).map((l, i) => `${4936 + i}: ${l}`).join('\n'));
