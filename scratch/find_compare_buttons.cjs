const fs = require('fs');

const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

let inCompare = false;
lines.forEach((line, idx) => {
  if (line.includes("activeView === 'COMPARE_LOGISTIK'")) inCompare = true;
  if (line.includes("activeView === 'COMPARE_PACKING_PICKER'")) inCompare = false;
  if (inCompare && (line.includes('button') || line.includes('onClick') || line.includes('Rentang') || line.includes('rentang') || line.includes('Cari') || line.includes('cari'))) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
