const fs = require('fs');
const path = require('path');

function searchInDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        searchInDir(fullPath);
      }
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.jsx') || entry.name.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (line.includes("from('scanned_items'") || line.includes('from("scanned_items"') || line.includes("from('leader_scan_2'") || line.includes("from('batches'") || line.includes("canceling statement due to statement timeout")) {
          console.log(`${fullPath}:${idx+1}: ${line.trim()}`);
        }
      });
    }
  }
}

searchInDir('.');
