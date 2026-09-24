const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const isCRLF = code.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

console.log("Fixing Komparasi Picker vs Logistik date picker lag & debouncing comparison fetch...");

// 1. Debounce loadDualComparisonData effect
const oldCompEffect = `   // Synchronized effect for Dual-Column Tab
   useEffect(() => {
      if (activeView === 'LOGISTIK_DATA' && (logistikActiveTab === 'PICKER' || logistikActiveTab === 'CANCEL')) {
         loadDualComparisonData();
      }
   }, [activeView, filterDate, logistikActiveTab]);`;

const newCompEffect = `   // Synchronized effect for Dual-Column Tab
   useEffect(() => {
      if (activeView === 'LOGISTIK_DATA' && (logistikActiveTab === 'PICKER' || logistikActiveTab === 'CANCEL')) {
         const timer = setTimeout(() => {
            loadDualComparisonData();
         }, 150);
         return () => clearTimeout(timer);
      }
   }, [activeView, filterDate, logistikActiveTab]);`;

const normCode = code.replace(/\r\n/g, '\n');
const normOldEff = oldCompEffect.replace(/\r\n/g, '\n');
const normNewEff = newCompEffect.replace(/\r\n/g, '\n');

if (normCode.includes(normOldEff)) {
   code = isCRLF ? normCode.replace(normOldEff, normNewEff).replace(/\n/g, '\r\n') : normCode.replace(normOldEff, normNewEff);
   console.log("✅ Step 1: Debounced loadDualComparisonData effect.");
} else {
   console.log("Note: Step 1 pattern already updated or not found");
}

// 2. Fix Komparasi Date Picker UI Element
const oldCompPicker = `                                     <div className="relative h-10 w-48 sm:w-56">
                                         <div
                                            className="relative w-full h-full cursor-pointer group"
                                            onClick={() => {
                                               const input = document.getElementById('logistik-dual-comp-date-filter') as HTMLInputElement;
                                               if (input) {
                                                  try { if (typeof input.showPicker === 'function') input.showPicker(); else input.click(); } catch (e) { input.click(); }
                                               }
                                            }}
                                         >
                                            <div className="absolute inset-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 flex items-center justify-between transition-all group-hover:border-cyan-500 shadow-2xs">
                                               <div className="flex items-center gap-2 overflow-hidden">
                                                  <div className="w-6 h-6 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                                                     <CalendarIcon size={13} />
                                                  </div>
                                                  <div className="flex flex-col text-left">
                                                     <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 leading-none">Tanggal Data</span>
                                                     <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate mt-0.5">
                                                        {filterDate || 'Pilih Tanggal'}
                                                     </span>
                                                  </div>
                                               </div>
                                               <ChevronDown size={14} className="text-gray-400 group-hover:text-cyan-500 shrink-0 transition-colors" />
                                            </div>
                                            <input
                                               id="logistik-dual-comp-date-filter"
                                               type="date"
                                               value={filterDate}
                                               onChange={(e) => {
                                                  setFilterDate(e.target.value);
                                                  resetDualComparisonFilters();
                                               }}
                                               className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                            />
                                         </div>
                                      </div>`;

const newCompPicker = `                                     <div className="relative h-10 w-48 sm:w-56">
                                         <div className="relative w-full h-full group">
                                            <div className="absolute inset-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 flex items-center justify-between transition-all group-hover:border-cyan-500 shadow-2xs pointer-events-none">
                                               <div className="flex items-center gap-2 overflow-hidden">
                                                  <div className="w-6 h-6 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                                                     <CalendarIcon size={13} />
                                                  </div>
                                                  <div className="flex flex-col text-left">
                                                     <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 leading-none">Tanggal Data</span>
                                                     <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate mt-0.5">
                                                        {filterDate || 'Pilih Tanggal'}
                                                     </span>
                                                  </div>
                                               </div>
                                               <ChevronDown size={14} className="text-gray-400 group-hover:text-cyan-500 shrink-0 transition-colors" />
                                            </div>
                                            <input
                                               id="logistik-dual-comp-date-filter"
                                               type="date"
                                               value={filterDate}
                                               onChange={(e) => {
                                                  setFilterDate(e.target.value);
                                                  resetDualComparisonFilters();
                                               }}
                                               onClick={(e) => {
                                                  try {
                                                     if (typeof (e.currentTarget as any).showPicker === 'function') {
                                                        (e.currentTarget as any).showPicker();
                                                     }
                                                  } catch (err) {}
                                               }}
                                               className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                            />
                                         </div>
                                      </div>`;

const normCode2 = code.replace(/\r\n/g, '\n');
const normOldPick = oldCompPicker.replace(/\r\n/g, '\n');
const normNewPick = newCompPicker.replace(/\r\n/g, '\n');

if (normCode2.includes(normOldPick)) {
   code = isCRLF ? normCode2.replace(normOldPick, normNewPick).replace(/\n/g, '\r\n') : normCode2.replace(normOldPick, normNewPick);
   console.log("✅ Step 2: Fixed Komparasi Picker date input double-invocation lag.");
} else {
   console.error("❌ Step 2 failed: oldCompPicker not found");
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("Successfully saved all fixes to AdminDashboard.tsx");
