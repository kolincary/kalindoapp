const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

function printRange(start, end, label) {
  console.log(`\n================= ${label} (Lines ${start}-${end}) =================`);
  console.log(lines.slice(start - 1, end).map((l, i) => `${start + i}: ${l}`).join('\n'));
}

printRange(1930, 2120, 'GLOBAL SEARCH FS & SUPABASE');
printRange(4760, 4850, 'BUILD PACKING QUERY');
