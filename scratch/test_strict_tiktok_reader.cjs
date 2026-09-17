const XLSX = require('xlsx');

function extractTiktokDatePattern(str) {
   if (!str && str !== 0) return '';
   const s = String(str).trim();

   // 1. Match DD/MM/YYYY or DD-MM-YYYY (e.g. 16/09/2026 23:59:13 or 16-09-2026)
   const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
   if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
   }

   // 2. Match YYYY-MM-DD or YYYY/MM/DD (e.g. 2026-09-16 23:59:13)
   const ymdMatch = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
   if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, '0');
      const day = ymdMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
   }

   // 3. Match DD/MM/YY (e.g. 16/09/26)
   const shortYearMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})(?!\d)/);
   if (shortYearMatch) {
      const day = shortYearMatch[1].padStart(2, '0');
      const month = shortYearMatch[2].padStart(2, '0');
      const year = '20' + shortYearMatch[3];
      return `${year}-${month}-${day}`;
   }

   return '';
}

function parseTiktokExcelDate(val, rawCell) {
   if (val === null || val === undefined || val === '') return '';

   if (rawCell && rawCell.w) {
      const match = extractTiktokDatePattern(rawCell.w);
      if (match) return match;
   }

   if (typeof val === 'string') {
      const match = extractTiktokDatePattern(val);
      if (match) return match;
   }

   if (val instanceof Date && !isNaN(val.getTime())) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${month}-${day}`;
   }

   if (typeof val === 'number' && val > 30000) {
      const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(jsDate.getTime())) {
         const y = jsDate.getUTCFullYear();
         const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
         const d = String(jsDate.getUTCDate()).padStart(2, '0');
         return `${y}-${m}-${d}`;
      }
   }

   return '';
}

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

// Create mock sheet
const headerRow = Array(35).fill('');
headerRow[0] = 'Platform unique order ID';
headerRow[1] = 'Order ID';
headerRow[2] = 'SKU';
headerRow[29] = 'Order created time';
headerRow[30] = 'Package created time';

const ws_data = [
   ['Tiktok Export Header Info', ''],
   headerRow
];

for (let i = 1; i <= 8264; i++) {
   const row = Array(35).fill('');
   row[0] = `586106239984568${i.toString().padStart(4, '0')}`;
   row[1] = `SUB_${i}`;
   row[29] = `16/09/2026 ${i % 24}:${i % 60}:${i % 60}`;
   row[30] = `17/09/2026 01:00:00`;
   ws_data.push(row);
}

for (let i = 1; i <= 1000; i++) {
   const row = Array(35).fill('');
   row[0] = `586106999999999${i.toString().padStart(4, '0')}`;
   row[29] = `17/09/2026 10:00:00`;
   ws_data.push(row);
}

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(ws_data);
XLSX.utils.book_append_sheet(wb, ws, 'Orders');
const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

const wbRead = XLSX.read(buf, { type: 'buffer' });
const worksheet = wbRead.Sheets['Orders'];
const range = XLSX.utils.decode_range(worksheet['!ref']);

const { orderCol, dateCol, startRow } = findTiktokColumns(worksheet, range);
console.log('Cols:', { orderCol, dateCol, startRow });

const allRows = [];
for (let r = startRow; r <= range.e.r; r++) {
   const orderCell = worksheet[XLSX.utils.encode_cell({ r, c: orderCol })];
   const dateCell = worksheet[XLSX.utils.encode_cell({ r, c: dateCol })];

   if (!orderCell || orderCell.v === undefined || orderCell.v === null) continue;

   let orderId = String(orderCell.v).trim().replace(/^["']|["']$/g, '');
   if (orderId.endsWith('.0')) orderId = orderId.slice(0, -2);

   if (!orderId || ['platform unique order id', 'order id', 'barcode', 'nomor resi'].includes(orderId.toLowerCase())) {
      continue;
   }

   const dateStr = parseTiktokExcelDate(dateCell ? dateCell.v : null, dateCell);
   allRows.push({
      orderId,
      dateStr,
      rawDate: dateCell ? String(dateCell.w || dateCell.v) : ''
   });
}

console.log('Total rows read:', allRows.length);
const matching16 = allRows.filter(r => r.dateStr === '2026-09-16');
console.log('Matching 2026-09-16 count:', matching16.length);
const matching17 = allRows.filter(r => r.dateStr === '2026-09-17');
console.log('Matching 2026-09-17 count:', matching17.length);
