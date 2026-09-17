const fs = require('fs');
const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('kalindoDataInput') || l.includes('handleCompareInvoices') || l.includes('handleImportInvoiceExcel') || l.includes('setGineeDataInput')) {
    console.log(`Line ${i+1}: ${l.trim()}`);
  }
});
