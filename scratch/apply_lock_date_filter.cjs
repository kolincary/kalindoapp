const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Update filterInvoiceDate state initialization
const oldState = `   const [filterInvoiceDate, setFilterInvoiceDate] = useState<string>(() => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return \`\${y}-\${m}-\${d}\`;
   });`;

const newState = `   const [filterInvoiceDate, setFilterInvoiceDate] = useState<string>('');`;

if (content.includes(oldState)) {
   content = content.replace(oldState, newState);
   console.log('1. Updated filterInvoiceDate initial state to empty string');
} else {
   console.warn('1. Old state declaration not found or already updated');
}

// 2. Guard in processBatchGineeFiles
const oldProcessHeader = `   // Import TikTok Excel: reads Col A (Platform unique order ID) & Col AD (Order created time)
   const processBatchGineeFiles = async (files: File[]) => {
      setIsImportingExcel(true);
      setImportProgress(0);
      setIsInvoiceImportModalOpen(false);`;

const newProcessHeader = `   // Import TikTok Excel: reads Col A (Platform unique order ID) & Col AD (Order created time)
   const processBatchGineeFiles = async (files: File[]) => {
      if (!filterInvoiceDate) {
         alert("Silakan pilih filter tanggal terlebih dahulu sebelum import file Excel.");
         return;
      }
      setIsImportingExcel(true);
      setImportProgress(0);
      setIsInvoiceImportModalOpen(false);`;

if (content.includes(oldProcessHeader)) {
   content = content.replace(oldProcessHeader, newProcessHeader);
   console.log('2. Added filterInvoiceDate guard to processBatchGineeFiles');
} else {
   console.warn('2. processBatchGineeFiles header not found');
}

// 3. Update Cek Invoice page JSX (Header date filter, reset button, and TikTok textarea)
const oldMainPageSnippet = `               {/* TIKTOK INPUT */}
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
               </div>`;

const newMainPageSnippet = `               {/* TIKTOK INPUT */}
               <div className="space-y-2">
                  <div className="flex justify-between items-center px-1 flex-wrap gap-2">
                     <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <Info size={14} className="text-indigo-500" /> Data TIKTOK (Unique List)
                        {!filterInvoiceDate && (
                           <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1 normal-case">
                              <Lock size={10} /> Terkunci
                           </span>
                        )}
                     </label>
                     <div className="flex items-center gap-1.5 flex-wrap">
                        {rawImportedTiktokRows.length > 0 && (
                           <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
                              Excel: {rawImportedTiktokRows.length} total baris {filterInvoiceDate ? \`(\${rawImportedTiktokRows.filter(r => r.dateStr === filterInvoiceDate).length} baris cocok)\` : ''}
                           </span>
                        )}
                        <button
                           onClick={() => setGineeDataInput('')}
                           disabled={!filterInvoiceDate || !gineeDataInput.trim()}
                           className="text-[10px] font-bold px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors flex items-center gap-1 text-xs disabled:opacity-40 disabled:hover:bg-gray-100 disabled:hover:text-gray-500 disabled:cursor-not-allowed"
                           title="Clear Input"
                        >
                           <Eraser size={12} /> Clear
                        </button>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-800">
                           {gineeDataInput.split('\\n').filter(l => l.trim()).length} unique order ID
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
                        className={\`w-full h-48 p-4 border rounded-2xl font-mono text-xs sm:text-sm transition-all shadow-inner custom-scrollbar \${
                           !filterInvoiceDate
                              ? 'bg-gray-100/90 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed select-none focus:outline-none focus:ring-0'
                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900 dark:text-gray-100'
                        }\`}
                     />
                  </div>
                  <p className="text-[10px] italic px-1 text-gray-400">
                     {!filterInvoiceDate ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                           <Lock size={10} /> Pilih Filter Tanggal TikTok di atas untuk membuka input ini.
                        </span>
                     ) : (
                        'Otomatis tersaring berdasarkan Filter Tanggal TikTok yang dipilih.'
                     )}
                  </p>
               </div>`;

if (content.includes(oldMainPageSnippet)) {
   content = content.replace(oldMainPageSnippet, newMainPageSnippet);
   console.log('3. Updated TikTok textarea in main page with locked state');
} else {
   console.warn('3. oldMainPageSnippet not found');
}

// 4. Update Reset button to also clear filterInvoiceDate
const oldResetBtn = `                <button
                   title="Reset Semua Data"
                   onClick={() => {
                      setKalindoDataInput('');
                      setGineeDataInput('');
                      setDedupResult(null);
                      setComparisonResult(null);
                      setBarcodeStaffMap({});
                      setRawImportedTiktokRows([]);
                   }}`;

const newResetBtn = `                <button
                   title="Reset Semua Data"
                   onClick={() => {
                      setKalindoDataInput('');
                      setGineeDataInput('');
                      setFilterInvoiceDate('');
                      setDedupResult(null);
                      setComparisonResult(null);
                      setBarcodeStaffMap({});
                      setRawImportedTiktokRows([]);
                   }}`;

if (content.includes(oldResetBtn)) {
   content = content.replace(oldResetBtn, newResetBtn);
   console.log('4. Updated Reset button to clear filterInvoiceDate');
} else {
   console.warn('4. oldResetBtn not found');
}

// 5. Update Modal date filter & Dropzone
const oldModalSnippet = `                     {/* Date Filter Preview inside Modal (Click anywhere to open calendar) */}
                     <div
                        className="mb-4 p-3 bg-indigo-50/70 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between gap-2 cursor-pointer select-none"
                        onClick={(e) => {
                           const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                           if (input && typeof input.showPicker === 'function') {
                              try { input.showPicker(); } catch (err) {}
                           }
                        }}
                     >
                        <div className="flex items-center gap-2 pointer-events-none">
                           <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
                           <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Filter Tanggal:</span>
                        </div>
                        <div className="relative">
                           <input
                              type="date"
                              value={filterInvoiceDate}
                              onClick={(e) => { try { if (typeof e.currentTarget.showPicker === 'function') e.currentTarget.showPicker(); } catch (error) { } }}
                              onChange={(e) => setFilterInvoiceDate(e.target.value)}
                              className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer relative z-10"
                              style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                           />
                           <style>{\`input[type="date"]::-webkit-calendar-picker-indicator { position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }\`}</style>
                        </div>
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
                     </div>`;

const newModalSnippet = `                     {/* Date Filter Preview inside Modal (Click anywhere to open calendar) */}
                     <div
                        className={\`mb-4 p-3 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer select-none transition-all \${
                           !filterInvoiceDate 
                              ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-xs ring-2 ring-amber-400/40' 
                              : 'bg-indigo-50/70 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800'
                        }\`}
                        onClick={(e) => {
                           const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                           if (input && typeof input.showPicker === 'function') {
                              try { input.showPicker(); } catch (err) {}
                           }
                        }}
                     >
                        <div className="flex items-center gap-2 pointer-events-none">
                           <Calendar size={16} className={!filterInvoiceDate ? "text-amber-600 dark:text-amber-400" : "text-indigo-600 dark:text-indigo-400"} />
                           <span className={\`text-xs font-bold \${!filterInvoiceDate ? "text-amber-900 dark:text-amber-200" : "text-indigo-900 dark:text-indigo-200"}\`}>
                              Filter Tanggal: {!filterInvoiceDate && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1">(Wajib Dipilih)</span>}
                           </span>
                        </div>
                        <div className="flex items-center gap-2">
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
                                 className={\`px-3 py-1.5 text-xs font-bold bg-white dark:bg-gray-800 border rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 cursor-pointer relative z-10 \${
                                    !filterInvoiceDate 
                                       ? 'border-amber-400 dark:border-amber-600 focus:ring-amber-500 text-amber-900 dark:text-amber-100' 
                                       : 'border-indigo-200 dark:border-indigo-700 focus:ring-indigo-500'
                                 }\`}
                                 style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
                              />
                              <style>{\`input[type="date"]::-webkit-calendar-picker-indicator { position: absolute; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }\`}</style>
                           </div>
                           {!filterInvoiceDate && (
                              <button
                                 type="button"
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    const today = getTodayString();
                                    setFilterInvoiceDate(today);
                                    if (rawImportedTiktokRows.length > 0) {
                                       applyTiktokDateFilter(today, rawImportedTiktokRows);
                                    }
                                 }}
                                 className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 px-2 py-1.5 rounded-lg shadow-xs transition-colors"
                              >
                                 Hari Ini
                              </button>
                           )}
                        </div>
                     </div>

                     <div
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                           e.preventDefault();
                           if (!filterInvoiceDate) {
                              alert("Silakan pilih filter tanggal terlebih dahulu sebelum mengunggah file Excel.");
                              return;
                           }
                           handleInvoiceFileDrop(e);
                        }}
                        className={\`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all relative \${
                           !filterInvoiceDate
                              ? 'border-gray-300 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 opacity-70 cursor-not-allowed'
                              : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 group cursor-pointer'
                        }\`}
                     >
                        <input
                           type="file"
                           multiple
                           disabled={!filterInvoiceDate}
                           accept=".xlsx, .xls"
                           onChange={handleInvoiceFileSelect}
                           className={\`absolute inset-0 w-full h-full opacity-0 \${!filterInvoiceDate ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer'}\`}
                        />
                        <div className={\`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform \${
                           !filterInvoiceDate
                              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                              : 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-400 group-hover:scale-110'
                        }\`}>
                           {!filterInvoiceDate ? <Lock size={32} /> : <UploadCloud size={36} />}
                        </div>

                        {!filterInvoiceDate ? (
                           <div className="space-y-1.5">
                              <p className="font-bold text-amber-700 dark:text-amber-400 text-sm sm:text-base flex items-center justify-center gap-1.5">
                                 <Lock size={16} /> Import Terkunci
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                 Silakan pilih <strong className="text-amber-600 dark:text-amber-400">Filter Tanggal</strong> di atas terlebih dahulu untuk mengunggah file.
                              </p>
                           </div>
                        ) : (
                           <>
                              <p className="font-bold text-gray-700 dark:text-gray-300 mb-1 text-sm sm:text-base">Drag & Drop file Excel TikTok di sini</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">atau klik untuk memilih file dari komputer</p>
                              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-4 font-mono bg-indigo-100 dark:bg-indigo-900/50 inline-block px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                                 Membaca Kolom A (Platform unique order ID) & Kolom AD (Order created time)
                              </p>
                           </>
                        )}
                     </div>`;

if (content.includes(oldModalSnippet)) {
   content = content.replace(oldModalSnippet, newModalSnippet);
   console.log('5. Updated Modal with locked state and highlighted date picker');
} else {
   console.warn('5. oldModalSnippet not found');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('AdminDashboard.tsx saved successfully!');
