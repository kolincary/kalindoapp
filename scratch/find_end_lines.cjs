const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('components/AdminDashboard.tsx');
const rawContent = fs.readFileSync(targetPath, 'utf8');
const lines = rawContent.split(/\r?\n/);

for (let i = 11615; i <= 11630; i++) {
   console.log((i + 1) + ': ' + JSON.stringify(lines[i]));
}
