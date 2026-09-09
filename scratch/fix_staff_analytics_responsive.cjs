const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Locate the outer container around line 11319
const oldSectionStart = `{(activeView === 'PACKING_DATA' || activeView === 'PACKING_2_DATA' || activeView === 'SORTIR_DATA' || activeView === 'LOGISTIK_DATA' || (activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') || activeView === 'LEADER_2_DATA' || activeView === 'GUDANG_PENDING' || activeView === 'GUDANG_READY' || activeView === 'GUDANG_CANCEL' || activeView === 'GUDANG_REPORT' || activeView === 'GUDANG_BUNDLING' || activeView === 'SCAN_ALL') && (`;

const idxStart = content.indexOf(oldSectionStart);
if (idxStart === -1) {
  console.error('Could not find oldSectionStart');
  process.exit(1);
}

// Locate the Right Sidebar start and end
const sidebarMarker = `{/* Right: Staff Analytics Sidebar Panel (Khusus PACKING_2_DATA saat filter staff aktif) */}`;
const idxSidebar = content.indexOf(sidebarMarker);
if (idxSidebar === -1) {
  console.error('Could not find sidebarMarker');
  process.exit(1);
}

// Find the end of this table & sidebar block (before activeView === 'BATCH_DATA')
const batchDataMarker = `{activeView === 'BATCH_DATA' && (`;
const idxBatch = content.indexOf(batchDataMarker, idxSidebar);
if (idxBatch === -1) {
  console.error('Could not find batchDataMarker');
  process.exit(1);
}

console.log('Found indices:', { idxStart, idxSidebar, idxBatch });

// Let's inspect the exact block from idxSidebar to idxBatch
const currentSidebarAndEnd = content.substring(idxSidebar, idxBatch);

// New modern, ultra-responsive, non-clipping Staff Analytics Sidebar
const newSidebarAndEnd = `{/* Right: Staff Analytics Sidebar Panel (Khusus PACKING_2_DATA saat filter staff aktif) */}
                              {activeView === 'PACKING_2_DATA' && filterPackingStaff !== 'ALL' && packing2StaffAnalytics && (
                                 <div className="w-full lg:w-[350px] xl:w-[390px] 2xl:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200/80 dark:border-gray-700/80 bg-gradient-to-b from-gray-50/95 via-white to-gray-50/95 dark:from-gray-900/95 dark:via-gray-850 dark:to-slate-900/90 backdrop-blur-xl p-3.5 sm:p-4 lg:p-4.5 flex flex-col gap-3 shadow-xl lg:sticky lg:top-0 lg:max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar transition-all duration-300">
                                    {/* 1. Header Card */}
                                    <div className="relative overflow-hidden rounded-2xl p-3 sm:p-3.5 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white shadow-lg border border-white/10 shrink-0">
                                       <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                       <div className="flex items-center justify-between relative z-10 gap-2">
                                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                             <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-base sm:text-lg tracking-wider text-white shadow-inner shrink-0">
                                                {packing2StaffAnalytics.initials}
                                             </div>
                                             <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                   <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1 shrink-0">
                                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                                      PACKING
                                                   </span>
                                                   <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/15 text-white/90 border border-white/20 truncate">
                                                      {packing2StaffAnalytics.shift}
                                                   </span>
                                                </div>
                                                <h3 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight truncate" title={packing2StaffAnalytics.staffName}>
                                                   {packing2StaffAnalytics.staffName}
                                                </h3>
                                             </div>
                                          </div>
                                          <button 
                                             onClick={() => setFilterPackingStaff('ALL')}
                                             className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white/80 hover:text-white transition-all cursor-pointer shrink-0"
                                             title="Tutup Panel Analisis"
                                          >
                                             <X size={16} />
                                          </button>
                                       </div>
                                    </div>

                                    {/* 2. Circular Progress Ring Card (100% Responsive & Non-Clipping) */}
                                    <div className="rounded-2xl p-3 sm:p-4 bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs backdrop-blur-md flex flex-col items-center justify-center relative shrink-0">
                                       <div className="w-full flex items-center justify-between mb-1 text-xs font-bold text-gray-500 dark:text-gray-400">
                                          <span className="flex items-center gap-1.5">
                                             <Award size={14} className="text-amber-500 shrink-0" /> 
                                             <span className="truncate">Kontribusi Scan Hari Ini</span>
                                          </span>
                                          <span className="font-mono text-blue-600 dark:text-blue-400 font-extrabold shrink-0">{packing2StaffAnalytics.percentage}%</span>
                                       </div>

                                       <div className="relative flex items-center justify-center my-1.5 sm:my-2 w-full">
                                          <svg className="w-28 h-28 sm:w-32 sm:h-32 xl:w-36 xl:h-36 transform -rotate-90 overflow-visible" viewBox="0 0 120 120">
                                             <circle
                                                cx="60"
                                                cy="60"
                                                r="48"
                                                className="text-gray-100 dark:text-gray-700/60"
                                                strokeWidth="10"
                                                stroke="currentColor"
                                                fill="transparent"
                                             />
                                             <circle
                                                cx="60"
                                                cy="60"
                                                r="48"
                                                stroke="url(#blueGradient2)"
                                                strokeWidth="10"
                                                strokeDasharray={301.59}
                                                strokeDashoffset={301.59 - (301.59 * Math.min(100, Math.max(0, packing2StaffAnalytics.percentage))) / 100}
                                                strokeLinecap="round"
                                                fill="transparent"
                                                className="transition-all duration-1000 ease-out"
                                             />
                                             <defs>
                                                <linearGradient id="blueGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                                   <stop offset="0%" stopColor="#3b82f6" />
                                                   <stop offset="50%" stopColor="#6366f1" />
                                                   <stop offset="100%" stopColor="#06b6d4" />
                                                </linearGradient>
                                             </defs>
                                          </svg>
                                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                             <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-gray-900 dark:text-white leading-none">
                                                {packing2StaffAnalytics.percentage}%
                                             </span>
                                             <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-1">
                                                Share Scan
                                             </span>
                                          </div>
                                       </div>

                                       <div className="w-full mt-1 pt-2 sm:pt-2.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs">
                                          <span className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs">Total Scan Staff:</span>
                                          <span className="font-bold font-mono text-gray-800 dark:text-gray-200 text-[11px] sm:text-xs">
                                             {packing2StaffAnalytics.staffTotal.toLocaleString()} <span className="text-gray-400 font-normal">/ {packing2StaffAnalytics.overallTotal.toLocaleString()}</span>
                                          </span>
                                       </div>
                                    </div>

                                    {/* 3. Performance 2x2 Grid */}
                                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 shrink-0">
                                       <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs">
                                          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                                             <Package size={13} /> Total Scan
                                          </div>
                                          <div className="text-lg sm:text-xl font-black font-mono text-gray-900 dark:text-white">
                                             {packing2StaffAnalytics.staffTotal.toLocaleString()}
                                          </div>
                                          {isHalfCountMode && (
                                             <div className="text-[9px] text-red-500 font-semibold mt-0.5">Mode 50% Cut</div>
                                          )}
                                       </div>

                                       <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs">
                                          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">
                                             <Zap size={13} /> Avg / Jam
                                          </div>
                                          <div className="text-lg sm:text-xl font-black font-mono text-gray-900 dark:text-white">
                                             {packing2StaffAnalytics.avgPerHour} <span className="text-[10px] sm:text-xs font-normal text-gray-400">/jam</span>
                                          </div>
                                          <div className="text-[9px] sm:text-[10px] text-gray-400 font-semibold mt-0.5">{packing2StaffAnalytics.activeHoursCount} jam aktif</div>
                                       </div>

                                       <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs">
                                          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-purple-600 dark:text-purple-400 mb-0.5">
                                             <Clock size={13} /> Jam Aktif
                                          </div>
                                          <div className="text-lg sm:text-xl font-black font-mono text-gray-900 dark:text-white">
                                             {packing2StaffAnalytics.activeHoursCount} <span className="text-[10px] sm:text-xs font-normal text-gray-400">Jam</span>
                                          </div>
                                          <div className="text-[9px] sm:text-[10px] text-gray-400 font-semibold mt-0.5">Hari ini</div>
                                       </div>

                                       <div className="p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs">
                                          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
                                             <Activity size={13} /> Performa
                                          </div>
                                          <div className="mt-1">
                                             <span className={\`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block \${packing2StaffAnalytics.speedTag.color}\`}>
                                                {packing2StaffAnalytics.speedTag.label}
                                             </span>
                                          </div>
                                       </div>
                                    </div>

                                    {/* 4. Hourly Activity Bar Chart */}
                                    <div className="rounded-2xl p-3 sm:p-4 bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs flex flex-col gap-2 sm:gap-3 shrink-0">
                                       <div className="flex items-center justify-between">
                                          <div className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                             <BarChart3 size={14} className="text-blue-600 dark:text-blue-400" />
                                             Distribusi Scan Per Jam
                                          </div>
                                          <span className="text-[10px] font-mono font-bold text-gray-400">
                                             Peak: {packing2StaffAnalytics.maxCountInHour} scan
                                          </span>
                                       </div>

                                       {/* Bars Container */}
                                       <div className="h-24 sm:h-28 flex items-end gap-1 sm:gap-1.5 pt-4 pb-1 px-2 bg-gray-50/80 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800/80 overflow-x-auto custom-scrollbar">
                                          {packing2StaffAnalytics.hourlyChartData.map((item, idx) => {
                                             const heightPercent = packing2StaffAnalytics.maxCountInHour > 0 
                                                ? Math.max(8, Math.round((item.count / packing2StaffAnalytics.maxCountInHour) * 100))
                                                : 8;
                                             const isPeak = item.count === packing2StaffAnalytics.maxCountInHour && item.count > 0;

                                             return (
                                                <div key={idx} className="flex-1 min-w-[16px] sm:min-w-[20px] flex flex-col items-center h-full justify-end group relative">
                                                   {/* Hover Tooltip */}
                                                   <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 bg-gray-900 text-white text-[9px] font-mono font-bold py-0.5 px-1.5 rounded shadow-md pointer-events-none z-20 whitespace-nowrap">
                                                      {item.hour}: {item.count}
                                                   </div>

                                                   {/* Bar Element */}
                                                   <div
                                                      className={\`w-full rounded-t-md transition-all duration-500 \${
                                                         item.count > 0
                                                            ? isPeak
                                                               ? 'bg-gradient-to-t from-indigo-600 to-cyan-400 shadow-sm ring-1 ring-cyan-400/40'
                                                               : 'bg-gradient-to-t from-blue-600 to-indigo-400 group-hover:from-blue-500 group-hover:to-indigo-300'
                                                            : 'bg-gray-200 dark:bg-gray-700/40 h-1.5'
                                                      }\`}
                                                      style={{ height: item.count > 0 ? \`\${heightPercent}%\` : '5px' }}
                                                   />
                                                   <span className="text-[8px] sm:text-[9px] font-mono text-gray-400 dark:text-gray-500 mt-1 scale-90">
                                                      {item.rawHour}
                                                   </span>
                                                </div>
                                             );
                                          })}
                                       </div>
                                    </div>

                                    {/* 5. Latest Scan Live Card */}
                                    <div className="rounded-2xl p-2.5 sm:p-3 bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs flex flex-col gap-1.5 sm:gap-2 shrink-0">
                                       <div className="flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-300">
                                          <span className="flex items-center gap-1.5">
                                             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                             Scan Terakhir
                                          </span>
                                          <span className="font-mono text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                             {packing2StaffAnalytics.latestTimeStr}
                                          </span>
                                       </div>
                                       {packing2StaffAnalytics.latestItem ? (
                                          <div className="p-2 sm:p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                                             <div className="truncate">
                                                <div className="font-mono font-bold text-xs text-gray-900 dark:text-white truncate">
                                                   {packing2StaffAnalytics.latestItem.barcode}
                                                </div>
                                                <div className="text-[10px] text-gray-400 truncate">
                                                   {packing2StaffAnalytics.latestItem.description || 'Verified Scan'}
                                                </div>
                                             </div>
                                             <button
                                                onClick={() => {
                                                   navigator.clipboard.writeText(packing2StaffAnalytics.latestItem.barcode);
                                                   showToast('Barcode berhasil disalin!', 'success');
                                                }}
                                                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
                                                title="Salin Barcode"
                                             >
                                                <Copy size={13} />
                                             </button>
                                          </div>
                                       ) : (
                                          <div className="text-xs text-gray-400 text-center py-1.5">Belum ada scan terbaru</div>
                                       )}
                                    </div>

                                    {/* 6. Action Buttons */}
                                    <div className="flex flex-col gap-2 pt-1 shrink-0">
                                       <button
                                          onClick={() => {
                                             const barcodes = packingData.map(d => d.barcode).filter(Boolean).join('\\n');
                                             if (barcodes) {
                                                navigator.clipboard.writeText(barcodes);
                                                showToast(\`\${packingData.length} barcode berhasil disalin!\`, 'success');
                                             } else {
                                                showToast('Tidak ada barcode untuk disalin', 'error');
                                             }
                                          }}
                                          className="w-full py-2 sm:py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 hover:scale-[1.01] transition-all cursor-pointer"
                                       >
                                          <Copy size={14} /> Salin Semua Barcode Staff ({packingData.length})
                                       </button>
                                       
                                       <button
                                          onClick={() => setFilterPackingStaff('ALL')}
                                          className="w-full py-2 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200 dark:border-gray-700"
                                       >
                                          <RotateCcw size={13} /> Reset Filter Staff
                                       </button>
                                    </div>
                                 </div>
                              )}
                           </div>
                        )}

                        `;

// Replace the sidebar portion
content = content.substring(0, idxSidebar) + newSidebarAndEnd + content.substring(idxBatch + batchDataMarker.length);
// Note: We included '{activeView === \'BATCH_DATA\' && (' at the end of newSidebarAndEnd, so we append from idxBatch + batchDataMarker.length

// Also update the parent container wrapper at line 11319 to ensure items-start layout
const oldWrapper = `<div className={\`w-full h-full flex \${activeView === 'PACKING_2_DATA' && filterPackingStaff !== 'ALL' ? 'flex-col lg:flex-row' : 'flex-col'} bg-white dark:bg-gray-800 overflow-hidden\`}>
                              {/* Left / Main Table Area */}
                              <div className=\"flex-1 min-w-0 flex flex-col h-full overflow-hidden\">`;

const newWrapper = `<div className={\`w-full \${activeView === 'PACKING_2_DATA' && filterPackingStaff !== 'ALL' ? 'flex flex-col lg:flex-row items-start min-h-full' : 'h-full flex flex-col overflow-hidden'} bg-white dark:bg-gray-800\`}>
                              {/* Left / Main Table Area */}
                              <div className={\`w-full \${activeView === 'PACKING_2_DATA' && filterPackingStaff !== 'ALL' ? 'lg:flex-1 min-w-0 flex flex-col' : 'flex-1 min-w-0 flex flex-col h-full overflow-hidden'}\`}>`;

if (content.includes(oldWrapper)) {
  content = content.replace(oldWrapper, newWrapper);
  console.log('Successfully replaced outer wrapper!');
} else {
  console.log('Warning: oldWrapper not exact match, checking alternative');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated AdminDashboard.tsx!');
