const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log('=== Lines 4760 - 4850 ===');
console.log(lines.slice(4760, 4850).map((l, i) => `${4761 + i}: ${l}`).join('\n'));

console.log('\n=== Lines 5050 - 5080 ===');
console.log(lines.slice(5050, 5080).map((l, i) => `${5051 + i}: ${l}`).join('\n'));
