const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const isCRLF = code.includes('\r\n');
let norm = code.replace(/\r\n/g, '\n');

const oldLoading = `                                  {isLoadingPacking && (activeView !== 'GUDANG_REPORT' || gudangReportTab === 'CURRENT') && (
                                     <div className="absolute inset-0 z-50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-[2px] flex flex-col gap-3 items-center justify-center transition-all duration-300">
                                        <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
                                        <p className="text-xs font-bold text-gray-600 dark:text-gray-300 tracking-wide uppercase">Memuat Data...</p>
                                     </div>
                                  )}`;

const newLoading = `                                  {isLoadingPacking && (activeView !== 'GUDANG_REPORT' || gudangReportTab === 'CURRENT') && (
                                     <div className="absolute inset-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-[3px] flex flex-col items-center justify-center p-4 transition-all duration-300 min-h-[350px]">
                                        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/90 shadow-2xl flex flex-col items-center gap-3.5 max-w-sm w-full text-center">
                                           <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                                              <Loader2 className="animate-spin" size={26} />
                                           </div>
                                           <div className="space-y-1">
                                              <p className="text-sm font-black text-gray-800 dark:text-gray-100 tracking-wide uppercase">
                                                 {firestoreLoadingText || 'Memuat Data...'}
                                              </p>
                                              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                 {firestoreLoadingText 
                                                    ? 'Sedang mengambil data rentang dari Firestore. Harap tunggu...'
                                                    : 'Sedang menyiapkan data tabel, mohon tunggu sebentar...'}
                                              </p>
                                           </div>
                                        </div>
                                     </div>
                                  )}`;

if (norm.includes(oldLoading)) {
   norm = norm.replace(oldLoading, newLoading);
   console.log("✅ Replaced loading overlay with centered floating card!");
} else {
   console.log("⚠️ Old loading block not found, performing line replacement...");
   const lines = norm.split('\n');
   let idx = -1;
   for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Memuat Data...') && lines[i-1]?.includes('animate-spin') && lines[i-2]?.includes('absolute inset-0')) {
         idx = i - 3;
         break;
      }
   }
   if (idx !== -1) {
      lines.splice(idx, 7, newLoading);
      norm = lines.join('\n');
      console.log(`✅ Replaced loading overlay at line ${idx}!`);
   }
}

const finalCode = isCRLF ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync(targetFile, finalCode, 'utf8');
console.log("Done!");
