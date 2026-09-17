const fs = require('fs');

const filePath = 'components/AdminDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update State block
const oldStateBlock = `   // 14. Invoice Check State (Kalindo vs TikTok)
   const [kalindoDataInput, setKalindoDataInput] = useState('');
   const [gineeDataInput, setGineeDataInput] = useState('');
   interface DedupInvoiceResult {
      initialTiktokCount: number;
      kalindoCount: number;
      removedCount: number;
      remainingItems: string[];
   }
   const [dedupResult, setDedupResult] = useState<DedupInvoiceResult | null>(null);
   const [dedupTableSearch, setDedupTableSearch] = useState('');
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
   interface DedupInvoiceResult {
      initialTiktokCount: number;
      kalindoCount: number;
      removedCount: number;
      remainingItems: string[];
   }
   const [dedupResult, setDedupResult] = useState<DedupInvoiceResult | null>(null);
   const [dedupTableSearch, setDedupTableSearch] = useState('');
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
console.log("✓ State block updated with filterInvoiceDate and rawImportedTiktokRows");

// 2. Update Logic Block (TikTok helpers, date parser, date filter, remove dups, processBatchGineeFiles)
const logicStartMarker = `   // --- TIKTOK DATE & EXCEL HELPER FUNCTIONS ---`;
const logicEndMarker = `   const handleReportFakeInvoices = async () => {`;

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

      // 1. Match DD/MM/YYYY or DD-MM-YYYY (e.g. 16/09/2026 23:59:13)
      const dmyMatch = s.match(/^(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{4})/);
      if (dmyMatch) {
         const day = dmyMatch[1].padStart(2, '0');
         const month = dmyMatch[2].padStart(2, '0');
         const year = dmyMatch[3];
         return \`\${year}-\${month}-\${day}\`;
      }

      // 2. Match YYYY-MM-DD or YYYY/MM/DD (e.g. 2026-09-16 23:59:13)
      const ymdMatch = s.match(/^(\\d{4})[\\/\\-](\\d{1,2})[\\/\\-](\\d{1,2})/);
      if (ymdMatch) {
         const year = ymdMatch[1];
         const month = ymdMatch[2].padStart(2, '0');
         const day = ymdMatch[3].padStart(2, '0');
         return \`\${year}-\${month}-\${day}\`;
      }

      // 3. Match DD/MM/YY (e.g. 16/09/26)
      const shortYearMatch = s.match(/^(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{2})(?!\\d)/);
      if (shortYearMatch) {
         const day = shortYearMatch[1].padStart(2, '0');
         const month = shortYearMatch[2].padStart(2, '0');
         const year = '20' + shortYearMatch[3];
         return \`\${year}-\${month}-\${day}\`;
      }

      return '';
   };

   const parseTiktokExcelDate = (val: any, rawCell?: any): string => {
      if (val === null || val === undefined || val === '') return '';

      // Try formatted string in cell (rawCell.w)
      if (rawCell && rawCell.w) {
         const match = extractTiktokDatePattern(rawCell.w);
         if (match) return match;
      }

      // Try raw string
      if (typeof val === 'string') {
         const match = extractTiktokDatePattern(val);
         if (match) return match;
      }

      // Try JS Date
      if (val instanceof Date && !isNaN(val.getTime())) {
         const y = val.getFullYear();
         const m = String(val.getMonth() + 1).padStart(2, '0');
         const d = String(val.getDate()).padStart(2, '0');
         return \`\${y}-\${m}-\${d}\`;
      }

      // Try Excel serial date number
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

   const findTiktokColumns = (worksheet: any, range: any) => {
      let orderCol = 0;  // Default Kolom A (index 0)
      let dateCol = 29;  // Default Kolom AD (index 29)
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
   };

   const applyTiktokDateFilter = (targetDate: string, rows: RawTiktokInvoiceRow[]) => {
      let filtered = rows;
      if (targetDate && targetDate.trim()) {
         const trimmed = targetDate.trim();
         filtered = rows.filter(r => r.dateStr === trimmed);
      }

      const uniqueOrderIds = Array.from(new Set(filtered.map(r => r.orderId))).filter(b => b);
      setGineeDataInput(uniqueOrderIds.join('\\n'));

      if (targetDate) {
         setSuccessToast(\`Memuat \${uniqueOrderIds.length} Order ID unik (\${filtered.length} baris) TikTok untuk tanggal \${targetDate}!\`);
      } else {
         setSuccessToast(\`Memuat seluruh \${uniqueOrderIds.length} Order ID unik (\${rows.length} total baris file)!\`);
      }
   };

   const handleRemoveKalindoFromTiktok = () => {
      const kalindoLines = kalindoDataInput.split(/\\r?\\n/).map(l => l.trim()).filter(l => l);
      const tiktokLines = gineeDataInput.split(/\\r?\\n/).map(l => l.trim()).filter(l => l);

      if (tiktokLines.length === 0) {
         alert("Data TIKTOK masih kosong. Silakan paste data atau gunakan Import Excel TikTok.");
         return;
      }
      if (kalindoLines.length === 0) {
         alert("Data Kalindo masih kosong. Silakan paste data Kalindo terlebih dahulu.");
         return;
      }

      // Extract Kalindo barcodes/order IDs into Set
      const kalindoSet = new Set<string>();
      kalindoLines.forEach(line => {
         const clean = line.replace(/^["']|["']$/g, '').trim();
         if (!clean) return;
         if (clean.includes('\\t')) {
            const code = clean.split('\\t')[0].trim().replace(/^["']|["']$/g, '');
            if (code) kalindoSet.add(code);
         } else {
            const parts = clean.split(/\\s+/);
            const code = parts[0]?.trim().replace(/^["']|["']$/g, '');
            if (code) kalindoSet.add(code);
         }
      });

      // Extract unique TikTok barcodes
      const uniqueTiktokList = Array.from(new Set(tiktokLines.map(line => {
         const clean = line.replace(/^["']|["']$/g, '').trim();
         if (clean.includes('\\t')) return clean.split('\\t')[0].trim().replace(/^["']|["']$/g, '');
         return clean.split(/\\s+/)[0].trim().replace(/^["']|["']$/g, '');
      }).filter(b => b)));

      // Remaining TikTok items that are NOT in Kalindo
      const remainingItems = uniqueTiktokList.filter(id => !kalindoSet.has(id));
      const removedCount = uniqueTiktokList.length - remainingItems.length;

      // Update Dedup Result
      setDedupResult({
         initialTiktokCount: uniqueTiktokList.length,
         kalindoCount: kalindoSet.size,
         removedCount,
         remainingItems
      });

      // Update textarea Data TikTok with remaining items
      setGineeDataInput(remainingItems.join('\\n'));

      setSuccessToast(\`Berhasil menghapus \${removedCount} data duplikat! Sisa: \${remainingItems.length} Order ID TikTok.\`);
   };

   const handleCompareInvoices = () => {
      handleRemoveKalindoFromTiktok();
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
         const lines = massSearchInputText.split(/[\\n\\t\\r,;]+/);
         const barcodes = Array.from(new Set(lines.map(l => l.trim()).filter(l => l)));
         
         if (barcodes.length === 0) {
            alert("Tidak ada barcode valid yang ditemukan.");
            setIsMassSearching(false);
            return;
         }

         let allData: any[] = [];
         const chunkSize = 100;
         for (let i = 0; i < barcodes.length; i += chunkSize) {
            const chunk = barcodes.slice(i, i + chunkSize);
            let query = supabase.from('scans').select('*').in('barcode', chunk);

            if (massSearchRoles.length > 0) {
               const targetDbRoles: string[] = [];
               if (massSearchRoles.includes('ALL')) {}
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

         // Apply date filter
         applyTiktokDateFilter(filterInvoiceDate, allRows);

      } catch (err) {
         alert("Gagal membaca file Excel TikTok: " + getSafeErrorMessage(err));
      } finally {
         setIsImportingExcel(false);
         setImportProgress(0);
      }
   };
`;

content = content.slice(0, logicStartIndex) + newLogicBlock + '\n   ' + content.slice(logicEndIndex);
console.log("✓ Logic block updated with date filter logic");

// 3. Update CHECK_INVOICE JSX (with Date Filter in header & Table below)
const startMarker = `{activeView === 'CHECK_INVOICE' && (`;
const endMarker = `{/* SYMBOLS VIEW */}`;

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
   console.error("ERROR: CHECK_INVOICE markers not found");
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bandingkan data scan Kalindo vs TikTok Shop dengan filter tanggal dan hapus duplikat.</p>
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
                  onClick={handleRemoveKalindoFromTiktok}
                  disabled={!kalindoDataInput.trim() || !gineeDataInput.trim()}
                  className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
               >
                  <Trash2 size={16} /> Hapus Duplikat
               </button>

               <button
                  title="Reset Semua Data"
                  onClick={() => {
                     setKalindoDataInput('');
                     setGineeDataInput('');
                     setDedupResult(null);
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
                  <div className="flex justify-between items-center px-1 flex-wrap gap-2">
                     <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Info size={14} className="text-indigo-500" /> Data TIKTOK (Unique List)
                     </label>
                     <div className="flex items-center gap-1.5 flex-wrap">
                        {rawImportedTiktokRows.length > 0 && (
                           <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
                              Excel: {rawImportedTiktokRows.length} total baris {filterInvoiceDate ? \`(\${rawImportedTiktokRows.filter(r => r.dateStr === filterInvoiceDate).length} baris cocok)\` : ''}
                           </span>
                        )}
                        <button
                           onClick={() => setGineeDataInput('')}
                           className="text-[10px] font-bold px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors flex items-center gap-1 text-xs"
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

            {/* RESULTS TABLE: HASIL HAPUS DUPLIKAT */}
            {dedupResult && (
               <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
                  {/* SUMMARY STATS CARDS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Data Kalindo</p>
                        <p className="text-2xl font-black text-blue-600">{dedupResult.kalindoCount}</p>
                     </div>
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">TikTok Sebelum Hapus</p>
                        <p className="text-2xl font-black text-indigo-600">{dedupResult.initialTiktokCount}</p>
                     </div>
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-red-50 dark:border-red-900/10 shadow-sm">
                        <p className="text-[10px] font-bold text-red-500 uppercase">Duplikat Dihapus</p>
                        <p className="text-2xl font-black text-red-600">{dedupResult.removedCount}</p>
                     </div>
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-emerald-50 dark:border-emerald-900/10 shadow-sm">
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Sisa TikTok (Hasil)</p>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{dedupResult.remainingItems.length}</p>
                     </div>
                  </div>

                  {/* TABLE CARD */}
                  <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
                     <div className="p-4 sm:p-5 bg-gradient-to-r from-gray-50 to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/20 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                           <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base sm:text-lg">
                              <CheckCircle2 size={20} className="text-emerald-500" />
                              Hasil Data TikTok (Tanpa Duplikat Kalindo)
                              <span className="text-xs font-black px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full">
                                 Total: {dedupResult.remainingItems.length} Order ID
                              </span>
                           </h4>
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Daftar Order ID TikTok yang belum ter-scan / belum ada di Data Kalindo.
                           </p>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                           <div className="relative flex-1 sm:w-48">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                 type="text"
                                 placeholder="Cari order ID..."
                                 value={dedupTableSearch}
                                 onChange={(e) => setDedupTableSearch(e.target.value)}
                                 className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-200"
                              />
                           </div>
                           <button
                              onClick={async () => {
                                 const text = dedupResult.remainingItems.join('\\n');
                                 const success = await copyToClipboard(text);
                                 if (success) setSuccessToast(\`Berhasil menyalin \${dedupResult.remainingItems.length} Order ID ke clipboard!\`);
                              }}
                              disabled={dedupResult.remainingItems.length === 0}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50 whitespace-nowrap"
                           >
                              <Copy size={14} /> Salin Semua Data ({dedupResult.remainingItems.length})
                           </button>
                        </div>
                     </div>

                     {/* TABLE BODY */}
                     <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                        {dedupResult.remainingItems.length === 0 ? (
                           <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
                              <CheckCircle2 size={40} className="text-emerald-500 opacity-60" />
                              <div>
                                 <p className="text-base font-bold text-gray-700 dark:text-gray-300">Semua Data Cocok!</p>
                                 <p className="text-xs text-gray-400 mt-1">Seluruh Order ID TikTok sudah ada di Data Kalindo (tidak ada sisa).</p>
                              </div>
                           </div>
                        ) : (
                           <table className="w-full text-left text-xs sm:text-sm">
                              <thead className="bg-gray-50 dark:bg-gray-900/60 sticky top-0 z-10 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-extrabold border-b border-gray-200 dark:border-gray-700">
                                 <tr>
                                    <th className="py-3 px-4 w-16 text-center">No.</th>
                                    <th className="py-3 px-4">Platform Unique Order ID (TikTok)</th>
                                    <th className="py-3 px-4 w-48">Status</th>
                                    <th className="py-3 px-4 w-28 text-center">Aksi</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                 {dedupResult.remainingItems
                                    .filter(id => !dedupTableSearch || id.toLowerCase().includes(dedupTableSearch.toLowerCase()))
                                    .map((orderId, idx) => (
                                       <tr key={orderId + idx} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors">
                                          <td className="py-2.5 px-4 text-center font-mono text-xs text-gray-400">{idx + 1}</td>
                                          <td className="py-2.5 px-4 font-mono font-bold text-gray-800 dark:text-gray-200">{orderId}</td>
                                          <td className="py-2.5 px-4">
                                             <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-[11px] font-bold border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1">
                                                <AlertCircle size={12} /> Belum di-Scan Kalindo
                                             </span>
                                          </td>
                                          <td className="py-2.5 px-4 text-center">
                                             <button
                                                onClick={() => copyToClipboard(orderId)}
                                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition-all inline-flex items-center gap-1 text-xs font-semibold"
                                                title="Salin Order ID ini"
                                             >
                                                <Copy size={13} /> Salin
                                             </button>
                                          </td>
                                       </tr>
                                    ))}
                              </tbody>
                           </table>
                        )}
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   </div>
)}

                        `;

content = content.slice(0, startIndex) + newCheckInvoiceJsx + content.slice(endIndex);
console.log("✓ CHECK_INVOICE JSX updated with Date Filter & Dedup Table");

// 4. Update Import Modal (add date filter in modal)
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
console.log("✓ Modal JSX updated with Date Filter");

fs.writeFileSync(filePath, content, 'utf8');
console.log("SUCCESS: components/AdminDashboard.tsx patched successfully!");
