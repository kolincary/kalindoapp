const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

function findLines(query) {
  const results = [];
  lines.forEach((line, idx) => {
    if (line.includes(query)) {
      results.push(`Line ${idx + 1}: ${line.trim().slice(0, 100)}`);
    }
  });
  return results;
}

console.log('=== GUDANG_PENDING in AdminDashboard ===');
console.log(findLines('GUDANG_PENDING').join('\n'));

console.log('\n=== LEADER_2_DATA in AdminDashboard ===');
console.log(findLines('LEADER_2_DATA').join('\n'));

console.log('\n=== Global Search functions ===');
console.log(findLines('handleGlobalSearch').join('\n'));
console.log(findLines('scanned_items').slice(0, 10).join('\n'));
