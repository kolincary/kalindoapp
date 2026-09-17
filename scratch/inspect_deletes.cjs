const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

function printRange(start, end, label) {
  console.log(`\n================= ${label} (Lines ${start}-${end}) =================`);
  console.log(lines.slice(start - 1, end).map((l, i) => `${start + i}: ${l}`).join('\n'));
}

printRange(4680, 4725, 'DELETE/MOVE ITEMS IN PACKING VIEW');
printRange(7960, 8020, 'EXECUTE BULK DELETE MODAL');
printRange(20420, 20470, 'BULK ACTION BAR DELETE');
