const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

console.log('=== Lines 8800 to 9100 ===');
console.log(lines.slice(8800, 9100).map((l, i) => `${8801 + i}: ${l}`).join('\n'));
