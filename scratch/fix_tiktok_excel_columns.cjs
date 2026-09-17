const fs = require('fs');

const filePath = 'components/AdminDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// Find and replace processBatchGineeFiles and applyTiktokDateFilter
const startMarker = `   // Import TikTok Excel: reads Col A (Platform unique order ID) & Col AD (Order created time)
   const processBatchGineeFiles = async (files: File[]) => {`;

const endMarker = `   const handleReportFakeInvoices = async () => {`;

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
   console.error("ERROR: Markers not found for processBatchGineeFiles");
   process.exit(1);
}

const newProcessBlock = `   // Strict TikTok Column Finder: Kolom A (Platform unique order ID) & Kolom AD (Order created time)
   const findTiktokColumns = (worksheet: any, range: any) => {
      let orderCol = 0;  // Default Kolom A (index 0)
      let dateCol = 29;  // Default Kolom AD (index 29)
      let startRow = 1;  // Default baris data dimulai setelah baris header

      for (let r = 0; r <= Math.min(range.e.r, 5); r++) {
         for (let c = 0; c <= range.e.c; c++) {
            const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
            if (cell && cell.v) {
               const val = String(cell.v).trim().toLowerCase();
               // Strict match: Platform unique order ID (Kolom A)
               if (val === 'platform unique order id' || val.startsWith('platform unique order id')) {
                  orderCol = c;
                  startRow = Math.max(startRow, r + 1);
               }
               // Strict match: Order created time (Kolom AD)
               if (val === 'order created time' || val.startsWith('order created time')) {
                  dateCol = c;
                  startRow = Math.max(startRow, r + 1);
               }
            }
         }
      }

      return { orderCol, dateCol, startRow };
   };

   // Import TikTok Excel: strictly reads Col A (Platform unique order ID) & Col AD (Order created time)
   const processBatchGineeFiles = async (files: File[]) => {
      setIsImportingExcel(true);
      setImportProgress(0);
      setIsInvoiceImportModalOpen(false);

      const allRows: RawTiktokInvoiceRow[] = [];

      try {
         for (let i = 0; i < files.length; i++) {
            const file = files[i];

            await new Promise<void>((resolve, reject) => {
               const reader = new FileReader();
               reader.onload = (e) => {
                  try {
                     const data = new Uint8Array(e.target?.result as ArrayBuffer);
                     const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                     const firstSheetName = workbook.SheetNames[0];
                     const worksheet = workbook.Sheets[firstSheetName];

                     if (!worksheet) {
                        resolve();
                        return;
                     }

                     const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
                     const { orderCol, dateCol, startRow } = findTiktokColumns(worksheet, range);

                     for (let r = startRow; r <= range.e.r; r++) {
                        const orderCell = worksheet[XLSX.utils.encode_cell({ r, c: orderCol })];
                        const dateCell = worksheet[XLSX.utils.encode_cell({ r, c: dateCol })];

                        let orderId = '';
                        if (orderCell && orderCell.v !== undefined && orderCell.v !== null) {
                           orderId = String(orderCell.v).trim().replace(/^["']|["']$/g, '');
                           if (orderId.endsWith('.0')) {
                              orderId = orderId.slice(0, -2);
                           }
                        }

                        // Skip header names or empty Order IDs
                        if (!orderId || ['platform unique order id', 'order id', 'barcode', 'nomor resi', 'order no', 'no. pesanan'].includes(orderId.toLowerCase())) {
                           continue;
                        }

                        const rawDateVal = dateCell ? (dateCell.w || dateCell.v) : '';
                        const dateStr = parseTiktokExcelDate(dateCell ? dateCell.v : null, dateCell);

                        allRows.push({
                           orderId,
                           dateStr,
                           rawDate: String(rawDateVal || '')
                        });
                     }
                     resolve();
                  } catch (err) {
                     reject(err);
                  }
               };
               reader.onerror = (err) => reject(err);
               reader.readAsArrayBuffer(file);
            });

            setImportProgress(Math.round(((i + 1) / files.length) * 100));
         }

         setRawImportedTiktokRows(allRows);

         // Apply current date filter
         applyTiktokDateFilter(filterInvoiceDate, allRows);

      } catch (err) {
         alert("Gagal membaca file Excel TikTok: " + getSafeErrorMessage(err));
      } finally {
         setIsImportingExcel(false);
         setImportProgress(0);
      }
   };
`;

content = content.slice(0, startIndex) + newProcessBlock + '\n   ' + content.slice(endIndex);
console.log("✓ processBatchGineeFiles updated with strict findTiktokColumns");

// Also update UI badge to show filtered row count
const oldBadge = `{rawImportedTiktokRows.length > 0 && (
                           <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
                              Excel: {rawImportedTiktokRows.length} total
                           </span>
                        )}`;

const newBadge = `{rawImportedTiktokRows.length > 0 && (
                           <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
                              Excel: {rawImportedTiktokRows.length} total baris {filterInvoiceDate ? \`(\${rawImportedTiktokRows.filter(r => r.dateStr === filterInvoiceDate).length} baris cocok)\` : ''}
                           </span>
                        )}`;

if (content.includes(oldBadge)) {
   content = content.replace(oldBadge, newBadge);
   console.log("✓ UI Badge updated with detailed row count");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("SUCCESS: components/AdminDashboard.tsx patched with strict column reader!");
