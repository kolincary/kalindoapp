const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

function findViewPatterns() {
  const matches = [];
  lines.forEach((line, idx) => {
    if (
      line.includes('GUDANG_PENDING') ||
      line.includes('LEADER_2_DATA') ||
      line.includes('view_leader_2') ||
      line.includes('view_gudang')
    ) {
      matches.push({ lineNum: idx + 1, line: line.trim() });
    }
  });
  return matches;
}

const res = findViewPatterns();
console.log(`Total occurrences: ${res.length}`);
res.forEach(r => console.log(`${r.lineNum}: ${r.line.slice(0, 120)}`));
