const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');

const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('LEADER_2_DATA') && l.includes('SidebarItem')) {
    console.log(lines.slice(i - 2, i + 5).map((x, idx) => `${i - 2 + idx + 1}: ${JSON.stringify(x)}`).join('\n'));
  }
});
