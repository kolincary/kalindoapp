const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(4825, 4850).map((l, i) => `${4826 + i}: ${l}`).join('\n'));
