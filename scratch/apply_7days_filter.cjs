const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const isCRLF = code.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

console.log("Starting patch for 7 days range filter & export...");

// 1. Add State variables
const stateTarget = `   const [filterPickerType, setFilterPickerType] = useState<'ALL' | 'MANUAL' | 'PACKING_LIST'>('ALL'); // NEW: Manual vs Packing List`;
const stateReplacement = `   const [filterPickerType, setFilterPickerType] = useState<'ALL' | 'MANUAL' | 'PACKING_LIST'>('ALL'); // NEW: Manual vs Packing List
   // Date Range Filter (Khusus admin & admin3 via Firestore Only)
   const [dateFilterMode, setDateFilterMode] = useState<'SINGLE' | 'RANGE'>('SINGLE');
   const [rangeStartDate, setRangeStartDate] = useState<string>(() => {
      const d = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
   });
   const [rangeEndDate, setRangeEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
   const [firestoreFetchCount, setFirestoreFetchCount] = useState<number>(0);`;

if (code.includes(stateTarget)) {
   code = code.replace(stateTarget, stateReplacement);
   console.log("✅ Step 1: State variables added.");
} else {
   console.error("❌ Step 1 failed: stateTarget not found");
}

// 2. Add canUse7DaysRangeFilter
const permTarget = `   // Determine if date filter is unrestricted (No 2-3 day restriction for SuperAdmin, view_gudang permission, or admin3)
   const isDateFilterUnrestricted = useMemo(() => {
      if (!currentAdmin) return false;
      if (isSuperAdmin) return true;
      if (hasPermission('view_gudang')) return true;
      const username = (currentAdmin.username || '').toLowerCase().trim();
      return username === 'admin3';
   }, [currentAdmin, isSuperAdmin, hasPermission]);`;

const permReplacement = `   // Determine if date filter is unrestricted (No 2-3 day restriction for SuperAdmin, view_gudang permission, or admin3)
   const isDateFilterUnrestricted = useMemo(() => {
      if (!currentAdmin) return false;
      if (isSuperAdmin) return true;
      if (hasPermission('view_gudang')) return true;
      const username = (currentAdmin.username || '').toLowerCase().trim();
      return username === 'admin3';
   }, [currentAdmin, isSuperAdmin, hasPermission]);

   // Hak akses filter rentang 7 hari (Khusus akun admin dan admin3 atau superdev)
   const canUse7DaysRangeFilter = useMemo(() => {
      if (!currentAdmin) return false;
      if (currentAdmin.id === 0) return true;
      const username = (currentAdmin.username || '').toLowerCase().trim();
      return username === 'admin' || username === 'admin3' || username === 'superdev' || username.includes('dev');
   }, [currentAdmin]);`;

if (code.includes(permTarget)) {
   code = code.replace(permTarget, permReplacement);
   console.log("✅ Step 2: canUse7DaysRangeFilter memo added.");
} else {
   console.error("❌ Step 2 failed: permTarget not found");
}

// 3. Update useEffect dependencies
const effectTarget = `}, [page, rowsPerPage, filterPackingStaff, filterPackingShift, packingSearch, filterDate, filterPackingRole, activeView, filterCancelOnly, filterPickerType]);`;
const effectReplacement = `}, [page, rowsPerPage, filterPackingStaff, filterPackingShift, packingSearch, filterDate, dateFilterMode, rangeStartDate, rangeEndDate, filterPackingRole, activeView, filterCancelOnly, filterPickerType]);`;

if (code.includes(effectTarget)) {
   code = code.replace(effectTarget, effectReplacement);
   console.log("✅ Step 3: useEffect dependencies updated.");
} else {
   console.error("❌ Step 3 failed: effectTarget not found");
}

// 4. Update fetchPackingData with Range support
const fetchRangeBlock = `         // JIKA MODE RENTANG TANGGAL DIAKTIFKAN (KHUSUS ADMIN/ADMIN3 VIA FIRESTORE ONLY)
         if (canUse7DaysRangeFilter && dateFilterMode === 'RANGE') {
            const startMs = new Date(\`\${rangeStartDate}T00:00:00\`).getTime();
            const endMs = new Date(\`\${rangeEndDate}T23:59:59.999\`).getTime();
            const cacheKey = \`range_\${rangeStartDate}_to_\${rangeEndDate}\`;

            try {
               let dayDocs: any[] = [];
               if (firestoreDayDataCache.has(cacheKey)) {
                  dayDocs = firestoreDayDataCache.get(cacheKey)!;
               } else {
                  setFirestoreLoadingText(\`Mengambil data rentang \${rangeStartDate} s/d \${rangeEndDate} dari Firestore...\`);
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
                  firestoreDayDataCache.set(cacheKey, dayDocs);
                  setFirestoreFetchCount(prev => prev + 1);
                  setFirestoreLoadingText('');
               }

               let targetRole = 'PACKING';
               if (activeView === 'PACKING_2_DATA') targetRole = 'PACKING_2';
               else if (activeView === 'SORTIR_DATA') targetRole = 'SORTIR';
               else if (activeView === 'PICKER_DATA') targetRole = 'PICKER';
               else if (activeView === 'CHECKER_DATA') targetRole = 'CHECKER';
               else if (activeView === 'LOGISTIK_DATA') targetRole = 'LOGISTIK';
               else if (activeView === 'OJOL_DATA') targetRole = 'OJOL';
               else if (activeView.startsWith('GUDANG')) targetRole = 'GUDANG';

               let fsRoleItems: any[] = [];
               dayDocs.forEach(d => {
                  const r = (d.role || '').toUpperCase();
                  let isMatch = false;
                  if (activeView === 'SCAN_ALL') {
                     isMatch = true;
                  } else if (targetRole === 'PACKING_2') {
                     isMatch = (r === 'PACKING_2' || r === 'PACKING_2_DATA');
                  } else if (targetRole === 'PACKING') {
                     isMatch = (r === 'PACKING' || r === 'PACKING_DATA' || (r.includes('PACK') && r !== 'PACKING_2'));
                  } else if (targetRole === 'SORTIR') {
                     isMatch = (r === 'SORTIR' || r === 'SORTIR_DATA');
                  } else if (targetRole === 'PICKER') {
                     isMatch = (r === 'PICKER' || r === 'PICKER_DATA');
                  } else if (targetRole === 'CHECKER') {
                     isMatch = (r === 'CHECKER' || r === 'CHECKER_DATA');
                  } else if (targetRole === 'LOGISTIK') {
                     isMatch = (r === 'LOGISTIK' || r === 'LOGISTIK_DATA');
                  } else if (targetRole === 'OJOL') {
                     isMatch = (r === 'OJOL' || r === 'OJOL_DATA');
                  } else if (targetRole === 'GUDANG') {
                     isMatch = (r === 'GUDANG' || r.includes('GUDANG'));
                  }

                  if (isMatch) {
                     let rawBarcode = (d.barcode || '').toString().trim();
                     if (rawBarcode && targetRole !== 'LOGISTIK' && rawBarcode.startsWith('0026')) {
                        rawBarcode = rawBarcode.slice(2);
                     }
                     if (/^LXAD[^-]/i.test(rawBarcode)) rawBarcode = 'LXAD-' + rawBarcode.substring(4);
                     if (/^JNAP[^-]/i.test(rawBarcode)) rawBarcode = 'JNAP-' + rawBarcode.substring(4);
                     if (/^JNEB[^-]/i.test(rawBarcode)) rawBarcode = 'JNEB-' + rawBarcode.substring(4);

                     const empName = d.employee_name || d.admin_name || d.leader_name || '-';
                     fsRoleItems.push({
                        ...d,
                        barcode: rawBarcode,
                        employee_name: empName,
                        shift: shiftMap.get(empName) || 'Unknown',
                        is_from_firestore: true
                     });
                  }
               });

               // Filter Staff
               if (filterPackingStaff && filterPackingStaff !== 'ALL') {
                  fsRoleItems = fsRoleItems.filter(item => item.employee_name === filterPackingStaff || item.admin_name === filterPackingStaff);
               }
               // Filter Shift
               if (filterPackingShift && filterPackingShift !== 'ALL') {
                  const validNames = new Set(shiftToNamesMap[filterPackingShift] || []);
                  fsRoleItems = fsRoleItems.filter(item => validNames.has(item.employee_name));
               }
               // Filter Cancel Only
               if (filterCancelOnly) {
                  fsRoleItems = fsRoleItems.filter(item => (item.description || '').includes('[CANCEL] Camera Scan'));
               }
               // Filter Search Term
               if (packingSearch) {
                  const term = packingSearch.toLowerCase();
                  fsRoleItems = fsRoleItems.filter(item =>
                     (item.barcode && item.barcode.toLowerCase().includes(term)) ||
                     (item.employee_name && item.employee_name.toLowerCase().includes(term)) ||
                     (item.admin_name && item.admin_name.toLowerCase().includes(term))
                  );
               }

               fsRoleItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

               const totalFsCount = fsRoleItems.length;
               const from = (targetPage - 1) * rowsPerPage;
               const to = from + rowsPerPage - 1;
               const pageItems = fsRoleItems.slice(from, to + 1);

               setPackingData(pageItems);
               setTotalRows(totalFsCount);
               setActiveDataSource('FIRESTORE');
               setIsLoadingPacking(false);
               return;
            } catch (err: any) {
               console.error("Error fetching date range from Firestore:", err);
               alert("Gagal memuat data rentang tanggal dari Firestore: " + err.message);
            } finally {
               setIsLoadingPacking(false);
            }
         }`;

const fetchInsertionTarget = `         let leaderBarcodes: string[] | null = null;
         if ((activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') && filterPackingStaff !== 'ALL') {
            const { data: ld } = await supabase.from('leader_scan_2').select('barcode').eq('leader_profile', filterPackingStaff);
            if (ld) leaderBarcodes = ld.map((d: any) => d.barcode);
            else leaderBarcodes = ['NO_MATCH_XYZ_123']; // Prevent empty array from fetching all
         }`;

if (code.includes(fetchInsertionTarget)) {
   code = code.replace(fetchInsertionTarget, fetchInsertionTarget + eol + eol + fetchRangeBlock);
   console.log("✅ Step 4: fetchPackingData range support added.");
} else {
   console.error("❌ Step 4 failed: fetchInsertionTarget not found");
}

// 5. Update handleExportPackingData
const exportTarget = `         const targetDateStr = canManageDate ? filterDate : getTodayString();

         // Direct Export from Firestore if active
         if (activeDataSource === 'FIRESTORE' && firestoreDayDataCache.has(targetDateStr)) {`;

const exportReplacement = `         const targetDateStr = canManageDate ? filterDate : getTodayString();
         const isRangeExport = canUse7DaysRangeFilter && dateFilterMode === 'RANGE';
         const cacheKey = isRangeExport ? \`range_\${rangeStartDate}_to_\${rangeEndDate}\` : targetDateStr;

         // Direct Export from Firestore if Range Mode or activeDataSource === 'FIRESTORE'
         if (isRangeExport || (activeDataSource === 'FIRESTORE' && firestoreDayDataCache.has(targetDateStr))) {
            let allDayDocs: any[] = [];
            if (firestoreDayDataCache.has(cacheKey)) {
               allDayDocs = firestoreDayDataCache.get(cacheKey) || [];
            } else if (isRangeExport) {
               const startMs = new Date(\`\${rangeStartDate}T00:00:00\`).getTime();
               const endMs = new Date(\`\${rangeEndDate}T23:59:59.999\`).getTime();
               const activeFsQuery = fsQuery(
                  collection(db, 'scanned_items'),
                  where('timestamp', '>=', startMs),
                  where('timestamp', '<=', endMs)
               );
               const fsSnap = await getDocs(activeFsQuery);
               allDayDocs = fsSnap.docs.map(docSnap => ({
                  id: docSnap.id,
                  ...(docSnap.data() as Record<string, any>)
               }));
               firestoreDayDataCache.set(cacheKey, allDayDocs);
            } else if (firestoreDayDataCache.has(targetDateStr)) {
               allDayDocs = firestoreDayDataCache.get(targetDateStr) || [];
            }`;

if (code.includes(exportTarget)) {
   code = code.replace(exportTarget, exportReplacement);
   
   // also update export download link name
   const oldDownloadLink = `link.setAttribute('download', \`\${label}_\${filterDate}_FIRESTORE.csv\`);`;
   const newDownloadLink = `const dateLabel = isRangeExport ? \`\${rangeStartDate}_sd_\${rangeEndDate}\` : filterDate;\n            link.setAttribute('download', \`\${label}_\${dateLabel}_FIRESTORE.csv\`);`;
   if (code.includes(oldDownloadLink)) {
      code = code.replace(oldDownloadLink, newDownloadLink);
      console.log("✅ Step 5: handleExportPackingData updated with range export filename.");
   }
} else {
   console.error("❌ Step 5 failed: exportTarget not found");
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("Saved updated code to AdminDashboard.tsx");
