const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const isCRLF = code.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

console.log("Patching Date Filter UI in Toolbar...");

const oldDateBlock = `                                    {/* Date Filter */}
                                    {/* PACKING/SORTIR/ETC: 2 cols on LG. SCAN_ALL: 3 cols on LG. GUDANG: 3 cols on LG. */}
                                    <div className={\`col-span-12 sm:col-span-6 md:col-span-3 \${activeView === 'SCAN_ALL' || activeView.startsWith('GUDANG_') ? 'lg:col-span-3' : 'lg:col-span-2'} relative h-10\`}>
                                       <div className="relative w-full h-full">
                                          <div
                                             className="relative w-full h-full cursor-pointer group"
                                             onClick={() => {
                                                const input = document.getElementById('main-date-filter') as HTMLInputElement;
                                                if (input) {
                                                   try { if (typeof input.showPicker === 'function') input.showPicker(); else input.click(); } catch (e) { input.click(); }
                                                }
                                             }}
                                          >
                                             <CalendarIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 pointer-events-none z-10 transition-colors" />
                                             {canManageDate ? (
                                                <input
                                                   id="main-date-filter"
                                                   type="date"
                                                   value={filterDate}
                                                   min={!isDateFilterUnrestricted ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined}
                                                   max={!isDateFilterUnrestricted ? new Date().toISOString().split('T')[0] : undefined}
                                                   onChange={(e) => {
                                                      const selected = e.target.value;
                                                      if (!isDateFilterUnrestricted) {
                                                         const minDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                         if (selected && selected < minDate) {
                                                            alert("Restricted: You can only view data from the last 2 days.");
                                                            return;
                                                         }
                                                      }
                                                      setFilterDate(selected);
                                                   }}
                                                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                />
                                             ) : null}
                                             <div className={\`w-full h-full pl-9 pr-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs sm:text-sm flex items-center font-semibold shadow-2xs \${canManageDate ? 'text-gray-800 dark:text-gray-200 group-hover:border-blue-400 dark:group-hover:border-blue-500' : 'text-gray-400 bg-gray-50/50'} transition-all\`}>
                                                {formatDisplayDate(canManageDate ? filterDate : getTodayString())}
                                             </div>
                                             {canManageDate && <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 pointer-events-none transition-colors" />}
                                          </div>
                                       </div>
                                    </div>`;

const newDateBlock = `                                    {/* Date Filter (Support Single & Range 7 Hari Khusus Admin & Admin3 via Firestore) */}
                                    <div className={\`col-span-12 sm:col-span-12 \${canUse7DaysRangeFilter && dateFilterMode === 'RANGE' ? 'md:col-span-6 lg:col-span-4' : (activeView === 'SCAN_ALL' || activeView.startsWith('GUDANG_') ? 'md:col-span-4 lg:col-span-3' : 'md:col-span-3 lg:col-span-2')} relative\`}>
                                       {/* Admin3 & Admin Toggle Pill */}
                                       {canUse7DaysRangeFilter && (
                                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                             <div className="inline-flex rounded-lg p-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[11px] font-semibold">
                                                <button
                                                   type="button"
                                                   onClick={() => {
                                                      setDateFilterMode('SINGLE');
                                                      fetchPackingData(1);
                                                   }}
                                                   className={\`px-2 py-0.5 rounded-md transition-all cursor-pointer \${dateFilterMode === 'SINGLE' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}\`}
                                                >
                                                   📅 1 Hari
                                                </button>
                                                <button
                                                   type="button"
                                                   onClick={() => {
                                                      setDateFilterMode('RANGE');
                                                      fetchPackingData(1);
                                                   }}
                                                   className={\`px-2 py-0.5 rounded-md transition-all cursor-pointer \${dateFilterMode === 'RANGE' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs font-bold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}\`}
                                                >
                                                   📆 Rentang Tanggal
                                                </button>
                                             </div>

                                             {dateFilterMode === 'RANGE' && (
                                                <button
                                                   type="button"
                                                   onClick={() => {
                                                      const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                      const today = new Date().toISOString().split('T')[0];
                                                      setRangeStartDate(sevenDaysAgo);
                                                      setRangeEndDate(today);
                                                   }}
                                                   className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                                                   title="Set otomatis rentang 7 hari terakhir s/d hari ini"
                                                >
                                                   ⚡ 7 Hari Terakhir
                                                </button>
                                             )}
                                          </div>
                                       )}

                                       {/* Date Inputs */}
                                       {canUse7DaysRangeFilter && dateFilterMode === 'RANGE' ? (
                                          <div className="flex items-center gap-1.5 h-10 w-full">
                                             <div className="relative flex-1 h-full">
                                                <input
                                                   type="date"
                                                   value={rangeStartDate}
                                                   onChange={(e) => setRangeStartDate(e.target.value)}
                                                   className="w-full h-full px-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                                                   title="Tanggal Mulai"
                                                />
                                             </div>
                                             <span className="text-xs font-bold text-gray-400 dark:text-gray-500 shrink-0">s/d</span>
                                             <div className="relative flex-1 h-full">
                                                <input
                                                   type="date"
                                                   value={rangeEndDate}
                                                   onChange={(e) => setRangeEndDate(e.target.value)}
                                                   className="w-full h-full px-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                                                   title="Tanggal Akhir"
                                                />
                                             </div>
                                          </div>
                                       ) : (
                                          <div className="relative w-full h-10">
                                             <div
                                                className="relative w-full h-full cursor-pointer group"
                                                onClick={() => {
                                                   const input = document.getElementById('main-date-filter') as HTMLInputElement;
                                                   if (input) {
                                                      try { if (typeof input.showPicker === 'function') input.showPicker(); else input.click(); } catch (e) { input.click(); }
                                                   }
                                                }}
                                             >
                                                <CalendarIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 pointer-events-none z-10 transition-colors" />
                                                {canManageDate ? (
                                                   <input
                                                      id="main-date-filter"
                                                      type="date"
                                                      value={filterDate}
                                                      min={!isDateFilterUnrestricted ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined}
                                                      max={!isDateFilterUnrestricted ? new Date().toISOString().split('T')[0] : undefined}
                                                      onChange={(e) => {
                                                         const selected = e.target.value;
                                                         if (!isDateFilterUnrestricted) {
                                                            const minDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                            if (selected && selected < minDate) {
                                                               alert("Restricted: You can only view data from the last 2 days.");
                                                               return;
                                                            }
                                                         }
                                                         setFilterDate(selected);
                                                      }}
                                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                   />
                                                ) : null}
                                                <div className={\`w-full h-full pl-9 pr-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs sm:text-sm flex items-center font-semibold shadow-2xs \${canManageDate ? 'text-gray-800 dark:text-gray-200 group-hover:border-blue-400 dark:group-hover:border-blue-500' : 'text-gray-400 bg-gray-50/50'} transition-all\`}>
                                                   {formatDisplayDate(canManageDate ? filterDate : getTodayString())}
                                                </div>
                                                {canManageDate && <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 pointer-events-none transition-colors" />}
                                             </div>
                                          </div>
                                       )}
                                    </div>`;

// Replace with normalizing CRLF / LF
const normCode = code.replace(/\r\n/g, '\n');
const normOld = oldDateBlock.replace(/\r\n/g, '\n');
const normNew = newDateBlock.replace(/\r\n/g, '\n');

if (normCode.includes(normOld)) {
   const patchedNorm = normCode.replace(normOld, normNew);
   const finalCode = isCRLF ? patchedNorm.replace(/\n/g, '\r\n') : patchedNorm;
   fs.writeFileSync(targetFile, finalCode, 'utf8');
   console.log("✅ Successfully patched Date Filter UI!");
} else {
   console.error("❌ Failed: oldDateBlock not found in AdminDashboard.tsx");
}
