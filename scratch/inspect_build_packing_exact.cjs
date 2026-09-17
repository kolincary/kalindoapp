const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log('=== Lines 4760 - 4850 ===');
console.log(lines.slice(4760, 4850).map((l, i) => `${4761 + i}: ${l}`).join('\n'));
