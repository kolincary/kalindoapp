const fs = require('fs');
const content = fs.readFileSync('components/Dashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log(lines.slice(1780, 1855).map((l, i) => `${1781 + i}: ${l}`).join('\n'));
