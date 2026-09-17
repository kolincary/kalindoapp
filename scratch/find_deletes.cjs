const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

function findDeleteLogic() {
  lines.forEach((line, idx) => {
    if (line.includes('delete') || line.includes('DELETE') || line.includes('handleBulkDelete') || line.includes('handleDelete')) {
      if (line.includes('from(') || line.includes('delete(') || line.includes('deleteDoc') || line.includes('activeView')) {
        console.log(`${idx + 1}: ${line.trim()}`);
      }
    }
  });
}

findDeleteLogic();
