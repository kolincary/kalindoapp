const XLSX = require('xlsx');

function findTiktokColumns(worksheet, range) {
   let orderCol = 0; // Default Column A
   let dateCol = 29; // Default Column AD
   let startRow = 1;

   for (let r = 0; r <= Math.min(range.e.r, 5); r++) {
      for (let c = 0; c <= range.e.c; c++) {
         const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
         if (cell && cell.v) {
            const val = String(cell.v).trim().toLowerCase();
            if (val === 'platform unique order id' || val.startsWith('platform unique order id')) {
               orderCol = c;
               startRow = Math.max(startRow, r + 1);
            }
            if (val === 'order created time' || val.startsWith('order created time')) {
               dateCol = c;
               startRow = Math.max(startRow, r + 1);
            }
         }
      }
   }

   return { orderCol, dateCol, startRow };
}

// Create mock sheet where Col A has Platform unique order ID, Col B has Order ID, Col AD has Order created time, Col AE has Package created time
const headerRow = Array(35).fill('');
headerRow[0] = 'Platform unique order ID';
headerRow[1] = 'Order ID';
headerRow[2] = 'SKU';
headerRow[29] = 'Order created time';
headerRow[30] = 'Package created time';

const ws_data = [
   ['Tiktok Export Title', ''],
   headerRow,
   ['586106239984568001', 'SUB1', 'SKU1', ...Array(26).fill(''), '16/09/2026 23:59:13', '17/09/2026 02:00:00']
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(ws_data);
XLSX.utils.book_append_sheet(wb, ws, 'Orders');
const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

const wbRead = XLSX.read(buf, { type: 'buffer' });
const worksheet = wbRead.Sheets['Orders'];
const range = XLSX.utils.decode_range(worksheet['!ref']);

const result = findTiktokColumns(worksheet, range);
console.log('Result:', result);
console.log('Col letter for orderCol:', XLSX.utils.encode_col(result.orderCol));
console.log('Col letter for dateCol:', XLSX.utils.encode_col(result.dateCol));
