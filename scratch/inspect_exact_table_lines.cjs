const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

console.log('=== LINES 14005 to 14035 ===');
console.log(lines.slice(14005, 14035).map((l, i) => `${14006 + i}: ${l}`).join('\n'));

console.log('\n=== LINES 14065 to 14115 ===');
console.log(lines.slice(14065, 14115).map((l, i) => `${14066 + i}: ${l}`).join('\n'));
