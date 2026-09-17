const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('globalSearchResults.map') || l.includes('globalSearchResultsFs.map')) {
    console.log(`Line ${i+1}: ${l}`);
  }
});
