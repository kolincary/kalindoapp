const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('components/AdminDashboard.tsx');
const rawContent = fs.readFileSync(targetPath, 'utf8');
const lines = rawContent.split(/\r?\n/);

console.log('Total lines:', lines.length);

lines.forEach((line, idx) => {
   if (line.includes("activeView === 'PACKING_DATA'") && line.includes("activeView === 'PACKING_2_DATA'") && line.includes("GUDANG_BUNDLING")) {
      console.log('Found main view start line at:', idx + 1);
      console.log('Line content:', JSON.stringify(line));
      console.log('Next 5 lines:');
      for (let j = 1; j <= 5; j++) {
         console.log((idx + 1 + j) + ': ' + JSON.stringify(lines[idx + j]));
      }
   }
});
