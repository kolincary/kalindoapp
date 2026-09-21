const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original content length:', content.length);

// 1. Update pickerLogistikMatchFilter and compComparisonStats types
const oldFilterState = `   const [pickerLogistikMatchFilter, setPickerLogistikMatchFilter] = useState<'ALL' | 'MATCH' | 'CANCEL' | 'UNMATCH'>('ALL');`;
const newFilterState = `   const [pickerLogistikMatchFilter, setPickerLogistikMatchFilter] = useState<'ALL' | 'MATCH' | 'PENDING_LT3' | 'CANCEL' | 'UNMATCH'>('ALL');`;

if (!content.includes(oldFilterState)) {
   console.error('Could not find oldFilterState!');
} else {
   content = content.replace(oldFilterState, newFilterState);
   console.log('1. Updated pickerLogistikMatchFilter state type.');
}

// 2. Update compComparisonStats state structure
const oldStatsState = `   const [compComparisonStats, setCompComparisonStats] = useState<{
      totalPicker: number;
      pickerCount: number;
      ojolCount: number;
      totalLogistik: number;
      matchCount: number;
      matchTodayCount: number;
      matchPrevCount: number;
      pendingLt3Count: number;
      resolvedSusulanCount: number;
      cancelLogistikCount: number;
      cancelPickerCount: number;
      totalMatchLogistik: number;
      pureUnmatchLogistik: number;
      pickerUnmatchCount: number;
      logistikUnmatchCount: number;
      matchPercentage: string;
      satuanCount: number;
      packingListCount: number;
      uniqueStaff: number;
   }>({
      totalPicker: 0,
      pickerCount: 0,
      ojolCount: 0,
      totalLogistik: 0,
      matchCount: 0,
      matchTodayCount: 0,
      matchPrevCount: 0,
      pendingLt3Count: 0,
      resolvedSusulanCount: 0,
      cancelLogistikCount: 0,
      cancelPickerCount: 0,
      totalMatchLogistik: 0,
      pureUnmatchLogistik: 0,
      pickerUnmatchCount: 0,
      logistikUnmatchCount: 0,
      matchPercentage: '0%',
      satuanCount: 0,
      packingListCount: 0,
      uniqueStaff: 0
   });`;

const newStatsState = `   const [compComparisonStats, setCompComparisonStats] = useState<{
      totalPicker: number;
      pickerCount: number;
      ojolCount: number;
      totalLogistik: number;
      matchCount: number;
      matchTodayCount: number;
      matchPrevCount: number;
      pendingLt3Count: number;
      pendingLt3PickerCount: number;
      pendingLt3LogistikCount: number;
      resolvedSusulanCount: number;
      cancelLogistikCount: number;
      cancelPickerCount: number;
      totalMatchLogistik: number;
      pureUnmatchLogistik: number;
      pickerUnmatchCount: number;
      logistikUnmatchCount: number;
      matchPercentage: string;
      satuanCount: number;
      packingListCount: number;
      uniqueStaff: number;
   }>({
      totalPicker: 0,
      pickerCount: 0,
      ojolCount: 0,
      totalLogistik: 0,
      matchCount: 0,
      matchTodayCount: 0,
      matchPrevCount: 0,
      pendingLt3Count: 0,
      pendingLt3PickerCount: 0,
      pendingLt3LogistikCount: 0,
      resolvedSusulanCount: 0,
      cancelLogistikCount: 0,
      cancelPickerCount: 0,
      totalMatchLogistik: 0,
      pureUnmatchLogistik: 0,
      pickerUnmatchCount: 0,
      logistikUnmatchCount: 0,
      matchPercentage: '0%',
      satuanCount: 0,
      packingListCount: 0,
      uniqueStaff: 0
   });`;

if (!content.includes(oldStatsState)) {
   console.error('Could not find oldStatsState!');
} else {
   content = content.replace(oldStatsState, newStatsState);
   console.log('2. Updated compComparisonStats state structure.');
}

// 3. Add fetchAllActivePendingScans and update loadDualComparisonData
const oldFetchSection = `   // Helper: Loop fetch all records from Supabase with selective columns for ultra-fast performance
   const fetchAllRecordsForRoles = async (roles: string[], startMs: number, endMs: number) => {
      let allData: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
         let pageData: any[] | null = null;
         let pageError: any = null;

         for (let attempt = 0; attempt < 3; attempt++) {
            const { data, error } = await supabase
               .from('scanned_items')
               .select('id, barcode, employee_name, timestamp, role, menu_context')
               .in('role', roles)
               .gte('timestamp', startMs)
               .lte('timestamp', endMs)
               .order('timestamp', { ascending: true })
               .order('id', { ascending: true })
               .range(offset, offset + batchSize - 1);

            pageData = data;
            pageError = error;
            if (!error && data) break;
            await new Promise(r => setTimeout(r, 300));
         }

         if (pageError || !pageData || pageData.length === 0) {
            hasMore = false;
            break;
         }
         allData.push(...pageData);
         if (pageData.length < batchSize) {
            hasMore = false;
         } else {
            offset += batchSize;
         }
      }
      return allData;
   };

   const loadDualComparisonData = async () => {
      setIsLoadingDualComparison(true);
      try {
         const effectiveDate = canManageDate ? filterDate : getTodayString();
         const start = new Date(effectiveDate + 'T00:00:00').getTime();
         const end = new Date(effectiveDate + 'T23:59:59.999').getTime();

         // 1. Fetch PICKER, OJOL, LOGISTIK, LEADER, and CANCELLED ORDERS parallel in a single lightning-fast burst
         const [pickerRaw, ojolRaw, logistikRaw, leaderRes, cancelRows] = await Promise.all([
            fetchAllRecordsForRoles(['PICKER', 'Picker', 'PICKER_2'], start, end),
            fetchAllRecordsForRoles(['OJOL', 'Ojol'], start, end),
            fetchAllRecordsForRoles(['LOGISTIK', 'Logistik'], start, end),
            supabase
               .from('leader_scan_2')
               .select('barcode, leader_profile, leader_name')
               .gte('timestamp', start)
               .lte('timestamp', end),
            fetchAllCancelledOrdersForDate(effectiveDate)
         ]);`;

const newFetchSection = `   // Helper: Loop fetch all records from Supabase with selective columns for ultra-fast performance
   const fetchAllRecordsForRoles = async (roles: string[], startMs: number, endMs: number) => {
      let allData: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
         let pageData: any[] | null = null;
         let pageError: any = null;

         for (let attempt = 0; attempt < 3; attempt++) {
            const { data, error } = await supabase
               .from('scanned_items')
               .select('id, barcode, employee_name, timestamp, role, menu_context')
               .in('role', roles)
               .gte('timestamp', startMs)
               .lte('timestamp', endMs)
               .order('timestamp', { ascending: true })
               .order('id', { ascending: true })
               .range(offset, offset + batchSize - 1);

            pageData = data;
            pageError = error;
            if (!error && data) break;
            await new Promise(r => setTimeout(r, 300));
         }

         if (pageError || !pageData || pageData.length === 0) {
            hasMore = false;
            break;
         }
         allData.push(...pageData);
         if (pageData.length < batchSize) {
            hasMore = false;
         } else {
            offset += batchSize;
         }
      }
      return allData;
   };

   // Helper: Fetch all active pending scans from Gudang & Leader LT3 (where status/menu_context is PENDING)
   const fetchAllActivePendingScans = async () => {
      try {
         const [gudangRes, leaderRes] = await Promise.all([
            supabase
               .from('scanned_items')
               .select('barcode, employee_name, timestamp, menu_context, status')
               .eq('role', 'GUDANG')
               .or('menu_context.eq.PENDING,status.eq.PENDING'),
            supabase
               .from('leader_pending_scans')
               .select('barcode, leader_profile, leader_name, timestamp, status')
               .eq('status', 'PENDING')
         ]);

         const pendingList: Array<{ barcode: string, staff: string, timestamp?: number, source: 'GUDANG' | 'LEADER' }> = [];
         if (gudangRes && gudangRes.data) {
            gudangRes.data.forEach((item: any) => {
               if (item.barcode) {
                  pendingList.push({
                     barcode: item.barcode,
                     staff: item.employee_name || 'Gudang LT3',
                     timestamp: item.timestamp,
                     source: 'GUDANG'
                  });
               }
            });
         }
         if (leaderRes && leaderRes.data) {
            leaderRes.data.forEach((item: any) => {
               if (item.barcode) {
                  pendingList.push({
                     barcode: item.barcode,
                     staff: item.leader_profile || item.leader_name || 'Leader LT3',
                     timestamp: item.timestamp,
                     source: 'LEADER'
                  });
               }
            });
         }
         return pendingList;
      } catch (err) {
         console.warn('Error fetching active pending scans:', err);
         return [];
      }
   };

   const loadDualComparisonData = async () => {
      setIsLoadingDualComparison(true);
      try {
         const effectiveDate = canManageDate ? filterDate : getTodayString();
         const start = new Date(effectiveDate + 'T00:00:00').getTime();
         const end = new Date(effectiveDate + 'T23:59:59.999').getTime();

         // 1. Fetch PICKER, OJOL, LOGISTIK, LEADER, CANCELLED ORDERS, and ACTIVE PENDING LT3 in parallel
         const [pickerRaw, ojolRaw, logistikRaw, leaderRes, cancelRows, pendingRaw] = await Promise.all([
            fetchAllRecordsForRoles(['PICKER', 'Picker', 'PICKER_2'], start, end),
            fetchAllRecordsForRoles(['OJOL', 'Ojol'], start, end),
            fetchAllRecordsForRoles(['LOGISTIK', 'Logistik'], start, end),
            supabase
               .from('leader_scan_2')
               .select('barcode, leader_profile, leader_name')
               .gte('timestamp', start)
               .lte('timestamp', end),
            fetchAllCancelledOrdersForDate(effectiveDate),
            fetchAllActivePendingScans()
         ]);`;

if (!content.includes(oldFetchSection)) {
   console.error('Could not find oldFetchSection!');
} else {
   content = content.replace(oldFetchSection, newFetchSection);
   console.log('3. Added fetchAllActivePendingScans and updated loadDualComparisonData fetch.');
}

// 4. Update Pending LT3 Map and formattedPicker logic
const oldPendingMapAndPicker = `         // Leader Map
         const leaderMap = new Map<string, string>();
         if (leaderRes && leaderRes.data) {
            leaderRes.data.forEach((l: any) => {
               const raw = (l.barcode || '').trim();
               const name = l.leader_profile || l.leader_name;
               if (raw && name) {
                  leaderMap.set(raw, name);
                  leaderMap.set(raw.toUpperCase(), name);
                  const norm = normalizeBarcodeKey(raw);
                  if (norm) leaderMap.set(norm, name);
               }
            });
         }

         const pickerNormMap = new Map<string, any>();
         const logistikNormSet = new Set<string>();
         const staffSet = new Set<string>();
         let satuanCount = 0;
         let packingListCount = 0;
         let pickerCount = 0;
         let ojolCount = 0;
         let cancelPickerCount = 0;

         logistikRaw.forEach((item: any) => {
            const raw = (item.barcode || '').trim();
            const norm = normalizeBarcodeKey(raw);
            if (norm) {
               logistikNormSet.add(norm);
               logistikNormSet.add(raw.toUpperCase());
            }
         });

         combinedPickerRaw.forEach((item: any) => {
            if (item.employee_name) staffSet.add(item.employee_name.trim());
            const isOjol = (item.role || '').toUpperCase() === 'OJOL';
            if (isOjol) {
               ojolCount++;
            } else {
               pickerCount++;
            }
            const raw = (item.barcode || '').trim();
            if (raw.includes(' ')) packingListCount++;
            else satuanCount++;

            let rawBarcode = (item.barcode || '').toString().trim().toUpperCase();
            let stripped0026 = rawBarcode.startsWith('0026') ? rawBarcode.slice(2) : rawBarcode;
            const norm = normalizeBarcodeKey(rawBarcode);
            const isCancelled = cancelledBarcodeSet.has(rawBarcode) ||
                                cancelledBarcodeSet.has(stripped0026) ||
                                (norm && cancelledBarcodeSet.has(norm));

            if (!isCancelled && norm) {
               pickerNormMap.set(norm, item);
               pickerNormMap.set(rawBarcode.toUpperCase(), item);
            }
         });

         let pickerMatchCount = 0;
         const formattedPicker = combinedPickerRaw.map((item: any) => {
            let rawBarcode = (item.barcode || '').toString().trim();
            let stripped0026 = rawBarcode.startsWith('0026') ? rawBarcode.slice(2) : rawBarcode;
            if (rawBarcode.startsWith('0026')) {
               rawBarcode = rawBarcode.slice(2);
            }
            if (/^LXAD[^-]/i.test(rawBarcode)) rawBarcode = 'LXAD-' + rawBarcode.substring(4);
            if (/^JNAP[^-]/i.test(rawBarcode)) rawBarcode = 'JNAP-' + rawBarcode.substring(4);
            if (/^JNEB[^-]/i.test(rawBarcode)) rawBarcode = 'JNEB-' + rawBarcode.substring(4);

            const norm = normalizeBarcodeKey(rawBarcode);
            const isCancelled = cancelledBarcodeSet.has(rawBarcode.toUpperCase()) ||
                                cancelledBarcodeSet.has(stripped0026.toUpperCase()) ||
                                (norm ? cancelledBarcodeSet.has(norm) : false);

            if (isCancelled) {
               cancelPickerCount++;
            }

            const isMatch = !isCancelled && (logistikNormSet.has(norm) || logistikNormSet.has(rawBarcode.toUpperCase()));
            if (isMatch) pickerMatchCount++;

            const roleCategory = (item.role || '').toUpperCase() === 'OJOL' ? 'OJOL' : 'PICKER';

            return {
               ...item,
               barcode: rawBarcode,
               role_category: roleCategory,
               leader_profile: leaderMap.get(item.barcode) || leaderMap.get(rawBarcode) || leaderMap.get(norm) || '-',
               is_packing_list: rawBarcode.includes(' '),
               is_matched_logistik: isMatch,
               is_cancelled: isCancelled
            };
         });`;

const newPendingMapAndPicker = `         // Leader Map
         const leaderMap = new Map<string, string>();
         if (leaderRes && leaderRes.data) {
            leaderRes.data.forEach((l: any) => {
               const raw = (l.barcode || '').trim();
               const name = l.leader_profile || l.leader_name;
               if (raw && name) {
                  leaderMap.set(raw, name);
                  leaderMap.set(raw.toUpperCase(), name);
                  const norm = normalizeBarcodeKey(raw);
                  if (norm) leaderMap.set(norm, name);
               }
            });
         }

         // Pending LT3 Map & Set
         const pendingLt3Set = new Set<string>();
         const pendingLt3Map = new Map<string, { staff: string, source: 'GUDANG' | 'LEADER', timestamp?: number }>();
         if (pendingRaw && pendingRaw.length > 0) {
            pendingRaw.forEach((p: any) => {
               const raw = (p.barcode || '').toString().trim().toUpperCase();
               const norm = normalizeBarcodeKey(raw);
               const stripped0026 = raw.startsWith('0026') ? raw.slice(2) : raw;
               if (raw) {
                  pendingLt3Set.add(raw);
                  pendingLt3Set.add(stripped0026);
                  pendingLt3Map.set(raw, p);
                  pendingLt3Map.set(stripped0026, p);
               }
               if (norm) {
                  pendingLt3Set.add(norm);
                  pendingLt3Map.set(norm, p);
               }
            });
         }

         const pickerNormMap = new Map<string, any>();
         const logistikNormSet = new Set<string>();
         const staffSet = new Set<string>();
         let satuanCount = 0;
         let packingListCount = 0;
         let pickerCount = 0;
         let ojolCount = 0;
         let cancelPickerCount = 0;
         let pendingLt3PickerCount = 0;

         logistikRaw.forEach((item: any) => {
            const raw = (item.barcode || '').trim();
            const norm = normalizeBarcodeKey(raw);
            if (norm) {
               logistikNormSet.add(norm);
               logistikNormSet.add(raw.toUpperCase());
            }
         });

         combinedPickerRaw.forEach((item: any) => {
            if (item.employee_name) staffSet.add(item.employee_name.trim());
            const isOjol = (item.role || '').toUpperCase() === 'OJOL';
            if (isOjol) {
               ojolCount++;
            } else {
               pickerCount++;
            }
            const raw = (item.barcode || '').trim();
            if (raw.includes(' ')) packingListCount++;
            else satuanCount++;

            let rawBarcode = (item.barcode || '').toString().trim().toUpperCase();
            let stripped0026 = rawBarcode.startsWith('0026') ? rawBarcode.slice(2) : rawBarcode;
            const norm = normalizeBarcodeKey(rawBarcode);
            const isCancelled = cancelledBarcodeSet.has(rawBarcode) ||
                                cancelledBarcodeSet.has(stripped0026) ||
                                (norm && cancelledBarcodeSet.has(norm));

            if (!isCancelled && norm) {
               pickerNormMap.set(norm, item);
               pickerNormMap.set(rawBarcode.toUpperCase(), item);
            }
         });

         let pickerMatchCount = 0;
         const formattedPicker = combinedPickerRaw.map((item: any) => {
            let rawBarcode = (item.barcode || '').toString().trim();
            let stripped0026 = rawBarcode.startsWith('0026') ? rawBarcode.slice(2) : rawBarcode;
            if (rawBarcode.startsWith('0026')) {
               rawBarcode = rawBarcode.slice(2);
            }
            if (/^LXAD[^-]/i.test(rawBarcode)) rawBarcode = 'LXAD-' + rawBarcode.substring(4);
            if (/^JNAP[^-]/i.test(rawBarcode)) rawBarcode = 'JNAP-' + rawBarcode.substring(4);
            if (/^JNEB[^-]/i.test(rawBarcode)) rawBarcode = 'JNEB-' + rawBarcode.substring(4);

            const norm = normalizeBarcodeKey(rawBarcode);
            const isCancelled = cancelledBarcodeSet.has(rawBarcode.toUpperCase()) ||
                                cancelledBarcodeSet.has(stripped0026.toUpperCase()) ||
                                (norm ? cancelledBarcodeSet.has(norm) : false);

            if (isCancelled) {
               cancelPickerCount++;
            }

            const isMatch = !isCancelled && (logistikNormSet.has(norm) || logistikNormSet.has(rawBarcode.toUpperCase()));
            if (isMatch) pickerMatchCount++;

            // Check if item is held up in Pending LT3 (only if not cancelled and not matched in logistik)
            const pendingInfo = (!isCancelled && !isMatch)
               ? (pendingLt3Map.get(norm) || pendingLt3Map.get(rawBarcode.toUpperCase()) || pendingLt3Map.get(stripped0026.toUpperCase()))
               : null;
            const isPendingLt3 = !!pendingInfo;
            if (isPendingLt3) {
               pendingLt3PickerCount++;
            }

            const roleCategory = (item.role || '').toUpperCase() === 'OJOL' ? 'OJOL' : 'PICKER';

            return {
               ...item,
               barcode: rawBarcode,
               role_category: roleCategory,
               leader_profile: leaderMap.get(item.barcode) || leaderMap.get(rawBarcode) || leaderMap.get(norm) || '-',
               is_packing_list: rawBarcode.includes(' '),
               is_matched_logistik: isMatch,
               is_cancelled: isCancelled,
               is_pending_lt3: isPendingLt3,
               pending_lt3_staff: pendingInfo?.staff || null
            };
         });`;

if (!content.includes(oldPendingMapAndPicker)) {
   console.error('Could not find oldPendingMapAndPicker!');
} else {
   content = content.replace(oldPendingMapAndPicker, newPendingMapAndPicker);
   console.log('4. Updated Pending LT3 Map and formattedPicker logic.');
}

// 5. Update formattedLogistik and stats computation
const oldLogistikFormat = `         // 4. Format Logistik with 4 Dedicated Classification Types (CANCEL, SAME_DAY, PREV_DAY, UNMATCH)
         let matchTodayCount = 0;
         let matchPrevCount = 0;
         let cancelLogistikCount = 0;
         let pureUnmatchCount = 0;

         const sortedLogistikRaw = [...logistikRaw].sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
         const formattedLogistik = sortedLogistikRaw.map((item: any) => {
            let rawBarcode = (item.barcode || '').toString().trim();
            let stripped0026 = rawBarcode.startsWith('0026') ? rawBarcode.slice(2) : rawBarcode;
            const norm = normalizeBarcodeKey(rawBarcode);
            const isCancelled = cancelledBarcodeSet.has(rawBarcode.toUpperCase()) ||
                                cancelledBarcodeSet.has(stripped0026.toUpperCase()) ||
                                (norm ? cancelledBarcodeSet.has(norm) : false);

            // Priority 1: Data Cancel (Terpisah total, tidak dihitung sebagai match)
            if (isCancelled) {
               cancelLogistikCount++;
               return {
                  ...item,
                  barcode: rawBarcode,
                  match_type: 'CANCEL' as const,
                  is_matched_picker: false,
                  is_cancelled: true,
                  picker_history_date: null,
                  picker_history_staff: null
               };
            }

            // Priority 2: Match Hari Ini
            const isMatchToday = pickerNormMap.has(norm) || pickerNormMap.has(rawBarcode.toUpperCase());
            if (isMatchToday) {
               matchTodayCount++;
               const pMatch = pickerNormMap.get(norm) || pickerNormMap.get(rawBarcode.toUpperCase());
               const staffName = pMatch?.employee_name || ((pMatch?.role || '').toUpperCase() === 'OJOL' ? 'Ojol' : 'Picker');
               return {
                  ...item,
                  barcode: rawBarcode,
                  match_type: 'SAME_DAY' as const,
                  is_matched_picker: true,
                  is_cancelled: false,
                  picker_history_date: effectiveDate,
                  picker_history_staff: staffName
               };
            }

            // Priority 3: Match Beda Hari (Riwayat sebelum hari ini)
            const histItem = historicalPickerMap.get(norm) || historicalPickerMap.get(rawBarcode.toUpperCase());
            if (histItem) {
               matchPrevCount++;
               let histDateStr = histItem.scan_date;
               if (!histDateStr && histItem.timestamp) {
                  const d = new Date(histItem.timestamp);
                  histDateStr = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
               }
               const staffName = histItem.employee_name || ((histItem.role || '').toUpperCase() === 'OJOL' ? 'Ojol' : 'Picker');
               return {
                  ...item,
                  barcode: rawBarcode,
                  match_type: 'PREV_DAY' as const,
                  is_matched_picker: true,
                  is_cancelled: false,
                  picker_history_date: histDateStr || 'Tgl Riwayat',
                  picker_history_staff: staffName,
                  picker_history_timestamp: histItem.timestamp
               };
            }

            // Priority 4: Pure Unmatch (Belum pernah di-scan)
            pureUnmatchCount++;
            return {
               ...item,
               barcode: rawBarcode,
               match_type: 'UNMATCH' as const,
               is_matched_picker: false,
               is_cancelled: false,
               picker_history_date: null,
               picker_history_staff: null
            };
         });

         const totalPicker = formattedPicker.length;
         const totalLogistik = formattedLogistik.length;
         const totalMatchLogistik = matchTodayCount + matchPrevCount;
         const pickerUnmatchCount = Math.max(0, totalPicker - pickerMatchCount - cancelPickerCount);
         const matchPercentage = totalLogistik > 0 
            ? \`\${((totalMatchLogistik / totalLogistik) * 100).toFixed(1)}%\` 
            : '0%';

         setAllPickerMasterList(formattedPicker);
         setAllLogistikMasterList(formattedLogistik);
         setLogistikPickerStaffList(Array.from(staffSet).sort());

         setCompComparisonStats({
            totalPicker,
            pickerCount,
            ojolCount,
            totalLogistik,
            matchCount: pickerMatchCount,
            matchTodayCount,
            matchPrevCount,
            pendingLt3Count: 0,
            resolvedSusulanCount: 0,
            cancelLogistikCount,
            cancelPickerCount,
            totalMatchLogistik,
            pureUnmatchLogistik: pureUnmatchCount,
            pickerUnmatchCount,
            logistikUnmatchCount: pureUnmatchCount,
            matchPercentage,
            satuanCount,
            packingListCount,
            uniqueStaff: staffSet.size
         });`;

const newLogistikFormat = `         // 4. Format Logistik with 5 Dedicated Classification Types (CANCEL, SAME_DAY, PREV_DAY, PENDING_LT3, UNMATCH)
         let matchTodayCount = 0;
         let matchPrevCount = 0;
         let cancelLogistikCount = 0;
         let pendingLt3LogistikCount = 0;
         let pureUnmatchCount = 0;

         const sortedLogistikRaw = [...logistikRaw].sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
         const formattedLogistik = sortedLogistikRaw.map((item: any) => {
            let rawBarcode = (item.barcode || '').toString().trim();
            let stripped0026 = rawBarcode.startsWith('0026') ? rawBarcode.slice(2) : rawBarcode;
            const norm = normalizeBarcodeKey(rawBarcode);
            const isCancelled = cancelledBarcodeSet.has(rawBarcode.toUpperCase()) ||
                                cancelledBarcodeSet.has(stripped0026.toUpperCase()) ||
                                (norm ? cancelledBarcodeSet.has(norm) : false);

            // Priority 1: Data Cancel (Terpisah total, tidak dihitung sebagai match)
            if (isCancelled) {
               cancelLogistikCount++;
               return {
                  ...item,
                  barcode: rawBarcode,
                  match_type: 'CANCEL' as const,
                  is_matched_picker: false,
                  is_cancelled: true,
                  picker_history_date: null,
                  picker_history_staff: null
               };
            }

            // Priority 2: Match Hari Ini
            const isMatchToday = pickerNormMap.has(norm) || pickerNormMap.has(rawBarcode.toUpperCase());
            if (isMatchToday) {
               matchTodayCount++;
               const pMatch = pickerNormMap.get(norm) || pickerNormMap.get(rawBarcode.toUpperCase());
               const staffName = pMatch?.employee_name || ((pMatch?.role || '').toUpperCase() === 'OJOL' ? 'Ojol' : 'Picker');
               return {
                  ...item,
                  barcode: rawBarcode,
                  match_type: 'SAME_DAY' as const,
                  is_matched_picker: true,
                  is_cancelled: false,
                  picker_history_date: effectiveDate,
                  picker_history_staff: staffName
               };
            }

            // Priority 3: Match Beda Hari (Riwayat sebelum hari ini)
            const histItem = historicalPickerMap.get(norm) || historicalPickerMap.get(rawBarcode.toUpperCase());
            if (histItem) {
               matchPrevCount++;
               let histDateStr = histItem.scan_date;
               if (!histDateStr && histItem.timestamp) {
                  const d = new Date(histItem.timestamp);
                  histDateStr = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
               }
               const staffName = histItem.employee_name || ((histItem.role || '').toUpperCase() === 'OJOL' ? 'Ojol' : 'Picker');
               return {
                  ...item,
                  barcode: rawBarcode,
                  match_type: 'PREV_DAY' as const,
                  is_matched_picker: true,
                  is_cancelled: false,
                  picker_history_date: histDateStr || 'Tgl Riwayat',
                  picker_history_staff: staffName,
                  picker_history_timestamp: histItem.timestamp
               };
            }

            // Priority 4: Pending LT3 (Resi logistik yang tercatat sedang pending di Gudang/Leader LT3)
            const pendingInfo = pendingLt3Map.get(norm) || pendingLt3Map.get(rawBarcode.toUpperCase()) || pendingLt3Map.get(stripped0026.toUpperCase());
            if (pendingInfo) {
               pendingLt3LogistikCount++;
               return {
                  ...item,
                  barcode: rawBarcode,
                  match_type: 'PENDING_LT3' as const,
                  is_matched_picker: false,
                  is_cancelled: false,
                  picker_history_date: null,
                  picker_history_staff: null,
                  pending_staff: pendingInfo.staff
               };
            }

            // Priority 5: Pure Unmatch (Murni Belum pernah di-scan picker sama sekali)
            pureUnmatchCount++;
            return {
               ...item,
               barcode: rawBarcode,
               match_type: 'UNMATCH' as const,
               is_matched_picker: false,
               is_cancelled: false,
               picker_history_date: null,
               picker_history_staff: null
            };
         });

         const totalPicker = formattedPicker.length;
         const totalLogistik = formattedLogistik.length;
         const totalMatchLogistik = matchTodayCount + matchPrevCount;
         // Belum Logistik = Total Picker dikurangi Match, Cancel, dan Pending LT3
         const pickerUnmatchCount = Math.max(0, totalPicker - pickerMatchCount - cancelPickerCount - pendingLt3PickerCount);
         const matchPercentage = totalLogistik > 0 
            ? \`\${((totalMatchLogistik / totalLogistik) * 100).toFixed(1)}%\` 
            : '0%';

         setAllPickerMasterList(formattedPicker);
         setAllLogistikMasterList(formattedLogistik);
         setLogistikPickerStaffList(Array.from(staffSet).sort());

         setCompComparisonStats({
            totalPicker,
            pickerCount,
            ojolCount,
            totalLogistik,
            matchCount: pickerMatchCount,
            matchTodayCount,
            matchPrevCount,
            pendingLt3Count: pendingLt3PickerCount + pendingLt3LogistikCount,
            pendingLt3PickerCount,
            pendingLt3LogistikCount,
            resolvedSusulanCount: 0,
            cancelLogistikCount,
            cancelPickerCount,
            totalMatchLogistik,
            pureUnmatchLogistik: pureUnmatchCount,
            pickerUnmatchCount,
            logistikUnmatchCount: pureUnmatchCount,
            matchPercentage,
            satuanCount,
            packingListCount,
            uniqueStaff: staffSet.size
         });`;

if (!content.includes(oldLogistikFormat)) {
   console.error('Could not find oldLogistikFormat!');
} else {
   content = content.replace(oldLogistikFormat, newLogistikFormat);
   console.log('5. Updated formattedLogistik and stats computation.');
}

// 6. Update filteredPickerComparisonList
const oldFilteredPickerList = `   // Filtered Picker List (Left Column)
   const filteredPickerComparisonList = useMemo(() => {
      return allPickerMasterList.filter(item => {
         if (pickerLogistikMatchFilter === 'MATCH' && (!item.is_matched_logistik || item.is_cancelled)) return false;
         if (pickerLogistikMatchFilter === 'CANCEL' && !item.is_cancelled) return false;
         if (pickerLogistikMatchFilter === 'UNMATCH' && (item.is_matched_logistik || item.is_cancelled)) return false;
         if (pickerLogistikStaffFilter !== 'ALL' && item.employee_name !== pickerLogistikStaffFilter) return false;
         if (pickerLogistikTypeFilter === 'PICKER' && item.role_category !== 'PICKER') return false;
         if (pickerLogistikTypeFilter === 'OJOL' && item.role_category !== 'OJOL') return false;
         if (pickerLogistikTypeFilter === 'PACKING_LIST' && !item.is_packing_list) return false;
         if (pickerLogistikTypeFilter === 'MANUAL' && item.is_packing_list) return false;
         if (pickerLogistikSearch.trim()) {
            const s = pickerLogistikSearch.trim().toLowerCase();
            const b = (item.barcode || '').toLowerCase();
            const e = (item.employee_name || '').toLowerCase();
            const l = (item.leader_profile || '').toLowerCase();
            const r = (item.role_category || '').toLowerCase();
            const isCanc = item.is_cancelled ? 'cancel data cancel batal' : '';
            if (!b.includes(s) && !e.includes(s) && !l.includes(s) && !r.includes(s) && !isCanc.includes(s)) return false;
         }
         return true;
      });
   }, [allPickerMasterList, pickerLogistikMatchFilter, pickerLogistikStaffFilter, pickerLogistikTypeFilter, pickerLogistikSearch]);`;

const newFilteredPickerList = `   // Filtered Picker List (Left Column) with Pending LT3, Cancel, Match, Unmatch
   const filteredPickerComparisonList = useMemo(() => {
      return allPickerMasterList.filter(item => {
         if (pickerLogistikMatchFilter === 'MATCH' && (!item.is_matched_logistik || item.is_cancelled)) return false;
         if (pickerLogistikMatchFilter === 'PENDING_LT3' && (!item.is_pending_lt3 || item.is_cancelled || item.is_matched_logistik)) return false;
         if (pickerLogistikMatchFilter === 'CANCEL' && !item.is_cancelled) return false;
         if (pickerLogistikMatchFilter === 'UNMATCH' && (item.is_matched_logistik || item.is_cancelled || item.is_pending_lt3)) return false;
         if (pickerLogistikStaffFilter !== 'ALL' && item.employee_name !== pickerLogistikStaffFilter) return false;
         if (pickerLogistikTypeFilter === 'PICKER' && item.role_category !== 'PICKER') return false;
         if (pickerLogistikTypeFilter === 'OJOL' && item.role_category !== 'OJOL') return false;
         if (pickerLogistikTypeFilter === 'PACKING_LIST' && !item.is_packing_list) return false;
         if (pickerLogistikTypeFilter === 'MANUAL' && item.is_packing_list) return false;
         if (pickerLogistikSearch.trim()) {
            const s = pickerLogistikSearch.trim().toLowerCase();
            const b = (item.barcode || '').toLowerCase();
            const e = (item.employee_name || '').toLowerCase();
            const l = (item.leader_profile || '').toLowerCase();
            const r = (item.role_category || '').toLowerCase();
            const isCanc = item.is_cancelled ? 'cancel data cancel batal' : '';
            const isPend = item.is_pending_lt3 ? 'pending lt3 gudang' : '';
            if (!b.includes(s) && !e.includes(s) && !l.includes(s) && !r.includes(s) && !isCanc.includes(s) && !isPend.includes(s)) return false;
         }
         return true;
      });
   }, [allPickerMasterList, pickerLogistikMatchFilter, pickerLogistikStaffFilter, pickerLogistikTypeFilter, pickerLogistikSearch]);`;

if (!content.includes(oldFilteredPickerList)) {
   console.error('Could not find oldFilteredPickerList!');
} else {
   content = content.replace(oldFilteredPickerList, newFilteredPickerList);
   console.log('6. Updated filteredPickerComparisonList.');
}

// 7. Update Card 1 Substats
const oldCard1Substats = `                                         <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5 font-semibold mt-0.5">
                                            <span className="text-cyan-600 dark:text-cyan-400">{(compComparisonStats.pickerCount || 0).toLocaleString('id-ID')} Picker</span>
                                            <span>•</span>
                                            <span className="text-amber-600 dark:text-amber-400">{(compComparisonStats.ojolCount || 0).toLocaleString('id-ID')} Ojol</span>
                                            {(compComparisonStats.cancelPickerCount || 0) > 0 && (
                                               <>
                                                  <span>•</span>
                                                  <span className="text-rose-600 dark:text-rose-400">{(compComparisonStats.cancelPickerCount || 0).toLocaleString('id-ID')} Cancel</span>
                                               </>
                                            )}
                                            <span>•</span>
                                            <span>{compComparisonStats.uniqueStaff} Staff</span>
                                         </div>`;

const newCard1Substats = `                                         <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5 font-semibold mt-0.5 flex-wrap">
                                            <span className="text-cyan-600 dark:text-cyan-400">{(compComparisonStats.pickerCount || 0).toLocaleString('id-ID')} Picker</span>
                                            <span>•</span>
                                            <span className="text-amber-600 dark:text-amber-400">{(compComparisonStats.ojolCount || 0).toLocaleString('id-ID')} Ojol</span>
                                            {(compComparisonStats.pendingLt3PickerCount || 0) > 0 && (
                                               <>
                                                  <span>•</span>
                                                  <span className="text-orange-600 dark:text-orange-400">{(compComparisonStats.pendingLt3PickerCount || 0).toLocaleString('id-ID')} Pending LT3</span>
                                               </>
                                            )}
                                            {(compComparisonStats.cancelPickerCount || 0) > 0 && (
                                               <>
                                                  <span>•</span>
                                                  <span className="text-rose-600 dark:text-rose-400">{(compComparisonStats.cancelPickerCount || 0).toLocaleString('id-ID')} Cancel</span>
                                               </>
                                            )}
                                            <span>•</span>
                                            <span>{compComparisonStats.uniqueStaff} Staff</span>
                                         </div>`;

if (!content.includes(oldCard1Substats)) {
   console.error('Could not find oldCard1Substats!');
} else {
   content = content.replace(oldCard1Substats, newCard1Substats);
   console.log('7. Updated Card 1 Substats.');
}

// 8. Update Picker Table Header (Sub-stats and Filter Pills)
const oldPickerHeader = `                                            <div>
                                               <div className="flex items-center gap-2">
                                                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Data Picker & Ojol</h3>
                                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 font-mono">
                                                     {(compComparisonStats.totalPicker || 0).toLocaleString('id-ID')} Resi
                                                  </span>
                                               </div>
                                               <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Match: {(compComparisonStats.matchCount || 0).toLocaleString('id-ID')}</span>
                                                  <span>•</span>
                                                  <span className="text-rose-600 dark:text-rose-400 font-semibold">Belum Logistik: {(compComparisonStats.pickerUnmatchCount || 0).toLocaleString('id-ID')}</span>
                                               </div>
                                            </div>
                                         </div>

                                         {/* Filter Status Match (Pills) & Copy Button */}
                                         <div className="flex items-center gap-2 flex-wrap">
                                            {isDevModeNew && (
                                               <button
                                                  onClick={async () => {
                                                     const textToCopy = filteredPickerComparisonList.map(item => item.barcode).join('\\n');
                                                     const ok = await copyToClipboard(textToCopy);
                                                     if (ok) setSuccessToast(\`⚡ DevMode: \${filteredPickerComparisonList.length} Barcode Picker/Ojol disalin!\`);
                                                  }}
                                                  className="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                                                  title="Salin Kolom Barcode / Resi Picker & Ojol"
                                               >
                                                  <Copy size={12} />
                                                  <span>Salin Barcode Picker & Ojol ({filteredPickerComparisonList.length})</span>
                                               </button>
                                            )}
                                            <div className="flex items-center bg-white dark:bg-gray-850 p-1 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
                                               <button
                                                  onClick={() => { setPickerLogistikMatchFilter('ALL'); setPickerLogistikPage(1); }}
                                                  className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer \${
                                                     pickerLogistikMatchFilter === 'ALL'
                                                        ? 'bg-cyan-600 text-white shadow-xs'
                                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                  }\`}
                                               >
                                                  Semua ({(compComparisonStats.totalPicker || 0).toLocaleString('id-ID')})
                                               </button>
                                               <button
                                                  onClick={() => { setPickerLogistikMatchFilter('MATCH'); setPickerLogistikPage(1); }}
                                                  className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer \${
                                                     pickerLogistikMatchFilter === 'MATCH'
                                                        ? 'bg-emerald-600 text-white shadow-xs'
                                                        : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                                  }\`}
                                               >
                                                  ✅ Match ({(compComparisonStats.matchCount || 0).toLocaleString('id-ID')})
                                               </button>
                                               <button
                                                  onClick={() => { setPickerLogistikMatchFilter('UNMATCH'); setPickerLogistikPage(1); }}
                                                  className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer \${
                                                     pickerLogistikMatchFilter === 'UNMATCH'
                                                        ? 'bg-rose-600 text-white shadow-xs'
                                                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                                  }\`}
                                               >
                                                  ❌ Belum Logistik ({(compComparisonStats.pickerUnmatchCount || 0).toLocaleString('id-ID')})
                                               </button>
                                            </div>
                                         </div>`;

const newPickerHeader = `                                            <div>
                                               <div className="flex items-center gap-2">
                                                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Data Picker & Ojol</h3>
                                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 font-mono">
                                                     {(compComparisonStats.totalPicker || 0).toLocaleString('id-ID')} Resi
                                                  </span>
                                               </div>
                                               <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap font-medium">
                                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Match: {(compComparisonStats.matchCount || 0).toLocaleString('id-ID')}</span>
                                                  <span>•</span>
                                                  <span className="text-orange-600 dark:text-orange-400 font-semibold">Pending LT3: {(compComparisonStats.pendingLt3PickerCount || 0).toLocaleString('id-ID')}</span>
                                                  <span>•</span>
                                                  <span className="text-rose-600 dark:text-rose-400 font-semibold">Cancel: {(compComparisonStats.cancelPickerCount || 0).toLocaleString('id-ID')}</span>
                                                  <span>•</span>
                                                  <span className="text-rose-600 dark:text-rose-400 font-semibold">Belum Logistik: {(compComparisonStats.pickerUnmatchCount || 0).toLocaleString('id-ID')}</span>
                                               </div>
                                            </div>
                                         </div>

                                         {/* Filter Status Match (Pills dengan 5 Level Status: Semua, Match, Pending LT3, Cancel, Belum Logistik) & Copy Button */}
                                         <div className="flex items-center gap-2 flex-wrap">
                                            {isDevModeNew && (
                                               <button
                                                  onClick={async () => {
                                                     const textToCopy = filteredPickerComparisonList.map(item => item.barcode).join('\\n');
                                                     const ok = await copyToClipboard(textToCopy);
                                                     if (ok) setSuccessToast(\`⚡ DevMode: \${filteredPickerComparisonList.length} Barcode Picker/Ojol disalin!\`);
                                                  }}
                                                  className="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                                                  title="Salin Kolom Barcode / Resi Picker & Ojol"
                                               >
                                                  <Copy size={12} />
                                                  <span>Salin Barcode Picker & Ojol ({filteredPickerComparisonList.length})</span>
                                               </button>
                                            )}
                                            <div className="flex items-center bg-white dark:bg-gray-850 p-1 rounded-xl border border-gray-200 dark:border-gray-700 text-xs flex-wrap gap-1">
                                               <button
                                                  onClick={() => { setPickerLogistikMatchFilter('ALL'); setPickerLogistikPage(1); }}
                                                  className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer \${
                                                     pickerLogistikMatchFilter === 'ALL'
                                                        ? 'bg-cyan-600 text-white shadow-xs'
                                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                  }\`}
                                               >
                                                  Semua ({(compComparisonStats.totalPicker || 0).toLocaleString('id-ID')})
                                               </button>
                                               <button
                                                  onClick={() => { setPickerLogistikMatchFilter('MATCH'); setPickerLogistikPage(1); }}
                                                  className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer \${
                                                     pickerLogistikMatchFilter === 'MATCH'
                                                        ? 'bg-emerald-600 text-white shadow-xs'
                                                        : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                                  }\`}
                                               >
                                                  ✅ Match ({(compComparisonStats.matchCount || 0).toLocaleString('id-ID')})
                                               </button>
                                               <button
                                                  onClick={() => { setPickerLogistikMatchFilter('PENDING_LT3'); setPickerLogistikPage(1); }}
                                                  className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer \${
                                                     pickerLogistikMatchFilter === 'PENDING_LT3'
                                                        ? 'bg-orange-600 text-white shadow-xs'
                                                        : 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40'
                                                  }\`}
                                                  title="Resi tertahan di Pending Scans (LT3)"
                                               >
                                                  ⏳ Pending LT3 ({(compComparisonStats.pendingLt3PickerCount || 0).toLocaleString('id-ID')})
                                               </button>
                                               <button
                                                  onClick={() => { setPickerLogistikMatchFilter('CANCEL'); setPickerLogistikPage(1); }}
                                                  className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer \${
                                                     pickerLogistikMatchFilter === 'CANCEL'
                                                        ? 'bg-rose-600 text-white shadow-xs'
                                                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                                  }\`}
                                                  title="Resi berstatus Cancel"
                                               >
                                                  🚫 Cancel ({(compComparisonStats.cancelPickerCount || 0).toLocaleString('id-ID')})
                                               </button>
                                               <button
                                                  onClick={() => { setPickerLogistikMatchFilter('UNMATCH'); setPickerLogistikPage(1); }}
                                                  className={\`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer \${
                                                     pickerLogistikMatchFilter === 'UNMATCH'
                                                        ? 'bg-rose-700 text-white shadow-xs'
                                                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                                  }\`}
                                                  title="Resi yang murni belum sampai ke Logistik (di luar pending & cancel)"
                                               >
                                                  ❌ Belum Logistik ({(compComparisonStats.pickerUnmatchCount || 0).toLocaleString('id-ID')})
                                               </button>
                                            </div>
                                         </div>`;

if (!content.includes(oldPickerHeader)) {
   console.error('Could not find oldPickerHeader!');
} else {
   content = content.replace(oldPickerHeader, newPickerHeader);
   console.log('8. Updated Picker Table Header & Filter Pills.');
}

// 9. Update Picker Table Rows Rendering
const oldPickerRow = `                                                  paginatedPickerComparisonList.map((item, idx) => (
                                                     <tr
                                                        key={item.id || idx}
                                                        className={\`transition-colors \${
                                                           item.is_cancelled
                                                              ? 'bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100/70 border-l-4 border-l-rose-500'
                                                              : item.is_matched_logistik
                                                              ? 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
                                                              : 'bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/50'
                                                        }\`}
                                                     >
                                                        <td className="px-3 py-2 text-center font-mono text-gray-400 font-bold">
                                                           {(pickerLogistikPage - 1) * pickerLogistikRowsPerPage + idx + 1}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                                                           {new Date(item.timestamp).toLocaleTimeString('id-ID')}
                                                        </td>
                                                        <td 
                                                            className={\`px-3 py-2 font-mono font-bold text-gray-900 dark:text-gray-100 \${isDevModeNew ? 'select-text cursor-text' : 'select-none cursor-default'}\`}
                                                            onContextMenu={(e) => { if (!isDevModeNew) e.preventDefault(); }}
                                                            onCopy={(e) => { if (!isDevModeNew) e.preventDefault(); }}
                                                            onMouseDown={(e) => { if (!isDevModeNew && e.detail > 1) e.preventDefault(); }}
                                                         >
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                              <span 
                                                                 className={isDevModeNew ? "inline-block select-text" : "select-none pointer-events-none inline-block"} 
                                                                 style={isDevModeNew ? {} : { userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
                                                              >
                                                                 {item.barcode}
                                                              </span>
                                                              {item.is_cancelled && (
                                                                 <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                                                                    CANCEL
                                                                 </span>
                                                              )}
                                                              {isDevModeNew && (
                                                                 <button
                                                                    onClick={async () => {
                                                                       const ok = await copyToClipboard(item.barcode);
                                                                       if (ok) setSuccessToast(\`Barcode \${item.barcode} disalin!\`);
                                                                    }}
                                                                    className="p-1 rounded hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-600 dark:text-cyan-400 transition-colors cursor-pointer"
                                                                    title="Salin Barcode Ini"
                                                                 >
                                                                    <Copy size={11} />
                                                                 </button>
                                                              )}
                                                            </div>
                                                         </td>
                                                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">
                                                           <div className="flex items-center gap-1.5 flex-wrap">
                                                              <span className={\`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider \${
                                                                 item.role_category === 'OJOL'
                                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                                                    : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                                                              }\`}>
                                                                 {item.role_category === 'OJOL' ? '🛵 OJOL' : '📦 PICKER'}
                                                              </span>
                                                              <span className="font-semibold text-xs">{item.employee_name || '-'}</span>
                                                              {item.is_cancelled && (
                                                                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                                                    <AlertTriangle size={10} /> DATA CANCEL
                                                                 </span>
                                                              )}
                                                           </div>
                                                        </td>
                                                        <td className="px-3 py-2 text-[11px] text-gray-500 font-mono">
                                                           {item.leader_profile || '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                           {item.is_cancelled ? (
                                                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                                                 <Ban size={11} className="text-rose-600 dark:text-rose-400" />
                                                                 DATA CANCEL
                                                              </span>
                                                           ) : item.is_matched_logistik ? (
                                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                                                                 ✅ MATCH
                                                              </span>
                                                           ) : (
                                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                                                                 ❌ BELUM LOGISTIK
                                                              </span>
                                                           )}
                                                        </td>
                                                     </tr>
                                                  ))`;

const newPickerRow = `                                                  paginatedPickerComparisonList.map((item, idx) => (
                                                     <tr
                                                        key={item.id || idx}
                                                        className={\`transition-colors \${
                                                           item.is_cancelled
                                                              ? 'bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100/70 border-l-4 border-l-rose-500'
                                                              : item.is_matched_logistik
                                                              ? 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
                                                              : item.is_pending_lt3
                                                              ? 'bg-orange-50/40 dark:bg-orange-950/20 hover:bg-orange-50/70 border-l-4 border-l-orange-500'
                                                              : 'bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/50'
                                                        }\`}
                                                     >
                                                        <td className="px-3 py-2 text-center font-mono text-gray-400 font-bold">
                                                           {(pickerLogistikPage - 1) * pickerLogistikRowsPerPage + idx + 1}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                                                           {new Date(item.timestamp).toLocaleTimeString('id-ID')}
                                                        </td>
                                                        <td 
                                                            className={\`px-3 py-2 font-mono font-bold text-gray-900 dark:text-gray-100 \${isDevModeNew ? 'select-text cursor-text' : 'select-none cursor-default'}\`}
                                                            onContextMenu={(e) => { if (!isDevModeNew) e.preventDefault(); }}
                                                            onCopy={(e) => { if (!isDevModeNew) e.preventDefault(); }}
                                                            onMouseDown={(e) => { if (!isDevModeNew && e.detail > 1) e.preventDefault(); }}
                                                         >
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                              <span 
                                                                 className={isDevModeNew ? "inline-block select-text" : "select-none pointer-events-none inline-block"} 
                                                                 style={isDevModeNew ? {} : { userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
                                                              >
                                                                 {item.barcode}
                                                              </span>
                                                              {item.is_cancelled && (
                                                                 <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-xs">
                                                                    CANCEL
                                                                 </span>
                                                              )}
                                                              {item.is_pending_lt3 && !item.is_cancelled && (
                                                                 <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-orange-500 text-white shadow-xs">
                                                                    PENDING LT3
                                                                 </span>
                                                              )}
                                                              {isDevModeNew && (
                                                                 <button
                                                                    onClick={async () => {
                                                                       const ok = await copyToClipboard(item.barcode);
                                                                       if (ok) setSuccessToast(\`Barcode \${item.barcode} disalin!\`);
                                                                    }}
                                                                    className="p-1 rounded hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-cyan-600 dark:text-cyan-400 transition-colors cursor-pointer"
                                                                    title="Salin Barcode Ini"
                                                                 >
                                                                    <Copy size={11} />
                                                                 </button>
                                                              )}
                                                            </div>
                                                         </td>
                                                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">
                                                           <div className="flex items-center gap-1.5 flex-wrap">
                                                              <span className={\`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider \${
                                                                 item.role_category === 'OJOL'
                                                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                                                    : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800'
                                                              }\`}>
                                                                 {item.role_category === 'OJOL' ? '🛵 OJOL' : '📦 PICKER'}
                                                              </span>
                                                              <span className="font-semibold text-xs">{item.employee_name || '-'}</span>
                                                              {item.is_cancelled && (
                                                                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                                                    <AlertTriangle size={10} /> DATA CANCEL
                                                                 </span>
                                                              )}
                                                              {item.is_pending_lt3 && !item.is_cancelled && (
                                                                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
                                                                    <Clock size={10} /> PENDING LT3
                                                                 </span>
                                                              )}
                                                           </div>
                                                        </td>
                                                        <td className="px-3 py-2 text-[11px] text-gray-500 font-mono">
                                                           {item.leader_profile || '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                           {item.is_cancelled ? (
                                                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                                                 <Ban size={11} className="text-rose-600 dark:text-rose-400" />
                                                                 DATA CANCEL
                                                              </span>
                                                           ) : item.is_matched_logistik ? (
                                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                                                                 ✅ MATCH
                                                              </span>
                                                           ) : item.is_pending_lt3 ? (
                                                              <div className="flex flex-col items-center">
                                                                 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-300 border border-orange-300 dark:border-orange-800 shadow-2xs">
                                                                    <Clock size={11} className="text-orange-600 dark:text-orange-400" />
                                                                    ⏳ PENDING LT3
                                                                 </span>
                                                                 {item.pending_lt3_staff && (
                                                                    <span className="text-[10px] text-orange-700 dark:text-orange-400 mt-0.5 font-bold">
                                                                       Oleh: {item.pending_lt3_staff}
                                                                    </span>
                                                                 )}
                                                              </div>
                                                           ) : (
                                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                                                                 ❌ BELUM LOGISTIK
                                                              </span>
                                                           )}
                                                        </td>
                                                     </tr>
                                                  ))`;

if (!content.includes(oldPickerRow)) {
   console.error('Could not find oldPickerRow!');
} else {
   content = content.replace(oldPickerRow, newPickerRow);
   console.log('9. Updated Picker Table Rows Rendering.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Finished writing updated AdminDashboard.tsx! New length:', content.length);
