const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

const start = lines.findIndex((l, i) => i > 18000 && l.includes("activeView === 'CHECK_INVOICE'"));
console.log('JSX Start line:', start + 1);
console.log(lines.slice(start, start + 180).map((l, i) => (start + 1 + i) + ': ' + l).join('\n'));
