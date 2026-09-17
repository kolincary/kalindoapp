const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

function inspectViewArrays() {
  lines.forEach((line, idx) => {
    if (line.includes('PACKING_DATA') && (line.includes('LEADER_2_DATA') || line.includes('GUDANG_PENDING') || line.includes('SORTIR_DATA'))) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
}

inspectViewArrays();
