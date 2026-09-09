const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/AdminDashboard.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

for (let i = 11300; i < 11340; i++) {
  if (lines[i] && lines[i].includes("activeView === 'PACKING_2_DATA' && filterPackingStaff !== 'ALL' ? 'flex-col lg:flex-row' : 'flex-col'")) {
    console.log(`Found matching line ${i + 1}: ${lines[i]}`);
    lines[i] = '                           <div className={`w-full ${activeView === \'PACKING_2_DATA\' && filterPackingStaff !== \'ALL\' ? \'flex flex-col lg:flex-row items-start min-h-full\' : \'h-full flex flex-col overflow-hidden\'} bg-white dark:bg-gray-800`}>';
    if (lines[i + 2] && lines[i + 2].includes('className="flex-1 min-w-0 flex flex-col h-full overflow-hidden"')) {
      console.log(`Found matching line ${i + 3}: ${lines[i + 2]}`);
      lines[i + 2] = '                              <div className={`w-full ${activeView === \'PACKING_2_DATA\' && filterPackingStaff !== \'ALL\' ? \'lg:flex-1 min-w-0 flex flex-col\' : \'flex-1 min-w-0 flex flex-col h-full overflow-hidden\'}`}>';
    }
    break;
  }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done!');
