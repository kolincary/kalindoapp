const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

console.log('=== Lines 1980 to 2090 in AdminDashboard.tsx ===');
console.log(lines.slice(1980, 2090).map((l, i) => `${1981 + i}: ${l}`).join('\n'));
