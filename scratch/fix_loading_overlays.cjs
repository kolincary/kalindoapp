const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const isCRLF = code.includes('\r\n');
let norm = code.replace(/\r\n/g, '\n');

console.log("Fixing loading overlays and eliminating dark half-screen flash...");

// 1. Add Root-level Firestore Range Loading Modal
const rootAnchor = `         {/* IMPORT OVERLAY */}
         {isImportingExcel && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
               <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center border border-gray-100 dark:border-gray-700">
                  <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-6 animate-bounce"><Upload size={32} /></div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Importing Data TikTok...</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Reading {importProgress}% complete</p>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-2"><div className="bg-green-600 h-full rounded-full transition-all duration-300 ease-out" style={{ width: \`\${importProgress}%\` }}></div></div>
               </div>
            </div>
         )}`;

const rootReplacement = `         {/* IMPORT OVERLAY */}
         {isImportingExcel && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
               <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center border border-gray-100 dark:border-gray-700">
                  <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-6 animate-bounce"><Upload size={32} /></div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Importing Data TikTok...</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Reading {importProgress}% complete</p>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-2"><div className="bg-green-600 h-full rounded-full transition-all duration-300 ease-out" style={{ width: \`\${importProgress}%\` }}></div></div>
               </div>
            </div>
         )}

         {/* ROOT FIRESTORE RANGE LOADING MODAL */}
         {isLoadingPacking && dateFilterMode === 'RANGE' && firestoreLoadingText && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
               <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl shadow-2xl p-7 text-center border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4 shadow-inner">
                     <Loader2 size={28} className="animate-spin" />
                  </div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wide mb-1">
                     {firestoreLoadingText}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                     Sedang mengambil data rentang dari Firestore. Harap tunggu sebentar...
                  </p>
               </div>
            </div>
         )}`;

if (norm.includes(rootAnchor)) {
   norm = norm.replace(rootAnchor, rootReplacement);
   console.log("✅ 1. Added Root-level Firestore Range Loading Modal.");
} else {
   console.log("⚠️ 1. rootAnchor not found directly.");
}

// 2. Replace nested fixed loading in table with clean lightweight inline loading (No full screen dimming)
const lines = norm.split('\n');
let startIdx = -1;
let endIdx = -1;

for (let i = 16000; i < lines.length; i++) {
   if (lines[i] && lines[i].includes('isLoadingPacking') && lines[i].includes('gudangReportTab === \'CURRENT\'')) {
      startIdx = i;
      break;
   }
}

if (startIdx !== -1) {
   endIdx = startIdx;
   while (endIdx < lines.length && !lines[endIdx].includes(')}')) {
      endIdx++;
   }

   const cleanInlineLoading = `                                  {isLoadingPacking && dateFilterMode === 'SINGLE' && (activeView !== 'GUDANG_REPORT' || gudangReportTab === 'CURRENT') && (
                                     <div className="absolute inset-0 z-20 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 transition-all duration-200 pointer-events-none">
                                        <div className="px-5 py-3 rounded-2xl bg-white/95 dark:bg-gray-800/95 border border-gray-200/90 dark:border-gray-700/90 shadow-lg flex items-center gap-3 animate-in zoom-in-95 duration-150">
                                           <Loader2 className="animate-spin text-blue-600 dark:text-blue-400" size={20} />
                                           <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Memuat Data...</span>
                                        </div>
                                     </div>
                                  )}`;

   lines.splice(startIdx, endIdx - startIdx + 1, cleanInlineLoading);
   norm = lines.join('\n');
   console.log(`✅ 2. Replaced table overlay with clean lightweight inline badge at lines [${startIdx}-${endIdx}]!`);
} else {
   console.log("⚠️ 2. Table loading overlay index not found.");
}

const finalCode = isCRLF ? norm.replace(/\n/g, '\r\n') : norm;
fs.writeFileSync(targetFile, finalCode, 'utf8');
console.log("Done fixing loading overlays!");
