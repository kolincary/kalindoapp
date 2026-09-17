const fs = require('fs');

const filePath = 'components/AdminDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update State Section
const oldStateBlock = `   // 14. Invoice Check State
   const [kalindoDataInput, setKalindoDataInput] = useState('');
   const [gineeDataInput, setGineeDataInput] = useState('');
   const [isComparingInvoice, setIsComparingInvoice] = useState(false);
   const [comparisonResult, setComparisonResult] = useState<any>(null);
   const [barcodeStaffMap, setBarcodeStaffMap] = useState<Record<string, string>>({});
   const [isReportingFake, setIsReportingFake] = useState(false);
   const [fakeReports, setFakeReports] = useState<any[]>([]);
   const [isLoadingFakeReports, setIsLoadingFakeReports] = useState(false);
   const [isImportingExcel, setIsImportingExcel] = useState(false);
   const [activeBarcodeLogBatchId, setActiveBarcodeLogBatchId] = useState<string | null>(null);
   const [isCopyingBarcodes, setIsCopyingBarcodes] = useState(false);
   const [isExportingGudangReport, setIsExportingGudangReport] = useState(false);
   const [isInvoiceImportModalOpen, setIsInvoiceImportModalOpen] = useState(false);`;

const newStateBlock = `   // 14. Invoice Check State (Kalindo vs TikTok)
   const [kalindoDataInput, setKalindoDataInput] = useState('');
   const [gineeDataInput, setGineeDataInput] = useState('');
   const [filterInvoiceDate, setFilterInvoiceDate] = useState<string>(() => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return \`\${y}-\${m}-\${d}\`;
   });
   interface RawTiktokInvoiceRow {
      orderId: string;
      dateStr: string;
      rawDate: string;
   }
   const [rawImportedTiktokRows, setRawImportedTiktokRows] = useState<RawTiktokInvoiceRow[]>([]);
   const [isComparingInvoice, setIsComparingInvoice] = useState(false);
   const [comparisonResult, setComparisonResult] = useState<any>(null);
   const [barcodeStaffMap, setBarcodeStaffMap] = useState<Record<string, string>>({});
   const [isReportingFake, setIsReportingFake] = useState(false);
   const [fakeReports, setFakeReports] = useState<any[]>([]);
   const [isLoadingFakeReports, setIsLoadingFakeReports] = useState(false);
   const [isImportingExcel, setIsImportingExcel] = useState(false);
   const [activeBarcodeLogBatchId, setActiveBarcodeLogBatchId] = useState<string | null>(null);
   const [isCopyingBarcodes, setIsCopyingBarcodes] = useState(false);
   const [isExportingGudangReport, setIsExportingGudangReport] = useState(false);
   const [isInvoiceImportModalOpen, setIsInvoiceImportModalOpen] = useState(false);`;

if (!content.includes(oldStateBlock)) {
   console.error("ERROR: oldStateBlock not found");
   process.exit(1);
}
content = content.replace(oldStateBlock, newStateBlock);
console.log("✓ State block replaced");

// 2. Update Invoice Logic (handleCompareInvoices, handlers, processBatchGineeFiles, helpers)
// Let's find the start of handleCompareInvoices up to handleReportFakeInvoices end
const logicStartMarker = `   const handleCompareInvoices = () => {`;
const logicEndMarker = `   // --- OJOL DATA LOGIC ---`;

const logicStartIndex = content.indexOf(logicStartMarker);
const logicEndIndex = content.indexOf(logicEndMarker);

if (logicStartIndex === -1 || logicEndIndex === -1) {
   console.error("ERROR: logic markers not found");
   process.exit(1);
}

const newLogicBlock = `   // --- TIKTOK DATE & EXCEL HELPER FUNCTIONS ---
   const extractTiktokDatePattern = (str: any): string => {
      if (!str && str !== 0) return '';
      const s = String(str).trim();

      // Match DD/MM/YYYY or DD-MM-YYYY (e.g. 16/09/2026 23:59:13)
      const dmyMatch = s.match(/^(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{4})/);
      if (dmyMatch) {
         const day = dmyMatch[1].padStart(2, '0');
         const month = dmyMatch[2].padStart(2, '0');
         const year = dmyMatch[3];
         return \`\${year}-\${month}-\${day}\`;
      }

      // Match YYYY-MM-DD or YYYY/MM/DD (e.g. 2026-09-16 23:59:13)
      const ymdMatch = s.match(/^(\\d{4})[\\/\\-](\\d{1,2})[\\/\\-](\\d{1,2})/);
      if (ymdMatch) {
         const year = ymdMatch[1];
         const month = ymdMatch[2].padStart(2, '0');
         const day = ymdMatch[3].padStart(2, '0');
         return \`\${year}-\${month}-\${day}\`;
      }

      return '';
   };

   const parseTiktokExcelDate = (val: any, rawCell?: any): string => {
      if (val === null || val === undefined || val === '') return '';

      // If formatted string is available in cell (rawCell.w)
      if (rawCell && rawCell.w) {
         const match = extractTiktokDatePattern(rawCell.w);
         if (match) return match;
      }

      // If string
      if (typeof val === 'string') {
         const match = extractTiktokDatePattern(val);
         if (match) return match;
      }

      // If JS Date
      if (val instanceof Date && !isNaN(val.getTime())) {
         const y = val.getFullYear();
         const m = String(val.getMonth() + 1).padStart(2, '0');
         const d = String(val.getDate()).padStart(2, '0');
         return \`\${y}-\${m}-\${d}\`;
      }

      // If Excel serial date number (typically > 30000)
      if (typeof val === 'number' && val > 30000) {
         const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
         if (!isNaN(jsDate.getTime())) {
            const y = jsDate.getUTCFullYear();
            const m = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
            const d = String(jsDate.getUTCDate()).padStart(2, '0');
            return \`\${y}-\${m}-\${d}\`;
         }
      }

      return '';
   };

   const applyTiktokDateFilter = (targetDate: string, rows: RawTiktokInvoiceRow[]) => {
      let filtered = rows;
      if (targetDate && targetDate.trim()) {
         const trimmedDate = targetDate.trim();
         filtered = rows.filter(r => r.dateStr === trimmedDate);
      }

      const uniqueOrderIds = Array.from(new Set(filtered.map(r => r.orderId))).filter(b => b);
      setGineeDataInput(uniqueOrderIds.join('\\n'));

      if (targetDate) {
         setSuccessToast(\`Memuat \${uniqueOrderIds.length} Order ID TikTok untuk tanggal \${targetDate} (dari \${rows.length} total baris)!\`);
      } else {
         setSuccessToast(\`Memuat seluruh \${uniqueOrderIds.length} Order ID TikTok (\${rows.length} baris file)!\`);
      }
   };

   const handleCompareInvoices = () => {
      setIsComparingInvoice(true);
      try {
         // Process Kalindo Data (Supports 1-column Order ID per line, or Barcode [Tab] Staff, or space separated)
         const kalindoLines = kalindoDataInput.split(/\\r?\\n/).map(l => l.trim()).filter(l => l);
         const tiktokLines = gineeDataInput.split(/\\r?\\n/).map(l => l.trim()).filter(l => l);

         const staffMap: Record<string, string> = {};
         const kalindoBarcodes: string[] = [];

         kalindoLines.forEach(line => {
            const cleanLine = line.replace(/^["']|["']$/g, '').trim();
            if (!cleanLine) return;

            let barcode = '';
            let staff = '';

            if (cleanLine.includes('\\t')) {
               const parts = cleanLine.split('\\t');
               barcode = parts[0]?.trim().replace(/^["']|["']$/g, '') || '';
               staff = parts.slice(1).join(' ').trim().replace(/^["']|["']$/g, '');
            } else {
               const parts = cleanLine.split(/\\s+/);
               if (parts.length > 1 && isNaN(Number(parts[1]))) {
                  barcode = parts[0]?.trim().replace(/^["']|["']$/g, '') || '';
                  staff = parts.slice(1).join(' ').trim().replace(/^["']|["']$/g, '');
               } else {
                  barcode = cleanLine;
                  staff = '';
               }
            }

            if (barcode) {
               kalindoBarcodes.push(barcode);
               if (staff) {
                  staffMap[barcode] = staff;
               }
            }
         });

         setBarcodeStaffMap(staffMap);

         // Extract clean unique TikTok Order IDs / Barcodes
         const extractBarcodes = (lines: string[]) => {
            return lines.map(line => {
               const clean = line.replace(/^["']|["']$/g, '').trim();
               if (clean.includes('\\t')) {
                  return clean.split('\\t')[0].trim().replace(/^["']|["']$/g, '');
               }
               return clean.split(/\\s+/)[0].trim().replace(/^["']|["']$/g, '');
            }).filter(b => b);
         };

         const tiktokBarcodes = extractBarcodes(tiktokLines);
         const uniqueTiktokBarcodes = Array.from(new Set(tiktokBarcodes));
         if (uniqueTiktokBarcodes.length !== tiktokBarcodes.length || gineeDataInput.includes('\\t')) {
            setGineeDataInput(uniqueTiktokBarcodes.join('\\n'));
         }

         const kalindoSet = new Set(kalindoBarcodes);
         const tiktokSet = new Set(uniqueTiktokBarcodes);

         const missingInTiktok = kalindoBarcodes.filter(b => !tiktokSet.has(b));
         const missingInKalindo = uniqueTiktokBarcodes.filter(b => !kalindoSet.has(b));

         const getDuplicates = (arr: string[]) => {
            const counts: Record<string, number> = {};
            arr.forEach(x => counts[x] = (counts[x] || 0) + 1);
            return Object.keys(counts).filter(x => counts[x] > 1);
         };

         setComparisonResult({
            missingInGinee: Array.from(new Set(missingInTiktok)),
            missingInKalindo: Array.from(new Set(missingInKalindo)),
            duplicatesKalindo: getDuplicates(kalindoBarcodes),
            duplicatesGinee: getDuplicates(uniqueTiktokBarcodes),
            totalKalindo: kalindoBarcodes.length,
            totalGinee: uniqueTiktokBarcodes.length
         });
      } catch (err) {
         alert("Comparison failed: " + getSafeErrorMessage(err));
      } finally {
         setIsComparingInvoice(false);
      }
   };

   const handleInvoiceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
         processBatchGineeFiles(Array.from(e.target.files));
      }
   };

   const handleInvoiceFileDrop = (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
         processBatchGineeFiles(Array.from(e.dataTransfer.files));
      }
   };

   // --- MASS SEARCH LOGIC ---
   const handleMassSearch = async () => {
      if (!massSearchInputText.trim()) {
         alert("Masukkan setidaknya satu barcode.");
         return;
      }
      setIsMassSearching(true);
      setMassSearchResults([]);
      setSelectedMassSearchIds([]);
      try {
         // Parse text input to extract barcodes
         const lines = massSearchInputText.split(/[\\n\\t\\r,;]+/);
         const barcodes = Array.from(new Set(lines.map(l => l.trim()).filter(l => l)));
         
         if (barcodes.length === 0) {
            alert("Tidak ada barcode valid yang ditemukan.");
            setIsMassSearching(false);
            return;
         }

         let allData: any[] = [];
         
         // Chunk the queries if there are too many barcodes (e.g. Supabase limit)
         const chunkSize = 100;
         for (let i = 0; i < barcodes.length; i += chunkSize) {
            const chunk = barcodes.slice(i, i + chunkSize);
            let query = supabase.from('scans').select('*').in('barcode', chunk);

            if (massSearchRoles.length > 0) {
               const targetDbRoles: string[] = [];
               if (massSearchRoles.includes('ALL')) {
                  // Don't filter by role, take all
               }
               if (massSearchRoles.includes('SORTIR')) targetDbRoles.push('SORTIR');
               if (massSearchRoles.includes('PACKING')) targetDbRoles.push('PACKING');
               if (massSearchRoles.includes('PACKING_2')) targetDbRoles.push('PACKING_2');
               if (massSearchRoles.includes('LOGISTIK')) targetDbRoles.push('LOGISTIK', 'OJOL', 'SORTIR');

               if (targetDbRoles.length > 0) {
                  query = query.in('role', targetDbRoles);
               }
            }

            const { data, error } = await query.order('timestamp', { ascending: false });

            if (error) throw error;
            if (data) {
               allData = [...allData, ...data];
            }
         }

         setMassSearchResults(allData);
         if (allData.length === 0) {
            alert("Tidak ada data ditemukan untuk barcode tersebut.");
         }
      } catch (err: any) {
         alert("Pencarian massal gagal: " + err.message);
      } finally {
         setIsMassSearching(false);
      }
   };

   const handleCopyMassSearchResults = async () => {
      if (selectedMassSearchIds.length === 0) return;
      
      const itemsToCopy = massSearchResults.filter(item => selectedMassSearchIds.includes(item.id));
      
      const uniqueItems = [];
      const seenBarcodes = new Set();
      for (const item of itemsToCopy) {
         if (!seenBarcodes.has(item.barcode)) {
             seenBarcodes.add(item.barcode);
             uniqueItems.push(item);
         }
      }

      const formattedData = uniqueItems.map(item => item.barcode).join('\\n');
      
      const success = await copyToClipboard(formattedData);
      if (success) {
         setSuccessToast(\`Berhasil menyalin \${uniqueItems.length} data!\`);
      } else {
         alert("Gagal menyalin ke clipboard. Silakan coba lagi.");
      }
   };

   // Import TikTok Excel: reads Col A (Platform unique order ID) & Col AD (Order created time)
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

                     // Default target columns:
                     // Col A = index 0 (Platform unique order ID)
                     // Col AD = index 29 (Order created time)
                     let orderCol = 0;
                     let dateCol = 29;
                     let startRow = 1; // Default header is at row 0 or 1, start data at row 1 or 2

                     // Auto-detect headers in first 5 rows
                     for (let r = 0; r <= Math.min(range.e.r, 5); r++) {
                        for (let c = 0; c <= range.e.c; c++) {
                           const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
                           if (cell && cell.v) {
                              const headerText = String(cell.v).trim().toLowerCase();
                              if (headerText.includes('platform unique order id') || 
                                  headerText.includes('unique order id') ||
                                  headerText.includes('order id') || 
                                  headerText.includes('no. pesanan') || 
                                  headerText.includes('nomor pesanan')) {
                                 orderCol = c;
                                 startRow = Math.max(startRow, r + 1);
                              }
                              if (headerText.includes('order created time') || 
                                  headerText.includes('created time') || 
                                  headerText.includes('waktu dibuat') || 
                                  headerText.includes('waktu pesanan')) {
                                 dateCol = c;
                                 startRow = Math.max(startRow, r + 1);
                              }
                           }
                        }
                     }

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

                        // Ignore header labels or empty strings
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

         // Apply current date filter to populate textarea
         applyTiktokDateFilter(filterInvoiceDate, allRows);

      } catch (err) {
         alert("Gagal membaca file Excel TikTok: " + getSafeErrorMessage(err));
      } finally {
         setIsImportingExcel(false);
         setImportProgress(0);
      }
   };

   const handleReportFakeInvoices = async () => {
      if (!comparisonResult || comparisonResult.missingInGinee.length === 0) return;

      setIsReportingFake(true);
      try {
         const reports = comparisonResult.missingInGinee.map((barcode: string) => ({
            barcode,
            staff_name: barcodeStaffMap[barcode] || 'Unknown',
            status: 'PENDING'
         }));

         const { error } = await supabase.from('fake_invoice_reports').insert(reports);
         if (error) throw error;

         setSuccessToast(\`Berhasil melaporkan \${reports.length} indikasi invoice palsu!\`);
         setKalindoDataInput('');
         setGineeDataInput('');
         setComparisonResult(null);
      } catch (err) {
         alert("Gagal mengirim laporan: " + getSafeErrorMessage(err));
      } finally {
         setIsReportingFake(false);
      }
   };

`;

content = content.slice(0, logicStartIndex) + newLogicBlock + content.slice(logicEndIndex);
console.log("✓ Logic block replaced");

// 3. Update Overlay Text & Tab Shortcut
content = content.replace('Importing Ginee Data...', 'Importing Data TikTok...');
content = content.replace('<span>Cek Ginee</span>', '<span>Cek TikTok</span>');

// 4. Update CHECK_INVOICE JSX block (lines ~18506 to ~18677)
const checkInvoiceStartMarker = `{activeView === 'CHECK_INVOICE' && (`;
const checkInvoiceEndMarker = `{/* SYMBOLS VIEW */}`;

const ciStartIndex = content.indexOf(checkInvoiceStartMarker);
const ciEndIndex = content.indexOf(checkInvoiceEndMarker);

if (ciStartIndex === -1 || ciEndIndex === -1) {
   console.error("ERROR: CHECK_INVOICE JSX markers not found");
   process.exit(1);
}

const newCheckInvoiceJsx = `{activeView === 'CHECK_INVOICE' && (
   <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 shadow-sm">
         <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3 sm:gap-4">
               <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800">
                  <FileText size={22} className="sm:w-6 sm:h-6" />
               </div>
               <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                     Check Invoices (Advanced)
                     <span className="text-[11px] font-extrabold px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                        Kalindo vs TikTok
                     </span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bandingkan data scan Kalindo vs TikTok Shop dengan filter tanggal otomatis.</p>
               </div>
            </div>

            {/* Filter Tanggal & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
               {/* Filter Tanggal Control */}
               <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner">
                  <Calendar size={15} className="text-indigo-500 shrink-0" />
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">Filter Tanggal TikTok:</span>
                  <input
                     type="date"
                     value={filterInvoiceDate}
                     onChange={(e) => {
                        const newDate = e.target.value;
                        setFilterInvoiceDate(newDate);
                        if (rawImportedTiktokRows.length > 0) {
                           applyTiktokDateFilter(newDate, rawImportedTiktokRows);
                        }
                     }}
                     className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {filterInvoiceDate ? (
                     <button
                        onClick={() => {
                           setFilterInvoiceDate('');
                           if (rawImportedTiktokRows.length > 0) {
                              applyTiktokDateFilter('', rawImportedTiktokRows);
                           }
                        }}
                        className="text-[10px] font-bold text-gray-400 hover:text-red-500 px-1.5 py-0.5 rounded transition-colors"
                        title="Tampilkan Semua Tanggal"
                     >
                        ✕ Semua
                     </button>
                  ) : (
                     <button
                        onClick={() => {
                           const today = getTodayString();
                           setFilterInvoiceDate(today);
                           if (rawImportedTiktokRows.length > 0) {
                              applyTiktokDateFilter(today, rawImportedTiktokRows);
                           }
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded transition-colors"
                     >
                        Hari Ini
                     </button>
                  )}
               </div>

               <button
                  onClick={() => setIsInvoiceImportModalOpen(true)}
                  disabled={isImportingExcel}
                  className="flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl text-xs sm:text-sm font-bold hover:bg-green-100 dark:hover:bg-green-900/50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
               >
                  {isImportingExcel ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  Import Excel TikTok
               </button>

               <button
                  onClick={handleCompareInvoices}
                  disabled={isComparingInvoice || !kalindoDataInput || !gineeDataInput}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
               >
                  <CheckCircle2 size={16} /> Compare
               </button>

               <button
                  title="Reset Semua Data"
                  onClick={() => {
                     setKalindoDataInput('');
                     setGineeDataInput('');
                     setComparisonResult(null);
                     setBarcodeStaffMap({});
                     setRawImportedTiktokRows([]);
                  }}
                  className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
               >
                  <RotateCcw size={18} />
               </button>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
         <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* KALINDO INPUT */}
               <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                     <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-blue-500" /> Data Kalindo (Paste from Excel)
                     </label>
                     <div className="flex items-center gap-2">
                        <button
                           onClick={() => setKalindoDataInput('')}
                           className="text-[10px] font-bold px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors flex items-center gap-1 text-xs"
                           title="Clear Input"
                        >
                           <Eraser size={12} /> Clear
                        </button>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
                           {kalindoDataInput.split('\\n').filter(l => l.trim()).length} baris
                        </span>
                     </div>
                  </div>
                  <textarea
                     value={kalindoDataInput}
                     onChange={(e) => setKalindoDataInput(e.target.value)}
                     placeholder={"Format: 1 baris per order ID\\nContoh:\\n586106239984568227\\n586106246211339790\\n586106209665189204\\n\\n(Atau format Barcode [Tab] Staff)"}
                     className="w-full h-48 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs sm:text-sm transition-all shadow-inner custom-scrollbar text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-[10px] text-gray-400 italic px-1">Mendukung copy-paste 1 kolom order ID langsung dari Excel atau format Barcode + Staff.</p>
               </div>

               {/* TIKTOK INPUT */}
               <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                     <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Info size={14} className="text-indigo-500" /> Data TIKTOK (Unique List)
                     </label>
                     <div className="flex items-center gap-2">
                        {rawImportedTiktokRows.length > 0 && (
                           <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
                              Excel: {rawImportedTiktokRows.length} total
                           </span>
                        )}
                        <button
                           onClick={() => setGineeDataInput('')}
                           className="text-[10px] font-bold px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors flex items-center gap-1 text-xs"
                           title="Clear Input"
                        >
                           <Eraser size={12} /> Clear
                        </button>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800">
                           {gineeDataInput.split('\\n').filter(l => l.trim()).length} unique order ID
                        </span>
                     </div>
                  </div>
                  <textarea
                     value={gineeDataInput}
                     onChange={(e) => setGineeDataInput(e.target.value)}
                     placeholder="Daftar order ID TikTok (paste per baris atau gunakan tombol Import Excel di atas)..."
                     className="w-full h-48 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-xs sm:text-sm transition-all shadow-inner custom-scrollbar text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-[10px] text-gray-400 italic px-1">Otomatis tersaring berdasarkan Filter Tanggal TikTok yang dipilih.</p>
               </div>
            </div>

            {/* RESULTS */}
            {comparisonResult && (
               <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Total Kalindo</p>
                        <p className="text-2xl font-black text-blue-600">{comparisonResult.totalKalindo}</p>
                     </div>
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Total TikTok</p>
                        <p className="text-2xl font-black text-indigo-600">{comparisonResult.totalGinee}</p>
                     </div>
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-red-50 dark:border-red-900/10 shadow-sm">
                        <p className="text-[10px] font-bold text-red-500 uppercase">Missing In TikTok</p>
                        <p className="text-2xl font-black text-red-600">{comparisonResult.missingInGinee.length}</p>
                     </div>
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-yellow-50 dark:border-yellow-900/10 shadow-sm">
                        <p className="text-[10px] font-bold text-yellow-500 uppercase">Dupes Kalindo</p>
                        <p className="text-2xl font-black text-yellow-600">{comparisonResult.duplicatesKalindo.length}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-white dark:bg-gray-800 rounded-3xl border border-red-100 dark:border-red-900/30 overflow-hidden shadow-xl shadow-red-500/5">
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex justify-between items-center">
                           <h4 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 text-sm sm:text-base">
                              <AlertCircle size={18} />
                              Indikasi Invoice Palsu ({comparisonResult.missingInGinee.length})
                           </h4>
                           <div className="flex gap-2">
                              <button
                                 onClick={handleReportFakeInvoices}
                                 disabled={isReportingFake || comparisonResult.missingInGinee.length === 0}
                                 className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-red-600/20"
                              >
                                 {isReportingFake ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                 Kirim Laporan
                              </button>
                              <button
                                 onClick={async () => {
                                    const text = comparisonResult.missingInGinee.map((b: string) => b).join('\\n');
                                    const success = await copyToClipboard(text);
                                    if (success) setSuccessToast("Copied barcodes only!");
                                 }}
                                 className="px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-red-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all flex items-center gap-1.5"
                              >
                                 <Copy size={12} /> Copy Barcode
                              </button>
                           </div>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto divide-y divide-red-50 dark:divide-red-900/10 custom-scrollbar">
                           {comparisonResult.missingInGinee.length === 0 ? (
                              <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-2">
                                 <CheckCircle2 size={32} className="text-green-500 opacity-50" />
                                 <p className="text-sm">Semua barcode Kalindo terdaftar di TikTok.</p>
                              </div>
                           ) : (
                              comparisonResult.missingInGinee.map((b: string) => (
                                 <div key={b} className="p-3 flex justify-between items-center hover:bg-red-50/30 dark:hover:bg-red-950/20 transition-colors">
                                    <div>
                                       <span className="font-mono font-bold text-sm text-gray-800 dark:text-gray-200">{b}</span>
                                       {barcodeStaffMap[b] && <p className="text-[10px] text-gray-400 font-bold uppercase">{barcodeStaffMap[b]}</p>}
                                    </div>
                                    <button onClick={() => copyToClipboard(b)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all"><Copy size={14} /></button>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>

                     <div className="bg-white dark:bg-gray-800 rounded-3xl border border-yellow-100 dark:border-yellow-900/30 overflow-hidden">
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-100 dark:border-yellow-900/30">
                           <h4 className="font-bold text-yellow-700 dark:text-yellow-500 text-sm sm:text-base">Duplicate di Kalindo ({comparisonResult.duplicatesKalindo.length})</h4>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto p-4 custom-scrollbar">
                           {comparisonResult.duplicatesKalindo.length === 0 ? (
                              <p className="text-center text-gray-400 text-sm py-4 italic">No duplicates found.</p>
                           ) : (
                              <div className="flex flex-wrap gap-2">
                                 {comparisonResult.duplicatesKalindo.map((b: string) => (
                                    <span key={b} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs font-mono font-bold border border-yellow-200">{b}</span>
                                 ))}
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   </div>
)}

                        `;

content = content.slice(0, ciStartIndex) + newCheckInvoiceJsx + content.slice(ciEndIndex);
console.log("✓ CHECK_INVOICE JSX replaced");

// 5. Update Modal Import (around lines 21516-21555)
const modalStartMarker = `            isInvoiceImportModalOpen && (`;
const modalEndMarker = `            isBatchCopyModalOpen && (`;

const modalStartIndex = content.indexOf(modalStartMarker);
const modalEndIndex = content.indexOf(modalEndMarker);

if (modalStartIndex === -1 || modalEndIndex === -1) {
   console.error("ERROR: Modal markers not found");
   process.exit(1);
}

const newModalJsx = `            isInvoiceImportModalOpen && (
               <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsInvoiceImportModalOpen(false)}></div>
                  <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl relative z-10 p-6 sm:p-8 animate-[popIn_0.2s_ease-out]">
                     <div className="flex justify-between items-center mb-6">
                        <div>
                           <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Import Data TikTok</h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400">Upload file Excel TikTok Shop (.xlsx, .xls)</p>
                        </div>
                        <button onClick={() => setIsInvoiceImportModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><X size={20} /></button>
                     </div>

                     {/* Date Filter Preview inside Modal */}
                     <div className="mb-4 p-3 bg-indigo-50/70 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                           <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
                           <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Filter Tanggal:</span>
                        </div>
                        <input
                           type="date"
                           value={filterInvoiceDate}
                           onChange={(e) => setFilterInvoiceDate(e.target.value)}
                           className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                     </div>

                     <div
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={handleInvoiceFileDrop}
                        className="border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl p-8 sm:p-10 text-center transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/30 group cursor-pointer relative"
                     >
                        <input
                           type="file"
                           multiple
                           accept=".xlsx, .xls"
                           onChange={handleInvoiceFileSelect}
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                           <UploadCloud size={36} />
                        </div>
                        <p className="font-bold text-gray-700 dark:text-gray-300 mb-1 text-sm sm:text-base">Drag & Drop file Excel TikTok di sini</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">atau klik untuk memilih file dari komputer</p>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-4 font-mono bg-indigo-100 dark:bg-indigo-900/50 inline-block px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                           Membaca Kolom A (Platform unique order ID) & Kolom AD (Order created time)
                        </p>
                     </div>

                     <div className="mt-6 flex justify-end">
                        <button onClick={() => setIsInvoiceImportModalOpen(false)} className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Tutup</button>
                     </div>
                  </div>
               </div>
            )
         }

         {
`;

content = content.slice(0, modalStartIndex) + newModalJsx + content.slice(modalEndIndex);
console.log("✓ Modal JSX replaced");

fs.writeFileSync(filePath, content, 'utf8');
console.log("SUCCESS: components/AdminDashboard.tsx patched successfully!");
