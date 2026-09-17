const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

console.log(lines.slice(13970, 14015).map((l, i) => `${13971 + i}: ${l}`).join('\n'));
