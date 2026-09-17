const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

function printRange(start, end, label) {
  console.log(`\n================= ${label} (Lines ${start}-${end}) =================`);
  console.log(lines.slice(start - 1, end).map((l, i) => `${start + i}: ${l}`).join('\n'));
}

printRange(120, 145, 'MENU_ITEMS');
printRange(220, 245, 'VIEW_PERMISSIONS');
printRange(1930, 2060, 'GLOBAL SEARCH FS & SUPABASE');
printRange(4760, 4835, 'BUILD PACKING QUERY');
printRange(9930, 9985, 'SIDEBAR ITEMS');
