const fs = require('fs');
const path = require('path');

const adminFile = path.resolve(__dirname, '../components/AdminDashboard.tsx');
const adminCode = fs.readFileSync(adminFile, 'utf8');

const lines = adminCode.split('\n');
lines.forEach((line, i) => {
  if (line.includes('syncCollectionName')) {
    console.log(`Line ${i + 1}: ${line}`);
  }
});
