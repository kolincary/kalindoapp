const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/AdminDashboard.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Line 12006 is index 12005 (0-based)
console.log('Line 12005:', lines[12005]);
console.log('Line 12006:', lines[12006]);
console.log('Line 12007:', lines[12007]);

lines[12005] = "                        {activeView === 'BATCH_DATA' && (";

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Set line 12006 to {activeView === \'BATCH_DATA\' && (');
