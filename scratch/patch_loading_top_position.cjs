const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const isCRLF = code.includes('\r\n');
let norm = code.replace(/\r\n/g, '\n');

console.log("Positioning loading overlay higher up in the viewport (fixed top)...");

const lines = norm.split('\n');
let idx = -1;

for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('isLoadingPacking') && lines[i].includes('gudangReportTab === \'CURRENT\'')) {
      idx = i;
      break;
   }
}

if (idx !== -1) {
   let endIdx = idx;
   while (endIdx < lines.length && !lines[endIdx].includes(')}')) {
      endIdx++;
   }

   const newLoadingOverlay = `                                  {isLoadingPacking && (activeView !== 'GUDANG_REPORT' || gudangReportTab === 'CURRENT') && (
                                     <div className="fixed inset-0 z-50 bg-black/35 dark:bg-black/55 backdrop-blur-[2px] flex flex-col items-center justify-start pt-24 sm:pt-32 p-4 transition-all duration-300">
                                        <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/90 shadow-2xl flex flex-col items-center gap-3 max-w-md w-full text-center animate-in fade-in slide-in-from-top-6 duration-200">
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

   lines.splice(idx, endIdx - idx + 1, newLoadingOverlay);
   norm = lines.join('\n');
   console.log(`✅ Successfully replaced loading overlay with fixed top-positioned modal at line ${idx}!`);
} else {
   console.log("⚠️ Target index not found");
}

const finalCode = isCRLF ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync(targetFile, finalCode, 'utf8');
