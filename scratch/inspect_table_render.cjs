const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

console.log('=== ENRICH DATA IN FETCHPACKING (lines 4940 - 4985) ===');
console.log(lines.slice(4940, 4985).map((l, i) => `${4941 + i}: ${l}`).join('\n'));

console.log('\n=== TABLE HEADERS (lines 13930 - 13970) ===');
console.log(lines.slice(13930, 13970).map((l, i) => `${13931 + i}: ${l}`).join('\n'));

console.log('\n=== TABLE ROW CELLS (lines 13990 - 14050) ===');
console.log(lines.slice(13990, 14050).map((l, i) => `${13991 + i}: ${l}`).join('\n'));
