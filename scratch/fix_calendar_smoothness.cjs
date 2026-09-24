const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const isCRLF = code.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

console.log("Applying debounced & non-blocking calendar fetch optimizations...");

// 1. Debounce useEffect for fetchPackingData to let calendar animation finish cleanly
const oldEffect = `   useEffect(() => {
      if (activeView === 'PACKING_DATA' || activeView === 'PACKING_2_DATA' || activeView === 'SORTIR_DATA' || activeView === 'LOGISTIK_DATA' || (activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') || activeView === 'LEADER_2_DATA' || activeView === 'LEADER_PENDING_ADMIN' || activeView === 'GUDANG_PENDING' || activeView === 'GUDANG_READY' || activeView === 'GUDANG_CANCEL' || activeView === 'GUDANG_REPORT' || activeView === 'SCAN_ALL') {
         fetchPackingData(page);
      }
   }, [page, rowsPerPage, filterPackingStaff, filterPackingShift, packingSearch, filterDate, dateFilterMode, rangeStartDate, rangeEndDate, filterPackingRole, activeView, filterCancelOnly, filterPickerType]);`;

const newEffect = `   useEffect(() => {
      if (activeView === 'PACKING_DATA' || activeView === 'PACKING_2_DATA' || activeView === 'SORTIR_DATA' || activeView === 'LOGISTIK_DATA' || (activeView === 'PICKER_DATA' || activeView === 'CHECKER_DATA') || activeView === 'LEADER_2_DATA' || activeView === 'LEADER_PENDING_ADMIN' || activeView === 'GUDANG_PENDING' || activeView === 'GUDANG_READY' || activeView === 'GUDANG_CANCEL' || activeView === 'GUDANG_REPORT' || activeView === 'SCAN_ALL') {
         const timer = setTimeout(() => {
            fetchPackingData(page);
         }, 100);
         return () => clearTimeout(timer);
      }
   }, [page, rowsPerPage, filterPackingStaff, filterPackingShift, packingSearch, filterDate, dateFilterMode, rangeStartDate, rangeEndDate, filterPackingRole, activeView, filterCancelOnly, filterPickerType]);`;

const normCode = code.replace(/\r\n/g, '\n');
const normOldEffect = oldEffect.replace(/\r\n/g, '\n');
const normNewEffect = newEffect.replace(/\r\n/g, '\n');

if (normCode.includes(normOldEffect)) {
   code = isCRLF ? normCode.replace(normOldEffect, normNewEffect).replace(/\n/g, '\r\n') : normCode.replace(normOldEffect, normNewEffect);
   console.log("✅ Step 1: Debounced fetchPackingData effect (100ms) added.");
} else {
   console.log("Note: Step 1 pattern already updated or not found");
}

// 2. Add non-blocking yield in fetchPackingData before heavy Firestore processing
const oldFsFetch = `                  setFirestoreLoadingText(\`Mengambil data rentang \${rangeStartDate} s/d \${rangeEndDate} dari Firestore...\`);
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
                  setFirestoreLoadingText('');`;

const newFsFetch = `                  setFirestoreLoadingText(\`Mengambil data rentang \${rangeStartDate} s/d \${rangeEndDate} dari Firestore...\`);
                  // Yield to UI thread to ensure calendar popup closes smoothly
                  await new Promise(r => setTimeout(r, 10));
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
                  setFirestoreLoadingText('');`;

const normCode2 = code.replace(/\r\n/g, '\n');
const normOldFsFetch = oldFsFetch.replace(/\r\n/g, '\n');
const normNewFsFetch = newFsFetch.replace(/\r\n/g, '\n');

if (normCode2.includes(normOldFsFetch)) {
   code = isCRLF ? normCode2.replace(normOldFsFetch, normNewFsFetch).replace(/\n/g, '\r\n') : normCode2.replace(normOldFsFetch, normNewFsFetch);
   console.log("✅ Step 2: Yield to UI thread in fetchPackingData added.");
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log("All optimizations applied!");
