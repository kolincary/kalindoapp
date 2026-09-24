const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const isCRLF = code.includes('\r\n');
let norm = code.replace(/\r\n/g, '\n');

// 1. Upgrade formatDisplayDate to be timezone-safe
const oldFormatDisplayDateRegex = /const formatDisplayDate = \(dateStr: string\) => \{[\s\S]*?\n\};/;
const newFormatDisplayDate = `const formatDisplayDate = (dateStr: string) => {
   if (!dateStr) return '';
   try {
      if (/^\\d{4}-\\d{2}-\\d{2}$/.test(dateStr)) {
         const [y, m, d] = dateStr.split('-').map(Number);
         const localDate = new Date(y, m - 1, d);
         return localDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
   } catch (e) {
      return dateStr;
   }
};`;

norm = norm.replace(oldFormatDisplayDateRegex, newFormatDisplayDate);
console.log("✅ 1. Updated formatDisplayDate function to be timezone-safe.");

// 2. Locate Toolbar 1
const startMarker = `{/* REFACTORED TOOLBAR FOR PACKING, SORTIR, PICKER, OJOL, SCAN_ALL, GUDANG, LOGISTIK (UNIFIED GRID) */}`;
const endMarker = `// ORIGINAL TOOLBAR FOR OTHER VIEWS`;

const startIdx = norm.indexOf(startMarker);
const endIdx = norm.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
   console.error("❌ Could not find markers!", { startIdx, endIdx });
   process.exit(1);
}

const newToolbarJSX = `{/* REFACTORED TOOLBAR FOR PACKING, SORTIR, PICKER, OJOL, SCAN_ALL, GUDANG, LOGISTIK (UNIFIED GRID) */}
                           {(['PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'PICKER_DATA', 'CHECKER_DATA', 'LEADER_2_DATA', 'LEADER_PENDING_ADMIN', 'OJOL_DATA', 'SCAN_ALL', 'GUDANG_PENDING', 'GUDANG_READY', 'GUDANG_CANCEL', 'GUDANG_REPORT', 'GUDANG_BUNDLING', 'LOGISTIK_DATA'].includes(activeView)) ? (
                              <div className="flex flex-col gap-3 w-full">
                                 {/* TOP SUB-ROW: Mode Selector (1 Hari / Rentang Tanggal) */}
                                 {canUse7DaysRangeFilter && (
                                    <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-gray-200/70 dark:border-gray-800/80 flex-wrap">
                                       <div className="flex items-center gap-2.5 flex-wrap">
                                          <div className="inline-flex rounded-xl p-1 bg-gray-100/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 text-xs sm:text-sm font-bold shadow-2xs">
                                             <button
                                                type="button"
                                                onClick={() => {
                                                   if (dateFilterMode !== 'SINGLE') {
                                                      setPage(1);
                                                      setDateFilterMode('SINGLE');
                                                   }
                                                }}
                                                className={\`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 \${dateFilterMode === 'SINGLE' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs font-black ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'}\`}
                                             >
                                                <CalendarIcon size={15} />
                                                <span>1 Hari</span>
                                             </button>
                                             <button
                                                type="button"
                                                onClick={() => {
                                                   if (dateFilterMode !== 'RANGE') {
                                                      setPage(1);
                                                      setDateFilterMode('RANGE');
                                                   }
                                                }}
                                                className={\`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 \${dateFilterMode === 'RANGE' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm font-black ring-1 ring-blue-500/50' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'}\`}
                                             >
                                                <Calendar size={15} />
                                                <span>Rentang Tanggal</span>
                                             </button>
                                          </div>

                                          {dateFilterMode === 'RANGE' && (
                                             <button
                                                type="button"
                                                onClick={() => {
                                                   const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                   const today = new Date().toISOString().split('T')[0];
                                                   setPage(1);
                                                   setRangeStartDate(sevenDaysAgo);
                                                   setRangeEndDate(today);
                                                }}
                                                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                                                title="Set otomatis rentang 7 hari terakhir s/d hari ini"
                                             >
                                                <span>⚡ 7 Hari Terakhir</span>
                                             </button>
                                          )}
                                       </div>

                                       {dateFilterMode === 'RANGE' && (
                                          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40">
                                             <Database size={13} />
                                             <span>Mode Rentang 7 Hari (Firestore)</span>
                                          </div>
                                       )}
                                    </div>
                                 )}

                                 {/* ROW 1: Date Filter, Cancel Only / Role, Search Box */}
                                 <div className="grid grid-cols-12 gap-3 items-center">
                                    {/* 1. Date Filter (h-11, Instant click anywhere to open calendar, No text selection) */}
                                    <div className={\`col-span-12 \${canUse7DaysRangeFilter && dateFilterMode === 'RANGE' ? 'sm:col-span-12 md:col-span-6 lg:col-span-5' : 'sm:col-span-5 md:col-span-4 lg:col-span-3'} relative h-11\`}>
                                       {canUse7DaysRangeFilter && dateFilterMode === 'RANGE' ? (
                                          <div className="flex items-center gap-2 h-11 w-full select-none">
                                             {/* Tanggal Mulai (Full Click Area, No text selection/block) */}
                                             <div className="relative flex-1 h-full group select-none">
                                                <CalendarIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-500 pointer-events-none z-10 transition-colors" />
                                                <input
                                                   type="date"
                                                   value={rangeStartDate}
                                                   max={rangeEndDate}
                                                   onChange={(e) => {
                                                      const val = e.target.value;
                                                      if (!val) return;
                                                      const sD = new Date(val);
                                                      const eD = new Date(rangeEndDate);
                                                      const diff = Math.ceil((eD.getTime() - sD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                                      if (diff > 7) {
                                                         const newEnd = new Date(sD.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                         setRangeEndDate(newEnd);
                                                         setSuccessToast("Rentang tanggal disesuaikan maksimal 7 hari.");
                                                      }
                                                      setPage(1);
                                                      setRangeStartDate(val);
                                                   }}
                                                   onClick={(e) => {
                                                      try {
                                                         if (typeof (e.currentTarget as any).showPicker === 'function') {
                                                            (e.currentTarget as any).showPicker();
                                                         }
                                                      } catch (err) {}
                                                   }}
                                                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 select-none"
                                                   title="Klik untuk memilih tanggal mulai"
                                                />
                                                <div className="w-full h-full pl-9 pr-7 bg-gray-50/80 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-500 rounded-xl text-xs sm:text-sm flex items-center font-bold text-gray-800 dark:text-gray-200 shadow-2xs pointer-events-none select-none transition-all truncate">
                                                   {formatDisplayDate(rangeStartDate)}
                                                </div>
                                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-500 pointer-events-none z-10 transition-colors" />
                                             </div>

                                             <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-black text-gray-500 dark:text-gray-400 rounded-lg shrink-0 select-none">
                                                s/d
                                             </span>

                                             {/* Tanggal Akhir (Full Click Area, No text selection/block) */}
                                             <div className="relative flex-1 h-full group select-none">
                                                <CalendarIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-500 pointer-events-none z-10 transition-colors" />
                                                <input
                                                   type="date"
                                                   value={rangeEndDate}
                                                   min={rangeStartDate}
                                                   max={new Date().toISOString().split('T')[0]}
                                                   onChange={(e) => {
                                                      const val = e.target.value;
                                                      if (!val) return;
                                                      const eD = new Date(val);
                                                      const sD = new Date(rangeStartDate);
                                                      const diff = Math.ceil((eD.getTime() - sD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                                      if (diff > 7) {
                                                         const newStart = new Date(eD.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                                                         setRangeStartDate(newStart);
                                                         setSuccessToast("Rentang tanggal disesuaikan maksimal 7 hari.");
                                                      }
                                                      setPage(1);
                                                      setRangeEndDate(val);
                                                   }}
                                                   onClick={(e) => {
                                                      try {
                                                         if (typeof (e.currentTarget as any).showPicker === 'function') {
                                                            (e.currentTarget as any).showPicker();
                                                         }
                                                      } catch (err) {}
                                                   }}
                                                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 select-none"
                                                   title="Klik untuk memilih tanggal akhir"
                                                />
                                                <div className="w-full h-full pl-9 pr-7 bg-gray-50/80 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-500 rounded-xl text-xs sm:text-sm flex items-center font-bold text-gray-800 dark:text-gray-200 shadow-2xs pointer-events-none select-none transition-all truncate">
                                                   {formatDisplayDate(rangeEndDate)}
                                                </div>
                                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-500 pointer-events-none z-10 transition-colors" />
                                             </div>
                                          </div>
                                       ) : (
                                          <div className="relative w-full h-11 select-none">
                                             <div className="relative w-full h-full group select-none">
                                                <CalendarIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-500 pointer-events-none z-10 transition-colors" />
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
                                                         setPage(1);
                                                         setFilterDate(selected);
                                                      }}
                                                      onClick={(e) => {
                                                         try {
                                                            if (typeof (e.currentTarget as any).showPicker === 'function') {
                                                               (e.currentTarget as any).showPicker();
                                                            }
                                                         } catch (err) {}
                                                      }}
                                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 select-none"
                                                   />
                                                ) : null}
                                                <div className={\`w-full h-full pl-10 pr-9 bg-gray-50/80 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-xs sm:text-sm flex items-center font-bold shadow-2xs pointer-events-none select-none \${canManageDate ? 'text-gray-800 dark:text-gray-200 group-hover:border-blue-400 dark:group-hover:border-blue-500' : 'text-gray-400 bg-gray-50/50'} transition-all\`}>
                                                   {formatDisplayDate(canManageDate ? filterDate : getTodayString())}
                                                </div>
                                                {canManageDate && <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-blue-500 pointer-events-none z-10 transition-colors" />}
                                             </div>
                                          </div>
                                       )}
                                    </div>

                                    {/* 2. Cancel Filter (h-11) */}
                                    {['PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'PICKER_DATA', 'CHECKER_DATA', 'LEADER_2_DATA', 'LEADER_PENDING_ADMIN', 'OJOL_DATA', 'LOGISTIK_DATA'].includes(activeView) && (
                                       <div className={\`col-span-5 \${canUse7DaysRangeFilter && dateFilterMode === 'RANGE' ? 'sm:col-span-4 md:col-span-2 lg:col-span-2' : 'sm:col-span-3 md:col-span-3 lg:col-span-2'} h-11\`}>
                                          <div
                                             className={\`flex items-center gap-2.5 h-full px-3.5 rounded-xl border-2 shadow-2xs cursor-pointer select-none transition-all w-full \${filterCancelOnly ? 'bg-red-50/95 border-red-500 text-red-700 dark:bg-red-950/50 dark:border-red-500 dark:text-red-300 ring-2 ring-red-500/20' : 'bg-gray-50/80 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200'}\`}
                                             onClick={() => setFilterCancelOnly(!filterCancelOnly)}
                                          >
                                             <input
                                                type="checkbox"
                                                checked={filterCancelOnly}
                                                onChange={(e) => setFilterCancelOnly(e.target.checked)}
                                                className="w-4 h-4 text-red-600 rounded focus:ring-red-500/30 cursor-pointer shrink-0 accent-red-600"
                                             />
                                             <span className={\`text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis \${filterCancelOnly ? "text-red-700 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}\`}>Cancel Only</span>
                                          </div>
                                       </div>
                                    )}

                                    {/* 2b. Role Filter (for SCAN_ALL) */}
                                    {activeView === 'SCAN_ALL' && (
                                       <div className="col-span-5 sm:col-span-3 md:col-span-3 lg:col-span-2 relative h-11">
                                          <Briefcase size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                                          <select
                                             value={filterPackingRole}
                                             onChange={(e) => setFilterPackingRole(e.target.value)}
                                             className="w-full pl-10 pr-8 h-full bg-gray-50/80 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-xs sm:text-sm font-bold appearance-none focus:outline-none focus:ring-4 focus:ring-purple-500/15 focus:border-purple-500 shadow-2xs cursor-pointer"
                                          >
                                             <option value="ALL">All Roles</option>
                                             {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                                          </select>
                                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                       </div>
                                    )}

                                    {/* 3. Search Box (h-11, clear border-2, comfortable colors) */}
                                    <div className={\`col-span-7 \${['PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'PICKER_DATA', 'CHECKER_DATA', 'LEADER_2_DATA', 'LEADER_PENDING_ADMIN', 'OJOL_DATA', 'LOGISTIK_DATA', 'SCAN_ALL'].includes(activeView) ? (canUse7DaysRangeFilter && dateFilterMode === 'RANGE' ? 'sm:col-span-8 md:col-span-4 lg:col-span-5' : 'sm:col-span-4 md:col-span-5 lg:col-span-7') : (canUse7DaysRangeFilter && dateFilterMode === 'RANGE' ? 'sm:col-span-12 md:col-span-6 lg:col-span-7' : 'sm:col-span-7 md:col-span-8 lg:col-span-9')} relative h-11\`}>
                                       <SearchInput
                                          value={activeView === 'OJOL_DATA' ? ojolSearch : packingSearch}
                                          onChange={(val) => {
                                             if (activeView === 'OJOL_DATA') {
                                                setOjolSearch(val);
                                             } else {
                                                if (val.toLowerCase().includes('devmodenew')) {
                                                   const isCurrentlyOn = localStorage.getItem('isDevModeNew') === 'true' || showSecretMenu;
                                                   const newState = !isCurrentlyOn;
                                                   setShowSecretMenu(newState);
                                                   setShowFsSyncDevMode(newState);
                                                   setShowFakeReportMenu(newState);
                                                   localStorage.setItem('showSecretMenu', String(newState));
                                                   localStorage.setItem('isDevModeNew', String(newState));
                                                   localStorage.setItem('showFakeReportMenu', String(newState));
                                                   setSuccessToast(newState ? "⚡ Dev Mode Secret Unlocked! (Fitur Checkbox & Hapus Aktif)" : "Dev Mode Deactivated");
                                                   setPackingSearch(val.replace(/devmodenew/gi, '').trim());
                                                } else {
                                                   setPackingSearch(val);
                                                }
                                             }
                                          }}
                                          placeholder={\`Search \${activeView === 'OJOL_DATA' ? 'Ojol' : (activeView === 'SORTIR_DATA' ? 'Sortir' : (activeView === 'LOGISTIK_DATA' ? 'Logistik' : (activeView === 'GUDANG_PENDING' ? 'Pending Scans' : (activeView === 'GUDANG_READY' ? 'Resi Ready' : (activeView === 'GUDANG_REPORT' ? 'Gudang Report' : (activeView === 'GUDANG_BUNDLING' ? 'Bundling' : (activeView === 'SCAN_ALL' ? 'All Data' : ((activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') ? 'Picker' : (activeView === 'LEADER_2_DATA' ? 'Rekap Detail Leader' : (activeView === 'LEADER_PENDING_ADMIN' ? 'Pending Leader' : 'Packing'))))))))))}...\`}
                                          className="w-full h-full"
                                       />
                                    </div>
                                 </div>

                                 {/* ROW 2: Shifts, Staff, 50% Cut, Salin Barcode, Reset, Export (All h-11) */}
                                 <div className="grid grid-cols-12 gap-3 items-center">
                                    {/* Shift Filter (h-11) */}
                                    {['PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'PICKER_DATA', 'LEADER_2_DATA', 'LEADER_PENDING_ADMIN', 'OJOL_DATA', 'LOGISTIK_DATA', 'SCAN_ALL'].includes(activeView) && (
                                       <div className="col-span-6 sm:col-span-4 md:col-span-3 lg:col-span-2 relative h-11">
                                          <Filter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                                          <select
                                             value={(activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') ? 'Leader' : (activeView === 'OJOL_DATA' ? filterOjolShift : filterPackingShift)}
                                             onChange={(e) => activeView === 'OJOL_DATA' ? setFilterOjolShift(e.target.value) : setFilterPackingShift(e.target.value)}
                                             className={\`w-full pl-10 pr-8 h-full bg-gray-50/80 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-xs sm:text-sm font-bold shadow-2xs appearance-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 cursor-pointer \${(activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') ? 'opacity-70 cursor-not-allowed' : ''}\`}
                                             disabled={(activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA')}
                                          >
                                             {(activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') ? (
                                                <option value="Leader">Leader</option>
                                             ) : (
                                                <>
                                                   <option value="ALL">All Shifts</option>
                                                   {availableShifts.map(s => <option key={s} value={s}>{s}</option>)}
                                                </>
                                             )}
                                          </select>
                                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                       </div>
                                    )}

                                    {/* Staff Filter (h-11) */}
                                    {['PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'PICKER_DATA', 'CHECKER_DATA', 'LEADER_2_DATA', 'LEADER_PENDING_ADMIN', 'OJOL_DATA', 'SCAN_ALL', 'GUDANG_REPORT', 'LOGISTIK_DATA'].includes(activeView) && (
                                       <div className={\`col-span-6 sm:col-span-4 md:col-span-3 \${activeView === 'SCAN_ALL' ? 'lg:col-span-3' : 'lg:col-span-2'} relative h-11\`}>
                                          <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                                          <select
                                             value={activeView === 'OJOL_DATA' ? filterOjolStaff : filterPackingStaff}
                                             onChange={(e) => activeView === 'OJOL_DATA' ? setFilterOjolStaff(e.target.value) : setFilterPackingStaff(e.target.value)}
                                             className="w-full pl-10 pr-8 h-full bg-gray-50/80 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-xs sm:text-sm font-bold shadow-2xs appearance-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 cursor-pointer"
                                          >
                                             <option value="ALL">All Staff</option>
                                             {(activeView === 'OJOL_DATA' ? ojolStaffList : packingStaffList).map(s => <option key={s} value={s}>{s}</option>)}
                                          </select>
                                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                       </div>
                                    )}

                                    {/* Manual / Packing List Filter - PICKER_DATA ONLY */}
                                    {(activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') && (
                                       <div className="col-span-6 sm:col-span-4 md:col-span-3 lg:col-span-2 relative h-11">
                                          <ScanLine size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" />
                                          <select
                                             value={filterPickerType}
                                             onChange={(e) => { setFilterPickerType(e.target.value as 'ALL' | 'MANUAL' | 'PACKING_LIST'); setPage(1); }}
                                             className="w-full pl-10 pr-8 h-full bg-gray-50/80 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-xs sm:text-sm font-bold shadow-2xs appearance-none focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15 cursor-pointer"
                                          >
                                             <option value="ALL">All Tipe</option>
                                             <option value="MANUAL">Manual (Scan Resi)</option>
                                             <option value="PACKING_LIST">Packing List</option>
                                          </select>
                                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                       </div>
                                    )}

                                    {/* 50% Cut (2 cols) - PACKING ONLY */}
                                    {(activeView === 'PACKING_DATA' || activeView === 'PACKING_2_DATA') && (
                                       <button
                                          onClick={() => setIsHalfCountMode(!isHalfCountMode)}
                                          className={\`col-span-6 sm:col-span-4 md:col-span-3 lg:col-span-2 h-11 px-3 flex items-center justify-center gap-1.5 rounded-xl border-2 transition-all duration-200 active:scale-95 text-xs font-bold shadow-2xs w-full \${isHalfCountMode ? 'bg-gradient-to-r from-red-500 to-rose-600 border-red-600 text-white shadow-sm shadow-red-500/25' : 'bg-red-50/80 border-red-300 text-red-600 hover:bg-red-100/80 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'}\`}
                                          title="Toggle 50% View"
                                       >
                                          <span className="truncate">50% Cut</span>
                                       </button>
                                    )}

                                    {/* Copy Options / Salin Barcode */}
                                    {['PACKING_DATA', 'PACKING_2_DATA', 'LEADER_PENDING_ADMIN', 'GUDANG_PENDING', 'GUDANG_READY', 'GUDANG_CANCEL', 'GUDANG_BUNDLING'].includes(activeView) && currentAdmin?.username !== 'logistik' && (
                                       <div className={\`col-span-6 sm:col-span-4 md:col-span-3 \${activeView.startsWith('GUDANG_') ? 'lg:col-span-3' : 'lg:col-span-2'} h-11 w-full\`}>
                                          <button
                                             onClick={() => handleCopyAllBarcodes(false, ['GUDANG_PENDING', 'GUDANG_READY', 'GUDANG_CANCEL', 'GUDANG_REPORT', 'GUDANG_BUNDLING'].includes(activeView))}
                                             disabled={isCopyingBarcodes}
                                             className="w-full h-full px-3 flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-50/80 hover:bg-white dark:bg-gray-800/90 dark:hover:bg-gray-800 text-gray-700 hover:text-gray-900 dark:text-gray-200 transition-all duration-200 active:scale-95 text-xs font-bold shadow-2xs cursor-pointer"
                                          >
                                             <Copy size={15} className="shrink-0 text-gray-500 dark:text-gray-400" /> <span className="truncate">Salin Barcode</span>
                                          </button>
                                       </div>
                                    )}

                                    {/* Reset Filter Button */}
                                    <div className="col-span-3 sm:col-span-2 md:col-span-1 lg:col-span-1 h-11 flex justify-center ml-auto w-full">
                                       <button
                                          onClick={() => {
                                             if (activeView === 'OJOL_DATA') { setFilterOjolShift('ALL'); setFilterOjolStaff('ALL'); setOjolSearch(''); }
                                             else { handleResetPackingFilters(); }
                                          }}
                                          className="h-full w-full aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition-all duration-200 active:scale-95 shadow-2xs border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 mx-auto cursor-pointer"
                                          title="Reset Filters"
                                       >
                                          <RotateCcw size={16} />
                                       </button>
                                    </div>

                                    {/* Export / Sync Buttons */}
                                    {activeView === 'CHECKER_DATA' && (
                                       <div className="col-span-9 sm:col-span-4 md:col-span-3 lg:col-span-3 h-11 w-full ml-auto">
                                          <button
                                             onClick={handleSyncChecker}
                                             disabled={isSyncingChecker || isLoadingPacking}
                                             className="w-full h-full px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-xs shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs sm:text-sm cursor-pointer"
                                             title="Sync dari Picker"
                                          >
                                             <RefreshCw size={15} className={isSyncingChecker ? 'animate-spin' : ''} /> <span>Sync Picker</span>
                                          </button>
                                       </div>
                                    )}
                                    
                                    {currentAdmin?.username !== 'logistik' && activeView !== 'GUDANG_REPORT' && activeView !== 'CHECKER_DATA' && (
                                       <div className="col-span-9 sm:col-span-4 md:col-span-3 lg:col-span-3 h-11 w-full ml-auto">
                                          <button
                                             onClick={activeView === 'OJOL_DATA' ? handleExportOjolData : handleExportPackingData}
                                             disabled={activeView === 'OJOL_DATA' ? (isExportingOjol || isLoadingOjol) : (isExportingPacking || isLoadingPacking)}
                                             className="w-full h-full px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-xs shadow-emerald-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs sm:text-sm cursor-pointer"
                                             title="Export CSV"
                                          >
                                             <FileDown size={16} /> <span>Export</span>
                                          </button>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           ) : (
                              `;

const before = norm.substring(0, startIdx);
const after = norm.substring(endIdx);

const updatedCode = before + newToolbarJSX + after;
const finalCode = isCRLF ? updatedCode.replace(/\n/g, '\r\n') : updatedCode;
fs.writeFileSync(targetFile, finalCode, 'utf8');

console.log("🎉 Successfully applied clean full-area clickable date filters without block selection!");
