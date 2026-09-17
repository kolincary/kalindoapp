const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

function printRange(start, end, label) {
  console.log(`\n================= ${label} (Lines ${start}-${end}) =================`);
  console.log(lines.slice(start - 1, end).map((l, i) => `${start + i}: ${l}`).join('\n'));
}

printRange(4880, 5020, 'FETCH PACKING DATA');
printRange(7960, 8020, 'DELETE HANDLERS');
printRange(8480, 8530, 'VIEW STATS OR COUNTS');
printRange(10230, 10380, 'FILTER CONTROLS & HEADER');
printRange(13850, 14050, 'TABLE COLUMNS & HEADERS');
