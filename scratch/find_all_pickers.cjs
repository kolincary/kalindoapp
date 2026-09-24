const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
const lines = fs.readFileSync(file, 'utf8').split('\n');

console.log("All date inputs & showPicker references in AdminDashboard.tsx:");
lines.forEach((l, i) => {
  if (l.includes('showPicker') || l.includes("type=\"date\"") || l.includes("type='date'")) {
    console.log(`${i + 1}: ${l.trim()}`);
  }
});
