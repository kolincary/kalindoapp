const fs = require('fs');

const filePath = 'components/AdminDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add handleRemoveKalindoFromTiktok before handleCompareInvoices
const handleCompareMarker = `   const handleCompareInvoices = () => {`;
if (!content.includes(handleCompareMarker)) {
   console.error("ERROR: handleCompareInvoices marker not found");
   process.exit(1);
}

const removeFuncCode = `   const handleRemoveKalindoFromTiktok = () => {
      if (!gineeDataInput.trim()) {
         alert("Data TIKTOK masih kosong.");
         return;
      }
      if (!kalindoDataInput.trim()) {
         alert("Data Kalindo masih kosong. Masukkan data Kalindo terlebih dahulu untuk memfilter duplikat.");
         return;
      }

      const kalindoLines = kalindoDataInput.split(/\\r?\\n/).map(l => l.trim()).filter(l => l);
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

      const tiktokLines = gineeDataInput.split(/\\r?\\n/).map(l => l.trim()).filter(l => l);
      const remainingTiktok: string[] = [];
      const seen = new Set<string>();

      tiktokLines.forEach(line => {
         const clean = line.replace(/^["']|["']$/g, '').trim();
         if (!clean) return;
         const code = clean.includes('\\t')
            ? clean.split('\\t')[0].trim().replace(/^["']|["']$/g, '')
            : clean.split(/\\s+/)[0].trim().replace(/^["']|["']$/g, '');

         if (code && !kalindoSet.has(code) && !seen.has(code)) {
            seen.add(code);
            remainingTiktok.push(code);
         }
      });

      const removedCount = tiktokLines.length - remainingTiktok.length;
      setGineeDataInput(remainingTiktok.join('\\n'));

      if (comparisonResult) {
         setComparisonResult((prev: any) => prev ? {
            ...prev,
            totalGinee: remainingTiktok.length,
            missingInKalindo: remainingTiktok
         } : null);
      }

      setSuccessToast(\`Berhasil menghapus \${removedCount} data duplikat Kalindo! Sisa: \${remainingTiktok.length} Order ID TikTok.\`);
   };

   const handleCompareInvoices = () => {`;

content = content.replace(handleCompareMarker, removeFuncCode);
console.log("✓ handleRemoveKalindoFromTiktok added");

// 2. Update CHECK_INVOICE JSX
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
                           onClick={handleRemoveKalindoFromTiktok}
                           disabled={!gineeDataInput || !kalindoDataInput}
                           className="text-[10px] font-bold px-2.5 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-full transition-colors flex items-center gap-1 border border-amber-200 dark:border-amber-800 disabled:opacity-50"
                           title="Hapus duplikat Order ID TikTok yang sudah ada di Data Kalindo"
                        >
                           <Trash2 size={11} /> Hapus Duplikat
                        </button>
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
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-amber-50 dark:border-amber-900/10 shadow-sm">
                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">TikTok Belum di Kalindo</p>
                        <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{comparisonResult.missingInKalindo.length}</p>
                     </div>
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-red-50 dark:border-red-900/10 shadow-sm">
                        <p className="text-[10px] font-bold text-red-500 uppercase">Kalindo Tidak di TikTok</p>
                        <p className="text-2xl font-black text-red-600">{comparisonResult.missingInGinee.length}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* CARD 1: DATA TIKTOK BELUM ADA DI KALINDO */}
                     <div className="bg-white dark:bg-gray-800 rounded-3xl border border-amber-100 dark:border-amber-900/30 overflow-hidden shadow-xl shadow-amber-500/5">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/30 flex justify-between items-center flex-wrap gap-2">
                           <h4 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 text-sm sm:text-base">
                              <AlertCircle size={18} className="text-amber-600 dark:text-amber-400" />
                              TikTok Belum Ada di Kalindo ({comparisonResult.missingInKalindo.length})
                           </h4>
                           <div className="flex gap-2">
                              <button
                                 onClick={handleRemoveKalindoFromTiktok}
                                 disabled={comparisonResult.missingInKalindo.length === comparisonResult.totalGinee || comparisonResult.missingInKalindo.length === 0}
                                 className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-amber-600/20"
                                 title="Hapus data duplikat Kalindo dari kolom Data TIKTOK"
                              >
                                 <Trash2 size={12} /> Hapus Duplikat
                              </button>
                              <button
                                 onClick={async () => {
                                    const text = comparisonResult.missingInKalindo.join('\\n');
                                    const success = await copyToClipboard(text);
                                    if (success) setSuccessToast("Berhasil menyalin seluruh Order ID TikTok yang belum ada di Kalindo!");
                                 }}
                                 disabled={comparisonResult.missingInKalindo.length === 0}
                                 className="px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-amber-200 dark:border-amber-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all flex items-center gap-1.5 disabled:opacity-50"
                              >
                                 <Copy size={12} /> Copy Semua
                              </button>
                           </div>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto divide-y divide-amber-50 dark:divide-amber-900/10 custom-scrollbar">
                           {comparisonResult.missingInKalindo.length === 0 ? (
                              <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-2">
                                 <CheckCircle2 size={32} className="text-green-500 opacity-50" />
                                 <p className="text-sm font-semibold">Semua Order TikTok sudah ada di Data Kalindo.</p>
                              </div>
                           ) : (
                              comparisonResult.missingInKalindo.map((b: string) => (
                                 <div key={b} className="p-3 flex justify-between items-center hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                                    <div>
                                       <span className="font-mono font-bold text-sm text-gray-800 dark:text-gray-200">{b}</span>
                                    </div>
                                    <button onClick={() => copyToClipboard(b)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all" title="Copy"><Copy size={14} /></button>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>

                     {/* CARD 2: KALINDO TIDAK DI TIKTOK / INDIKASI INVOICE PALSU */}
                     <div className="bg-white dark:bg-gray-800 rounded-3xl border border-red-100 dark:border-red-900/30 overflow-hidden shadow-xl shadow-red-500/5">
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex justify-between items-center flex-wrap gap-2">
                           <h4 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 text-sm sm:text-base">
                              <ShieldAlert size={18} />
                              Kalindo Tidak di TikTok ({comparisonResult.missingInGinee.length})
                           </h4>
                           <div className="flex gap-2">
                              <button
                                 onClick={handleReportFakeInvoices}
                                 disabled={isReportingFake || comparisonResult.missingInGinee.length === 0}
                                 className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-red-600/20"
                              >
                                 {isReportingFake ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                 Lapor Invoice Palsu
                              </button>
                              <button
                                 onClick={async () => {
                                    const text = comparisonResult.missingInGinee.map((b: string) => b).join('\\n');
                                    const success = await copyToClipboard(text);
                                    if (success) setSuccessToast("Copied barcodes only!");
                                 }}
                                 disabled={comparisonResult.missingInGinee.length === 0}
                                 className="px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-red-200 dark:border-red-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all flex items-center gap-1.5 disabled:opacity-50"
                              >
                                 <Copy size={12} /> Copy Barcode
                              </button>
                           </div>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto divide-y divide-red-50 dark:divide-red-900/10 custom-scrollbar">
                           {comparisonResult.missingInGinee.length === 0 ? (
                              <div className="p-10 text-center text-gray-400 flex flex-col items-center gap-2">
                                 <CheckCircle2 size={32} className="text-green-500 opacity-50" />
                                 <p className="text-sm font-semibold">Semua barcode Kalindo terdaftar di TikTok.</p>
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
                  </div>

                  {/* DUPLICATE DI KALINDO BANNER */}
                  {comparisonResult.duplicatesKalindo.length > 0 && (
                     <div className="bg-white dark:bg-gray-800 rounded-3xl border border-yellow-200 dark:border-yellow-900/30 overflow-hidden shadow-sm">
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-100 dark:border-yellow-900/30 flex justify-between items-center">
                           <h4 className="font-bold text-yellow-700 dark:text-yellow-500 text-sm sm:text-base">Duplicate di Kalindo ({comparisonResult.duplicatesKalindo.length})</h4>
                           <button
                              onClick={async () => {
                                 const text = comparisonResult.duplicatesKalindo.join('\\n');
                                 const success = await copyToClipboard(text);
                                 if (success) setSuccessToast("Copied duplicate barcodes!");
                              }}
                              className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                           >
                              <Copy size={12} /> Copy Duplikat
                           </button>
                        </div>
                        <div className="max-h-[200px] overflow-y-auto p-4 custom-scrollbar">
                           <div className="flex flex-wrap gap-2">
                              {comparisonResult.duplicatesKalindo.map((b: string) => (
                                 <span key={b} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs font-mono font-bold border border-yellow-200">{b}</span>
                              ))}
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            )}
         </div>
      </div>
   </div>
)}

                        `;

content = content.slice(0, startIndex) + newCheckInvoiceJsx + content.slice(endIndex);
console.log("✓ CHECK_INVOICE JSX replaced with TikTok Belum Ada di Kalindo card & Hapus Duplikat button");

fs.writeFileSync(filePath, content, 'utf8');
console.log("SUCCESS: components/AdminDashboard.tsx patched successfully!");
