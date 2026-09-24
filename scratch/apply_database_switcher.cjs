const fs = require('fs');

let code = fs.readFileSync('./components/AdminDashboard.tsx', 'utf8');

// 1. Initialize forcedDataSource from localStorage
code = code.replace(
  "const [forcedDataSource, setForcedDataSource] = useState<'AUTO' | 'SUPABASE' | 'FIRESTORE'>('AUTO');",
  `const [forcedDataSource, setForcedDataSource] = useState<'SUPABASE' | 'FIRESTORE'>(() => {
      return (localStorage.getItem('admin_active_db_source') as 'SUPABASE' | 'FIRESTORE') || 'SUPABASE';
   });

   const handleSwitchDatabase = (newSource: 'SUPABASE' | 'FIRESTORE') => {
      setForcedDataSource(newSource);
      localStorage.setItem('admin_active_db_source', newSource);
      setPage(1);
      if (activeView === 'OJOL_DATA') {
         // fetchOjolData handles through dependency
      } else {
         fetchPackingData(1, newSource);
      }
   };`
);

// 2. In fetchPackingData signature and effectiveSource
code = code.replace(
  "const fetchPackingData = async (targetPage = page, forceSource?: 'AUTO' | 'SUPABASE' | 'FIRESTORE') => {",
  "const fetchPackingData = async (targetPage = page, forceSource?: 'SUPABASE' | 'FIRESTORE') => {"
);

code = code.replace(
  "const effectiveSource = forceSource || forcedDataSource;",
  "const effectiveSource = forceSource || forcedDataSource || 'SUPABASE';"
);

// 3. Make fetchPackingData strictly follow effectiveSource
const oldFsCheck = `         const isSupportedView = supportedFallbackViews.includes(activeView);
         const shouldCheckFirestore = isSupportedView && (
            effectiveSource === 'FIRESTORE' ||
            sbCount === 0 ||
            sbCount < 500 ||
            firestoreDayDataCache.has(targetDateStr)
         );

         if (shouldCheckFirestore) {`;

const newFsCheck = `         const isSupportedView = supportedFallbackViews.includes(activeView);
         const shouldCheckFirestore = isSupportedView && (effectiveSource === 'FIRESTORE');

         if (shouldCheckFirestore) {`;

code = code.replace(oldFsCheck, newFsCheck);

// Also make sure when effectiveSource === 'FIRESTORE' in fetchPackingData, it returns Firestore results
const oldCondition = `if (effectiveSource === 'FIRESTORE' || (fsRoleItems.length > sbCount && fsRoleItems.length > 0) || (sbCount === 0 && fsRoleItems.length > 0)) {`;
const newCondition = `if (effectiveSource === 'FIRESTORE' || fsRoleItems.length > 0) {`;
code = code.replace(oldCondition, newCondition);

// 4. Update fetchOjolData to support Firestore when forcedDataSource === 'FIRESTORE'
const oldFetchOjol = `   const fetchOjolData = useCallback(async () => {
      if (activeView !== 'OJOL_DATA') return;
      setIsLoadingOjol(true);
      try {
         const effectiveDate = canManageDate ? filterDate : getTodayString();
         const activeClient = supabase;

         // 1. Get Shift/Map Info
         const { data: empData } = await activeClient.from('employees').select('name, shift');
         const shiftToNamesMap: Record<string, string[]> = {};
         const staffList: string[] = [];

         if (empData) {
            empData.forEach((e: any) => {
               if (e.shift) {
                  if (!shiftToNamesMap[e.shift]) shiftToNamesMap[e.shift] = [];
                  shiftToNamesMap[e.shift].push(e.name);
               }
               if (e.name) staffList.push(e.name);
            });
         }

         // APPLY SHIFT FILTER TO STAFF LIST
         let visibleStaff = staffList;
         if (filterOjolShift !== 'ALL') {
            visibleStaff = shiftToNamesMap[filterOjolShift] || [];
         }
         setOjolStaffList(Array.from(new Set(visibleStaff)).sort());

         // 2. Build Query & Pagination
         const query = buildOjolQuery(shiftToNamesMap);
         const from = (page - 1) * rowsPerPage;
         const to = from + rowsPerPage - 1;

         const { data, count, error } = await query.range(from, to);
         if (error) throw error;
         const finalData = data || [];
         setTotalRows(count || 0);

         // 3. Enrich with Shift info
         const shiftMap = new Map<string, string>();
         if (empData) {
            empData.forEach((e: any) => shiftMap.set(e.name, e.shift));
         }

         const enriched = finalData.map((item: any) => {
            let rawBarcode = (item.barcode || '').toString().trim();
            if (rawBarcode.startsWith('0026') || rawBarcode.startsWith('002')) {
               rawBarcode = rawBarcode.replace(/^00/, '');
            }
            if (/^LXAD[^-]/i.test(rawBarcode)) {
               rawBarcode = 'LXAD-' + rawBarcode.substring(4);
            }
            if (/^JNAP[^-]/i.test(rawBarcode)) {
               rawBarcode = 'JNAP-' + rawBarcode.substring(4);
            }
            if (/^JNEB[^-]/i.test(rawBarcode)) {
               rawBarcode = 'JNEB-' + rawBarcode.substring(4);
            }
            return {
               ...item,
               barcode: rawBarcode,
               shift: shiftMap.get(item.employee_name) || '-'
            };
         });
         setOjolData(enriched);

         // 4. Stats Query (Separate to ignore pagination)
         const statsQuery = buildOjolQuery(shiftToNamesMap); // Same filters
         const { data: allStatsData } = await statsQuery.select('barcode, employee_name, timestamp');

         if (allStatsData) {
            const uniqueBarcodes = new Set(allStatsData.map((i: any) => i.barcode)).size;
            const uniqueStaff = new Set(allStatsData.map((i: any) => i.employee_name)).size;
            const latest = allStatsData.length > 0 ? new Date(allStatsData[0].timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
            setOjolStats({
               total: count || 0,
               distinctBarcodes: uniqueBarcodes,
               activeStaff: uniqueStaff,
               latest
            });
         }
      } catch (err: any) {
         console.error("Fetch Ojol Error", err);
      } finally {
         setIsLoadingOjol(false);
      }
   }, [activeView, filterOjolShift, filterOjolStaff, filterDate, page, rowsPerPage, ojolSearch]);`;

const newFetchOjol = `   const fetchOjolData = useCallback(async () => {
      if (activeView !== 'OJOL_DATA') return;
      setIsLoadingOjol(true);
      try {
         const effectiveDate = canManageDate ? filterDate : getTodayString();
         const activeClient = supabase;

         // 1. Get Shift/Map Info
         const { data: empData } = await activeClient.from('employees').select('name, shift');
         const shiftToNamesMap: Record<string, string[]> = {};
         const staffList: string[] = [];

         if (empData) {
            empData.forEach((e: any) => {
               if (e.shift) {
                  if (!shiftToNamesMap[e.shift]) shiftToNamesMap[e.shift] = [];
                  shiftToNamesMap[e.shift].push(e.name);
               }
               if (e.name) staffList.push(e.name);
            });
         }

         // APPLY SHIFT FILTER TO STAFF LIST
         let visibleStaff = staffList;
         if (filterOjolShift !== 'ALL') {
            visibleStaff = shiftToNamesMap[filterOjolShift] || [];
         }
         setOjolStaffList(Array.from(new Set(visibleStaff)).sort());

         const shiftMap = new Map<string, string>();
         if (empData) {
            empData.forEach((e: any) => shiftMap.set(e.name, e.shift));
         }

         // FIRESTORE BRANCH FOR OJOL
         if (forcedDataSource === 'FIRESTORE') {
            const startMs = new Date(\`\${effectiveDate}T00:00:00\`).getTime();
            const endMs = new Date(\`\${effectiveDate}T23:59:59.999\`).getTime();

            let dayDocs: any[] = [];
            if (firestoreDayDataCache.has(effectiveDate)) {
               dayDocs = firestoreDayDataCache.get(effectiveDate)!;
            } else {
               setFirestoreLoadingText('Mengambil data Ojol dari Firestore...');
               const activeFsQuery = fsQuery(
                  collection(db, 'scanned_items'),
                  where('timestamp', '>=', startMs),
                  where('timestamp', '<=', endMs)
               );
               const fsSnap = await getDocs(activeFsQuery);
               dayDocs = fsSnap.docs.map(docSnap => ({
                  id: docSnap.id,
                  ...(docSnap.data() as Record<string, any>)
               }));
               firestoreDayDataCache.set(effectiveDate, dayDocs);
               setFirestoreLoadingText('');
            }

            let fsOjolItems: any[] = [];
            dayDocs.forEach(d => {
               const r = (d.role || '').toUpperCase();
               if (r === 'OJOL' || r === 'OJOL_DATA') {
                  let rawBarcode = (d.barcode || '').toString().trim();
                  if (rawBarcode.startsWith('0026') || rawBarcode.startsWith('002')) rawBarcode = rawBarcode.replace(/^00/, '');
                  if (/^LXAD[^-]/i.test(rawBarcode)) rawBarcode = 'LXAD-' + rawBarcode.substring(4);
                  if (/^JNAP[^-]/i.test(rawBarcode)) rawBarcode = 'JNAP-' + rawBarcode.substring(4);
                  if (/^JNEB[^-]/i.test(rawBarcode)) rawBarcode = 'JNEB-' + rawBarcode.substring(4);

                  const empName = d.employee_name || d.admin_name || d.leader_name || '-';
                  fsOjolItems.push({
                     ...d,
                     barcode: rawBarcode,
                     employee_name: empName,
                     shift: shiftMap.get(empName) || 'Unknown',
                     is_from_firestore: true
                  });
               }
            });

            if (filterOjolStaff && filterOjolStaff !== 'ALL') {
               fsOjolItems = fsOjolItems.filter(item => item.employee_name === filterOjolStaff);
            }
            if (filterOjolShift && filterOjolShift !== 'ALL') {
               const validNames = new Set(shiftToNamesMap[filterOjolShift] || []);
               fsOjolItems = fsOjolItems.filter(item => validNames.has(item.employee_name));
            }
            if (ojolSearch) {
               const term = ojolSearch.toLowerCase();
               fsOjolItems = fsOjolItems.filter(item =>
                  (item.barcode && item.barcode.toLowerCase().includes(term)) ||
                  (item.employee_name && item.employee_name.toLowerCase().includes(term))
               );
            }

            fsOjolItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            const totalFsCount = fsOjolItems.length;
            const from = (page - 1) * rowsPerPage;
            const to = from + rowsPerPage - 1;
            const pageItems = fsOjolItems.slice(from, to + 1);

            setOjolData(pageItems);
            setTotalRows(totalFsCount);
            setActiveDataSource('FIRESTORE');

            const uniqueBarcodes = new Set(fsOjolItems.map((i: any) => i.barcode)).size;
            const uniqueStaff = new Set(fsOjolItems.map((i: any) => i.employee_name)).size;
            const latest = fsOjolItems.length > 0 ? new Date(fsOjolItems[0].timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
            setOjolStats({
               total: totalFsCount,
               distinctBarcodes: uniqueBarcodes,
               activeStaff: uniqueStaff,
               latest
            });
            setIsLoadingOjol(false);
            return;
         }

         // SUPABASE BRANCH FOR OJOL
         const query = buildOjolQuery(shiftToNamesMap);
         const from = (page - 1) * rowsPerPage;
         const to = from + rowsPerPage - 1;

         const { data, count, error } = await query.range(from, to);
         if (error) throw error;
         const finalData = data || [];
         setTotalRows(count || 0);
         setActiveDataSource('SUPABASE');

         const enriched = finalData.map((item: any) => {
            let rawBarcode = (item.barcode || '').toString().trim();
            if (rawBarcode.startsWith('0026') || rawBarcode.startsWith('002')) {
               rawBarcode = rawBarcode.replace(/^00/, '');
            }
            if (/^LXAD[^-]/i.test(rawBarcode)) {
               rawBarcode = 'LXAD-' + rawBarcode.substring(4);
            }
            if (/^JNAP[^-]/i.test(rawBarcode)) {
               rawBarcode = 'JNAP-' + rawBarcode.substring(4);
            }
            if (/^JNEB[^-]/i.test(rawBarcode)) {
               rawBarcode = 'JNEB-' + rawBarcode.substring(4);
            }
            return {
               ...item,
               barcode: rawBarcode,
               shift: shiftMap.get(item.employee_name) || '-'
            };
         });
         setOjolData(enriched);

         // Stats Query (Separate to ignore pagination)
         const statsQuery = buildOjolQuery(shiftToNamesMap);
         const { data: allStatsData } = await statsQuery.select('barcode, employee_name, timestamp');

         if (allStatsData) {
            const uniqueBarcodes = new Set(allStatsData.map((i: any) => i.barcode)).size;
            const uniqueStaff = new Set(allStatsData.map((i: any) => i.employee_name)).size;
            const latest = allStatsData.length > 0 ? new Date(allStatsData[0].timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
            setOjolStats({
               total: count || 0,
               distinctBarcodes: uniqueBarcodes,
               activeStaff: uniqueStaff,
               latest
            });
         }
      } catch (err: any) {
         console.error("Fetch Ojol Error", err);
      } finally {
         setIsLoadingOjol(false);
      }
   }, [activeView, filterOjolShift, filterOjolStaff, filterDate, page, rowsPerPage, ojolSearch, forcedDataSource]);`;

code = code.replace(oldFetchOjol, newFetchOjol);

// 5. Add forcedDataSource to main packing useEffect dependencies
code = code.replace(
  "}, [page, rowsPerPage, filterPackingStaff, filterPackingShift, packingSearch, filterDate, dateFilterMode, rangeStartDate, rangeEndDate, filterPackingRole, activeView, filterCancelOnly, filterPickerType]);",
  "}, [page, rowsPerPage, filterPackingStaff, filterPackingShift, packingSearch, filterDate, dateFilterMode, rangeStartDate, rangeEndDate, filterPackingRole, activeView, filterCancelOnly, filterPickerType, forcedDataSource]);"
);

// 6. Update TOP SUB-ROW to include modern Database Switcher Pill
const oldTopSubRow = `                                  {/* TOP SUB-ROW: Mode Selector (1 Hari / Rentang Tanggal) */}
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
                                           <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-200/60 dark:border-indigo-800/40 transition-all">
                                              {isLoadingPacking ? (
                                                 <>
                                                    <Loader2 size={13} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                                                    <span>Mengambil Data Firestore...</span>
                                                 </>
                                              ) : (
                                                 <>
                                                    <Database size={13} />
                                                    <span>Mode Rentang 7 Hari (Firestore)</span>
                                                 </>
                                              )}
                                           </div>
                                        )}
                                     </div>
                                  )}`;

const newTopSubRow = `                                  {/* TOP SUB-ROW: Mode Selector & Database Switcher (Supabase vs Firestore) */}
                                  <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-gray-200/70 dark:border-gray-800/80 flex-wrap">
                                     <div className="flex items-center gap-2.5 flex-wrap">
                                        {canUse7DaysRangeFilter && (
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
                                        )}

                                        {canUse7DaysRangeFilter && dateFilterMode === 'RANGE' && (
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

                                     {/* Database Switcher (Supabase vs Firestore) for Packing, Picker, Logistik, Checker, Ojol */}
                                     {['PACKING_DATA', 'PACKING_2_DATA', 'SORTIR_DATA', 'PICKER_DATA', 'CHECKER_DATA', 'LOGISTIK_DATA', 'OJOL_DATA', 'LEADER_2_DATA', 'SCAN_ALL'].includes(activeView) && (
                                        <div className="flex items-center gap-2 ml-auto">
                                           <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 hidden sm:inline-block">
                                              Database Aktif:
                                           </span>
                                           <div className="inline-flex rounded-xl p-1 bg-gray-100/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 text-xs font-bold shadow-2xs">
                                              <button
                                                 type="button"
                                                 onClick={() => handleSwitchDatabase('SUPABASE')}
                                                 className={\`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 \${
                                                    forcedDataSource === 'SUPABASE'
                                                       ? 'bg-blue-600 text-white shadow-xs font-black ring-1 ring-blue-500/50'
                                                       : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'
                                                 }\`}
                                                 title="Gunakan database Supabase sebagai sumber data aktif"
                                              >
                                                 <Zap size={13} className={forcedDataSource === 'SUPABASE' ? 'text-yellow-300' : 'text-gray-400'} />
                                                 <span>Supabase</span>
                                              </button>
                                              <button
                                                 type="button"
                                                 onClick={() => handleSwitchDatabase('FIRESTORE')}
                                                 className={\`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 \${
                                                    forcedDataSource === 'FIRESTORE'
                                                       ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-xs font-black ring-1 ring-amber-500/50'
                                                       : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-semibold'
                                                 }\`}
                                                 title="Gunakan database Firestore sebagai sumber data aktif"
                                              >
                                                 <Flame size={13} className={forcedDataSource === 'FIRESTORE' ? 'text-yellow-200 animate-pulse' : 'text-gray-400'} />
                                                 <span>Firestore</span>
                                              </button>
                                           </div>
                                        </div>
                                     )}
                                  </div>`;

code = code.replace(oldTopSubRow, newTopSubRow);

// 7. Update footer source badge buttons to use handleSwitchDatabase
code = code.replace(
  "setForcedDataSource('SUPABASE');\n                                                            fetchPackingData(1, 'SUPABASE');",
  "handleSwitchDatabase('SUPABASE');"
);

code = code.replace(
  "setForcedDataSource('FIRESTORE');\n                                                            fetchPackingData(1, 'FIRESTORE');",
  "handleSwitchDatabase('FIRESTORE');"
);

fs.writeFileSync('./components/AdminDashboard.tsx', code, 'utf8');
console.log('Successfully applied Database Switcher changes to AdminDashboard.tsx!');
