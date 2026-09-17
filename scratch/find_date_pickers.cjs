const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('type="date"') || l.includes("type='date'")) {
    console.log((i+1) + ': ' + l);
  }
});
