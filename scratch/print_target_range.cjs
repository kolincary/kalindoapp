const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

for (let i = 14089; i < 14140; i++) {
  console.log(`${i}: ${lines[i]}`);
}
