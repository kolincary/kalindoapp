const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/AdminDashboard.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

for (let i = 11995; i < 12015; i++) {
  if (lines[i] && lines[i].includes('<div className="w-full flex flex-col bg-white dark:bg-gray-800">') && lines[i+1] && lines[i+1].includes('Batch Management Old')) {
    console.log(`Found line ${i+1}: ${lines[i]}`);
    lines.splice(i, 0, "                        {activeView === 'BATCH_DATA' && (");
    break;
  }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Fixed BATCH_DATA marker successfully!');
