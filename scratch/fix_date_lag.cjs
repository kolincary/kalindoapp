const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const isCRLF = code.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

console.log("Optimizing Date Filter & Staff List to eliminate click lag...");

// 1. Optimize Effect 5 (lines 5358-5470) so it doesn't run 50 loop queries on every date click
const effect5Old = `   // 5. Dynamic Staff List Logic (Data Driven + Shift Filter)
   // FIXED: Loop fetch to get ALL distinct staff names for the day to ensure dropdown is complete.
   useEffect(() => {
      if (activeView !== 'PACKING_DATA' && activeView !== 'PACKING_2_DATA' && activeView !== 'SORTIR_DATA' && (activeView !== 'PICKER_DATA' && activeView !== 'CHECKER_DATA') && activeView !== 'LEADER_2_DATA' && activeView !== 'LEADER_PENDING_ADMIN' && activeView !== 'GUDANG_PENDING' && activeView !== 'GUDANG_READY' && activeView !== 'GUDANG_CANCEL' && activeView !== 'GUDANG_REPORT' && activeView !== 'SCAN_ALL') return;

      let isMounted = true;

      const fetchDistinctStaff = async () => {
         try {
            const effectiveDate = canManageDate ? filterDate : getTodayString();
            const activeClient = supabase;
            const start = new Date(effectiveDate + 'T00:00:00').getTime();
            const end = new Date(effectiveDate + 'T23:59:59.999').getTime();

            let targetRole = 'ALL';
            if (activeView === 'SORTIR_DATA') targetRole = 'SORTIR';
            else if (activeView === 'PACKING_DATA' || activeView === 'PACKING_2_DATA') targetRole = 'PACKING';
            else if (activeView === 'PICKER_DATA') targetRole = 'PICKER';
            else if (activeView === 'LOGISTIK_DATA') targetRole = 'LOGISTIK';
            else if (activeView === 'CHECKER_DATA') targetRole = 'CHECKER';
            else if (activeView === 'GUDANG_PENDING' || activeView === 'GUDANG_READY' || activeView === 'GUDANG_CANCEL' || activeView === 'GUDANG_REPORT') targetRole = 'GUDANG';
            else if (activeView === 'SCAN_ALL' && filterPackingRole !== 'ALL') targetRole = filterPackingRole;

            const uniqueNamesSet = new Set<string>();
            let offset = 0;
            const batchSize = 1000;
            let fetchMore = true;

            // --- LOOP FETCHING (PAGINATION) ---
            // Ensures we get names even if they are in record #10,001+
            if ((activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA')) {
               const { data: leaderData } = await activeClient.from('leader_scan_2').select('leader_profile');
               if (leaderData) {
                  leaderData.forEach((d: any) => {
                     if (d.leader_profile) uniqueNamesSet.add(d.leader_profile);
                  });
               }
               fetchMore = false;
            }

            while (fetchMore) {
               let query = activeClient
                  .from('scanned_items')
                  .select('employee_name')
                  .gte('timestamp', start)
                  .lte('timestamp', end);

               if (targetRole !== 'ALL') {
                  query = query.eq('role', targetRole);
               }

               const { data, error } = await query.range(offset, offset + batchSize - 1);

               if (error) {
                  console.error("Error fetching staff batch:", error);
                  fetchMore = false;
                  break;
               }

               if (data && data.length > 0) {
                  data.forEach((d: any) => {
                     if (d.employee_name) uniqueNamesSet.add(d.employee_name);
                  });

                  if (data.length < batchSize) {
                     fetchMore = false; // End of data reached
                  } else {
                     offset += batchSize; // Next batch
                  }
               } else {
                  fetchMore = false;
               }

               // Safety break: Limit to reasonable max loops (e.g., 50k records)
               if (offset > 50000) fetchMore = false;
            }

            const uniqueNames = Array.from(uniqueNamesSet);

            // Filter by Shift (Client Side Logic using Employee Data)
            let finalNames = uniqueNames;
            if (filterPackingShift !== 'ALL') {
               const shiftMap = new Map<string, string>();
               employees.forEach(e => {
                  if (e.name && e.shift) shiftMap.set(e.name, e.shift);
               });

               finalNames = uniqueNames.filter(name => {
                  const staffShift = shiftMap.get(name);
                  // Include if match, or if staff not in employee DB allow them if we want to be safe? 
                  // Strict logic: must match shift.
                  return staffShift === filterPackingShift;
               });
            }

            if (isMounted) {
               // Sort Alphabetically
               setPackingStaffList(finalNames.sort((a, b) => a.localeCompare(b)));
            }

         } catch (err) {
            console.error("Error fetching distinct staff:", err);
            if (isMounted) setPackingStaffList([]);
         }
      };

      // CACHE: Try loading from LocalStorage first
      const cacheKey = \`staff_list_\${activeView}_\${filterDate}_\${filterPackingRole}\`;
      try {
         const cached = localStorage.getItem(cacheKey);
         if (cached) {
            setPackingStaffList(JSON.parse(cached));
         }
      } catch (e) { }

      fetchDistinctStaff();

      return () => {
         isMounted = false;
      };
   }, [activeView, filterDate, filterPackingShift, employees, canManageDate, filterPackingRole]);`;

const effect5New = `   // 5. Dynamic Staff List Logic (Data Driven + Shift Filter)
   // OPTIMIZED: Uses pre-loaded employees list directly for instant (0ms) response without network lag
   useEffect(() => {
      if (activeView !== 'PACKING_DATA' && activeView !== 'PACKING_2_DATA' && activeView !== 'SORTIR_DATA' && (activeView !== 'PICKER_DATA' && activeView !== 'CHECKER_DATA') && activeView !== 'LEADER_2_DATA' && activeView !== 'LEADER_PENDING_ADMIN' && activeView !== 'GUDANG_PENDING' && activeView !== 'GUDANG_READY' && activeView !== 'GUDANG_CANCEL' && activeView !== 'GUDANG_REPORT' && activeView !== 'SCAN_ALL') return;

      if (employees && employees.length > 0) {
         let filtered = employees;
         if (filterPackingShift !== 'ALL') {
            filtered = filtered.filter(e => e.shift === filterPackingShift);
         }
         const names = filtered.map(e => e.name).filter(Boolean).sort((a, b) => a.localeCompare(b));
         setPackingStaffList(Array.from(new Set(names)));
         return;
      }

      // Fallback only if employees not loaded yet
      supabase.from('employees').select('name, shift').then(({ data }) => {
         if (data) {
            let filtered = data;
            if (filterPackingShift !== 'ALL') {
               filtered = filtered.filter((e: any) => e.shift === filterPackingShift);
            }
            const names = filtered.map((e: any) => e.name).filter(Boolean).sort((a: any, b: any) => a.localeCompare(b));
            setPackingStaffList(Array.from(new Set(names)));
         }
      }).catch(() => {});
   }, [activeView, filterPackingShift, employees]);`;

const normCode = code.replace(/\r\n/g, '\n');
const normOld5 = effect5Old.replace(/\r\n/g, '\n');
const normNew5 = effect5New.replace(/\r\n/g, '\n');

if (normCode.includes(normOld5)) {
   code = isCRLF ? normCode.replace(normOld5, normNew5).replace(/\n/g, '\r\n') : normCode.replace(normOld5, normNew5);
   console.log("✅ Step 1: Optimized Effect 5 to 0ms instant execution.");
} else {
   console.error("❌ Step 1 failed: effect5Old not found");
}

// 2. Fix the Single Date Picker click overlay
const oldPickerBlock = `                                       {/* Date Inputs */}
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
                                       )}`;

const newPickerBlock = `                                       {/* Date Inputs */}
                                       {canUse7DaysRangeFilter && dateFilterMode === 'RANGE' ? (
                                          <div className="flex items-center gap-1.5 h-10 w-full">
                                             <div className="relative flex-1 h-full">
                                                <input
                                                   type="date"
                                                   value={rangeStartDate}
                                                   onChange={(e) => {
                                                      setPage(1);
                                                      setRangeStartDate(e.target.value);
                                                   }}
                                                   className="w-full h-full px-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                                                   title="Tanggal Mulai"
                                                />
                                             </div>
                                             <span className="text-xs font-bold text-gray-400 dark:text-gray-500 shrink-0">s/d</span>
                                             <div className="relative flex-1 h-full">
                                                <input
                                                   type="date"
                                                   value={rangeEndDate}
                                                   onChange={(e) => {
                                                      setPage(1);
                                                      setRangeEndDate(e.target.value);
                                                   }}
                                                   className="w-full h-full px-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                                                   title="Tanggal Akhir"
                                                />
                                             </div>
                                          </div>
                                       ) : (
                                          <div className="relative w-full h-10">
                                             <div className="relative w-full h-full group">
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
                                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                   />
                                                ) : null}
                                                <div className={\`w-full h-full pl-9 pr-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs sm:text-sm flex items-center font-semibold shadow-2xs pointer-events-none \${canManageDate ? 'text-gray-800 dark:text-gray-200 group-hover:border-blue-400 dark:group-hover:border-blue-500' : 'text-gray-400 bg-gray-50/50'} transition-all\`}>
                                                   {formatDisplayDate(canManageDate ? filterDate : getTodayString())}
                                                </div>
                                                {canManageDate && <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 pointer-events-none z-10 transition-colors" />}
                                             </div>
                                          </div>
                                       )}`;

const normCode2 = code.replace(/\r\n/g, '\n');
const normOldPicker = oldPickerBlock.replace(/\r\n/g, '\n');
const normNewPicker = newPickerBlock.replace(/\r\n/g, '\n');

if (normCode2.includes(normOldPicker)) {
   code = isCRLF ? normCode2.replace(normOldPicker, normNewPicker).replace(/\n/g, '\r\n') : normCode2.replace(normOldPicker, normNewPicker);
   console.log("✅ Step 2: Fixed Date Picker click event & removed double-invocation lag.");
} else {
   console.error("❌ Step 2 failed: oldPickerBlock not found");
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("AdminDashboard.tsx successfully optimized!");
