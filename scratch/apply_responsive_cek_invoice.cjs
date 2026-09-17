const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const lines = content.split(/\r?\n/);
let startLineIdx = -1;
let endLineIdx = -1;

for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes("activeView === 'CHECK_INVOICE' && (") && i > 15000) {
      startLineIdx = i;
   }
   if (lines[i].includes("SYMBOLS VIEW") && startLineIdx !== -1 && i > startLineIdx) {
      endLineIdx = i;
      break;
   }
}

if (startLineIdx === -1 || endLineIdx === -1) {
   console.error('Could not find lines for CHECK_INVOICE block', { startLineIdx, endLineIdx });
   process.exit(1);
}

console.log('Found block from line ' + (startLineIdx + 1) + ' to ' + (endLineIdx + 1));

const newCekInvoiceBlock = `                 {activeView === 'CHECK_INVOICE' && (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900">
       {/* HEADER TOOLBAR */}
       <div className="p-3.5 sm:p-5 lg:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0 shadow-xs">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 sm:gap-4 max-w-7xl mx-auto w-full">
             {/* Title & Badge */}
             <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800 shadow-xs">
                   <FileText size={22} className="sm:w-6 sm:h-6" />
                </div>
                <div>
                   <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
                      Check Invoices (Advanced)
                      <span className="text-[10px] sm:text-[11px] font-extrabold px-2 sm:px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                         Kalindo vs TikTok
                      </span>
                   </h3>
                   <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">Bandingkan data scan Kalindo vs TikTok Shop dengan filter tanggal dan hapus duplikat.</p>
                </div>
             </div>

             {/* Filter Tanggal & Action Buttons */}
             <div className="flex flex-col sm:flex-row flex-wrap xl:flex-nowrap items-stretch sm:items-center gap-2.5 w-full xl:w-auto">
                {/* Filter Tanggal Control (Click anywhere to open calendar) */}
                <div className="flex items-center justify-between sm:justify-start gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner">
                   <div
                      className="relative flex items-center gap-2 cursor-pointer select-none flex-1 sm:flex-initial"
                      onClick={(e) => {
                         const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                         if (input && typeof input.showPicker === 'function') {
                            try { input.showPicker(); } catch (err) {}
                         }
                      }}
                   >
                      <Calendar size={15} className="text-indigo-500 shrink-0 pointer-events-none" />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">Filter Tanggal:</span>
                      <div className="relative">
                         <input
                            type="date"
                            value={filterInvoiceDate}
                            onClick={(e) => { try { if (typeof e.currentTarget.showPicker === 'function') e.currentTarget.showPicker(); } catch (error) { } }}
                            onChange={(e) => {
                               const newDate = e.target.value;
                               setFilterInvoiceDate(newDate);
                               if (rawImportedTiktokRows.length > 0) {
                                  applyTiktokDateFilter(newDate, rawImportedTiktokRows);
                               }
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer relative z-10"
                            style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                         />
                         <style>{\`input[type="date"]::-webkit-calendar-picker-indicator { position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }\`}</style>
                      </div>
                   </div>
                   {filterInvoiceDate ? (
                      <button
                         onClick={() => {
                            setFilterInvoiceDate('');
                            if (rawImportedTiktokRows.length > 0) {
                               applyTiktokDateFilter('', rawImportedTiktokRows);
                            }
                         }}
                         className="text-[10px] font-bold text-gray-400 hover:text-red-500 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap"
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
                         className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded transition-colors whitespace-nowrap"
                      >
                         Hari Ini
                      </button>
                   )}
                </div>

                {/* Buttons Group */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                   <button
                      onClick={() => setIsInvoiceImportModalOpen(true)}
                      disabled={isImportingExcel}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-xl text-xs sm:text-sm font-bold hover:bg-green-100 dark:hover:bg-green-900/50 transition-all active:scale-95 disabled:opacity-50 shadow-xs h-9 sm:h-10 whitespace-nowrap cursor-pointer"
                   >
                      {isImportingExcel ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                      <span>Import Excel TikTok</span>
                   </button>

                   <button
                      onClick={handleRemoveKalindoFromTiktok}
                      disabled={!kalindoDataInput.trim() || !gineeDataInput.trim()}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 h-9 sm:h-10 whitespace-nowrap cursor-pointer"
                   >
                      <Trash2 size={15} /> <span>Hapus Duplikat</span>
                   </button>

                   <button
                      title="Reset Semua Data"
                      onClick={() => {
                         setKalindoDataInput('');
                         setGineeDataInput('');
                         setFilterInvoiceDate('');
                         setDedupResult(null);
                         setComparisonResult(null);
                         setBarcodeStaffMap({});
                         setRawImportedTiktokRows([]);
                      }}
                      className="p-2 sm:p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all shrink-0 h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center cursor-pointer"
                   >
                      <RotateCcw size={16} />
                   </button>
                </div>
             </div>
          </div>
       </div>

       {/* SCROLLABLE MAIN CONTENT */}
       <div className="flex-1 overflow-auto p-3.5 sm:p-5 lg:p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">
             {/* INPUT CARDS GRID */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* KALINDO INPUT CARD */}
                <div className="bg-white dark:bg-gray-800/80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-3">
                   <div className="flex justify-between items-center px-0.5 flex-wrap gap-2">
                      <label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                         <ShieldCheck size={15} className="text-blue-500 shrink-0" /> 
                         <span>Data Kalindo (Paste from Excel)</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                         <button
                            onClick={() => setKalindoDataInput('')}
                            disabled={!kalindoDataInput.trim()}
                            className="text-[10px] font-bold px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700/70 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors flex items-center gap-1 disabled:opacity-40 disabled:hover:bg-gray-100 disabled:hover:text-gray-500 cursor-pointer"
                            title="Clear Input"
                         >
                            <Eraser size={11} /> Clear
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
                      className="w-full h-44 sm:h-52 lg:h-60 p-3.5 sm:p-4 bg-gray-50/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs sm:text-sm transition-all shadow-inner custom-scrollbar text-gray-900 dark:text-gray-100 resize-y"
                   />
                   <p className="text-[10px] sm:text-[11px] text-gray-400 italic px-0.5">Mendukung copy-paste 1 kolom order ID langsung dari Excel atau format Barcode + Staff.</p>
                </div>

                {/* TIKTOK INPUT CARD */}
                <div className="bg-white dark:bg-gray-800/80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs space-y-3">
                   <div className="flex justify-between items-center px-0.5 flex-wrap gap-2">
                      <label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-300 flex items-center gap-1.5 flex-wrap">
                         <Info size={15} className="text-indigo-500 shrink-0" /> 
                         <span>Data TIKTOK (Unique List)</span>
                         {!filterInvoiceDate && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1 normal-case">
                               <Lock size={10} /> Terkunci
                            </span>
                         )}
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                         {rawImportedTiktokRows.length > 0 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
                               Excel: {rawImportedTiktokRows.length} baris {filterInvoiceDate ? \`(\${rawImportedTiktokRows.filter(r => r.dateStr === filterInvoiceDate).length} cocok)\` : ''}
                            </span>
                         )}
                         <button
                            onClick={() => setGineeDataInput('')}
                            disabled={!filterInvoiceDate || !gineeDataInput.trim()}
                            className="text-[10px] font-bold px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700/70 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors flex items-center gap-1 disabled:opacity-40 disabled:hover:bg-gray-100 disabled:hover:text-gray-500 disabled:cursor-not-allowed"
                            title="Clear Input"
                         >
                            <Eraser size={11} /> Clear
                         </button>
                         <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800">
                            {gineeDataInput.split('\\n').filter(l => l.trim()).length} order ID
                         </span>
                      </div>
                   </div>
                   <div className="relative">
                      <textarea
                         value={gineeDataInput}
                         onChange={(e) => setGineeDataInput(e.target.value)}
                         disabled={!filterInvoiceDate}
                         placeholder={
                            !filterInvoiceDate
                               ? "🔒 Terkunci: Silakan pilih Filter Tanggal TikTok di atas terlebih dahulu untuk memasukkan / paste order ID atau import Excel..."
                               : "Daftar order ID TikTok (paste per baris atau gunakan tombol Import Excel di atas)..."
                         }
                         className={\`w-full h-44 sm:h-52 lg:h-60 p-3.5 sm:p-4 border rounded-2xl font-mono text-xs sm:text-sm transition-all shadow-inner custom-scrollbar resize-y \${
                            !filterInvoiceDate
                               ? 'bg-gray-100/90 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed select-none focus:outline-none focus:ring-0'
                               : 'bg-gray-50/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900 dark:text-gray-100'
                         }\`}
                      />
                   </div>
                   <p className="text-[10px] sm:text-[11px] italic px-0.5 text-gray-400">
                      {!filterInvoiceDate ? (
                         <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                            <Lock size={11} /> Pilih Filter Tanggal TikTok di atas untuk membuka input ini.
                         </span>
                      ) : (
                         'Otomatis tersaring berdasarkan Filter Tanggal TikTok yang dipilih.'
                      )}
                   </p>
                </div>
             </div>

             {/* RESULTS TABLE: HASIL HAPUS DUPLIKAT */}
             {dedupResult && (
                <div className="space-y-5 sm:space-y-6 animate-[fadeIn_0.3s_ease-out]">
                   {/* SUMMARY STATS CARDS */}
                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="bg-white dark:bg-gray-800 p-3.5 sm:p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
                         <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Data Kalindo</p>
                         <p className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-600 font-mono mt-1">{dedupResult.kalindoCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3.5 sm:p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
                         <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">TikTok Sebelum Hapus</p>
                         <p className="text-xl sm:text-2xl lg:text-3xl font-black text-indigo-600 font-mono mt-1">{dedupResult.initialTiktokCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3.5 sm:p-4 rounded-2xl border border-red-50 dark:border-red-900/10 shadow-xs">
                         <p className="text-[10px] sm:text-xs font-bold text-red-500 uppercase tracking-wider">Duplikat Dihapus</p>
                         <p className="text-xl sm:text-2xl lg:text-3xl font-black text-red-600 font-mono mt-1">{dedupResult.removedCount.toLocaleString()}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3.5 sm:p-4 rounded-2xl border border-emerald-50 dark:border-emerald-900/10 shadow-xs">
                         <p className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Sisa TikTok (Hasil)</p>
                         <p className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">{dedupResult.remainingItems.length.toLocaleString()}</p>
                      </div>
                   </div>

                   {/* TABLE CARD */}
                   <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                      <div className="p-3.5 sm:p-5 bg-gradient-to-r from-gray-50 to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/20 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                         <div>
                            <h4 className="font-bold text-gray-900 dark:text-white flex flex-wrap items-center gap-2 text-sm sm:text-base">
                               <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                               <span>Hasil Data TikTok (Tanpa Duplikat)</span>
                               <span className="text-[11px] font-black px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full">
                                  Total: {dedupResult.remainingItems.length} Order ID
                               </span>
                            </h4>
                            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                               Daftar Order ID TikTok yang belum ter-scan / belum ada di Data Kalindo.
                            </p>
                         </div>

                         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
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
                               className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50 whitespace-nowrap h-8 sm:h-9 cursor-pointer"
                            >
                               <Copy size={13} /> Salin Semua Data ({dedupResult.remainingItems.length})
                            </button>
                         </div>
                      </div>

                      {/* TABLE BODY */}
                      <div className="max-h-[450px] overflow-x-auto overflow-y-auto custom-scrollbar">
                         {dedupResult.remainingItems.length === 0 ? (
                            <div className="p-8 sm:p-12 text-center text-gray-400 flex flex-col items-center gap-3">
                               <CheckCircle2 size={36} className="text-emerald-500 opacity-60" />
                               <div>
                                  <p className="text-sm sm:text-base font-bold text-gray-700 dark:text-gray-300">Semua Data Cocok!</p>
                                  <p className="text-xs text-gray-400 mt-1">Seluruh Order ID TikTok sudah ada di Data Kalindo (tidak ada sisa duplikat).</p>
                               </div>
                            </div>
                         ) : (
                            <table className="w-full text-left text-xs sm:text-sm">
                               <thead className="bg-gray-50 dark:bg-gray-900/60 sticky top-0 z-10 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-extrabold border-b border-gray-200 dark:border-gray-700">
                                  <tr>
                                     <th className="py-2.5 sm:py-3 px-3 sm:px-4 w-14 sm:w-16 text-center">No.</th>
                                     <th className="py-2.5 sm:py-3 px-3 sm:px-4">Platform Unique Order ID (TikTok)</th>
                                     <th className="py-2.5 sm:py-3 px-3 sm:px-4 w-40 sm:w-48">Status</th>
                                     <th className="py-2.5 sm:py-3 px-3 sm:px-4 w-24 sm:w-28 text-center">Aksi</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                  {dedupResult.remainingItems
                                     .filter(id => !dedupTableSearch || id.toLowerCase().includes(dedupTableSearch.toLowerCase()))
                                     .map((orderId, idx) => (
                                        <tr key={orderId + idx} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors">
                                           <td className="py-2 sm:py-2.5 px-3 sm:px-4 text-center font-mono text-xs text-gray-400">{idx + 1}</td>
                                           <td className="py-2 sm:py-2.5 px-3 sm:px-4 font-mono font-bold text-gray-800 dark:text-gray-200">{orderId}</td>
                                           <td className="py-2 sm:py-2.5 px-3 sm:px-4">
                                              <span className="px-2 py-0.5 sm:py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-[10px] sm:text-[11px] font-bold border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1">
                                                 <AlertCircle size={11} /> Belum di-Scan Kalindo
                                              </span>
                                           </td>
                                           <td className="py-2 sm:py-2.5 px-3 sm:px-4 text-center">
                                              <button
                                                 onClick={() => copyToClipboard(orderId)}
                                                 className="p-1 sm:p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition-all inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                                                 title="Salin Order ID ini"
                                              >
                                                 <Copy size={12} /> Salin
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
 )}`;

const newLines = [
   ...lines.slice(0, startLineIdx),
   newCekInvoiceBlock,
   ...lines.slice(endLineIdx)
];

fs.writeFileSync(targetPath, newLines.join('\n'), 'utf8');
console.log('Successfully replaced Cek Invoice block with responsive layout!');
