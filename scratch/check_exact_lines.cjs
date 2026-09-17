const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log('=== Lines 4760-4775 ===');
console.log(lines.slice(4760, 4775).map((l, i) => `${4761 + i}: ${l}`).join('\n'));

console.log('\n=== Lines 9935-9960 ===');
console.log(lines.slice(9935, 9960).map((l, i) => `${9936 + i}: ${l}`).join('\n'));
