const fs = require('fs');

const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('>Cari<') || line.includes('> Cari') || line.includes('"Cari"') || line.includes("'Cari'")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
