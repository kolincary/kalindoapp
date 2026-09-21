const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('components/AdminDashboard.tsx');
let raw = fs.readFileSync(targetFile, 'utf8');

// Ensure export default AdminDashboard; is at the end
if (!raw.endsWith('export default AdminDashboard;\n') && !raw.endsWith('export default AdminDashboard;\r\n')) {
   raw = raw.trimEnd() + '\n\nexport default AdminDashboard;\n';
}

const isCRLF = raw.includes('\r\n');
const lines = raw.split(/\r?\n/);

// Find the line containing `Match: {(compComparisonStats.totalMatchLogistik`
let targetIdx = -1;
for (let i = 0; i < lines.length; i++) {
   if (lines[i].includes('Match: {(compComparisonStats.totalMatchLogistik')) {
      targetIdx = i;
      break;
   }
}

console.log('Target line for logistik sub-header:', targetIdx);

if (targetIdx !== -1) {
   // Replace lines from targetIdx - 1 (the container div) up to the closing pills container div
   let headerDivStart = targetIdx - 1;
   let toolbarIdx = -1;
   for (let i = headerDivStart; i < lines.length; i++) {
      if (lines[i].includes('{/* Toolbar Filter Kolom Logistik */}')) {
         toolbarIdx = i;
         break;
      }
   }
   console.log('headerDivStart:', headerDivStart, 'toolbarIdx:', toolbarIdx);

   if (toolbarIdx !== -1) {
      // Find the pills closing div before toolbarIdx
      let pillsEnd = toolbarIdx - 1;
      while (pillsEnd > headerDivStart && lines[pillsEnd].trim() === '') pillsEnd--;
      // We want to replace from headerDivStart up to pillsEnd - 1 (leave the wrapper </div>)
      console.log('Replacing from', headerDivStart, 'to', pillsEnd);
      
      const newBlock = [
`                                               <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap font-medium">
                                                   <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Match Hari Ini: {(compComparisonStats.matchTodayCount || 0).toLocaleString('id-ID')}</span>
                                                   <span>•</span>
                                                   <span className="text-amber-600 dark:text-amber-400 font-semibold">Match Beda Hari: {(compComparisonStats.matchPrevCount || 0).toLocaleString('id-ID')}</span>
                                                   <span>•</span>
                                                   <span className="text-rose-600 dark:text-rose-400 font-semibold">Cancel: {(compComparisonStats.cancelLogistikCount || 0).toLocaleString('id-ID')}</span>
                                                   <span>•</span>
                                                   <span className="text-gray-500 dark:text-gray-400 font-semibold">Belum di-scan: {(compComparisonStats.pureUnmatchLogistik || 0).toLocaleString('id-ID')}</span>
                                                </div>
                                             </div>
                                         </div>

                                         {/* Filter Status Match (Pills dengan 5 Level Status: Semua, Match Hari Ini, Beda Hari, Cancel, Belum di-scan) */}
                                         <div className="flex items-center gap-2 flex-wrap">
                                         {isDevModeNew && (
                                            <button
                                               onClick={async () => {
                                                  const textToCopy = filteredLogistikComparisonList.map(item => item.barcode).join('\\n');
                                                  const ok = await copyToClipboard(textToCopy);
                                                  if (ok) setSuccessToast(\`⚡ DevMode: \${filteredLogistikComparisonList.length} Barcode Logistik disalin!\`);
                                               }}
                                               className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                                               title="Salin Kolom Barcode / Resi Logistik"
                                            >
                                               <Copy size={12} />
                                               <span>Salin Barcode Logistik ({filteredLogistikComparisonList.length})</span>
                                            </button>
                                         )}
                                         <div className="flex items-center bg-white dark:bg-gray-850 p-1 rounded-xl border border-gray-200 dark:border-gray-700 text-xs flex-wrap gap-1">
                                             <button
                                                onClick={() => { setCompLogistikMatchFilter('ALL'); setCompLogistikPage(1); }}
                                                className={\`px-2 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer \${
                                                   compLogistikMatchFilter === 'ALL'
                                                      ? 'bg-indigo-600 text-white shadow-xs'
                                                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                }\`}
                                             >
                                                Semua ({(compComparisonStats.totalLogistik || 0).toLocaleString('id-ID')})
                                             </button>
                                             <button
                                                onClick={() => { setCompLogistikMatchFilter('MATCH_SAME_DAY'); setCompLogistikPage(1); }}
                                                className={\`px-2 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer \${
                                                   compLogistikMatchFilter === 'MATCH_SAME_DAY'
                                                      ? 'bg-emerald-600 text-white shadow-xs'
                                                      : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                                }\`}
                                                title="Match dengan scan Picker/Ojol hari yang sama"
                                             >
                                                🟢 Match Hari Ini ({(compComparisonStats.matchTodayCount || 0).toLocaleString('id-ID')})
                                             </button>
                                             <button
                                                onClick={() => { setCompLogistikMatchFilter('MATCH_PREV_DAY'); setCompLogistikPage(1); }}
                                                className={\`px-2 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer \${
                                                   compLogistikMatchFilter === 'MATCH_PREV_DAY'
                                                      ? 'bg-amber-600 text-white shadow-xs'
                                                      : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                                }\`}
                                                title="Match dengan scan Picker/Ojol tanggal sebelumnya / riwayat"
                                             >
                                                🟡 Match Beda Hari ({(compComparisonStats.matchPrevCount || 0).toLocaleString('id-ID')})
                                             </button>
                                             <button
                                                onClick={() => { setCompLogistikMatchFilter('CANCEL'); setCompLogistikPage(1); }}
                                                className={\`px-2 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer \${
                                                   compLogistikMatchFilter === 'CANCEL'
                                                      ? 'bg-rose-600 text-white shadow-xs'
                                                      : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                                }\`}
                                                title="Data Logistik yang terdaftar di menu Data Cancel"
                                             >
                                                🚫 Cancel ({(compComparisonStats.cancelLogistikCount || 0).toLocaleString('id-ID')})
                                             </button>
                                             <button
                                                onClick={() => { setCompLogistikMatchFilter('UNMATCH'); setCompLogistikPage(1); }}
                                                className={\`px-2 py-1 rounded-lg font-bold text-[10px] sm:text-[11px] transition-colors cursor-pointer \${
                                                   compLogistikMatchFilter === 'UNMATCH'
                                                      ? 'bg-gray-700 text-white shadow-xs'
                                                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }\`}
                                                title="Resi yang murni belum pernah di-scan sama sekali"
                                             >
                                                🔴 Belum di-scan ({(compComparisonStats.pureUnmatchLogistik || 0).toLocaleString('id-ID')})
                                             </button>
                                          </div>
                                         </div>
                                      </div>`
      ];

      lines.splice(headerDivStart, pillsEnd - headerDivStart + 1, ...newBlock);
   }
}

fs.writeFileSync(targetFile, lines.join(isCRLF ? '\r\n' : '\n'), 'utf8');
console.log('Successfully completed full update!');
