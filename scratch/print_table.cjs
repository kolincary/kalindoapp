const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

console.log('=== TABLE HEADERS (Lines 13850 - 13960) ===');
console.log(lines.slice(13850, 13960).map((l, i) => `${13851 + i}: ${l}`).join('\n'));

console.log('\n=== TABLE ROW BODY (Lines 13960 - 14070) ===');
console.log(lines.slice(13960, 14070).map((l, i) => `${13961 + i}: ${l}`).join('\n'));
