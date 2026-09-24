const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'components', 'AdminDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const target = '   // 5. Dynamic Staff List Logic (Data Driven + Shift Filter)';
const idx = code.indexOf(target);
console.log('Index of target:', idx);

if (idx !== -1) {
   const endTarget = '}, [activeView, filterDate, filterPackingShift, employees, canManageDate, filterPackingRole]);';
   const endIdx = code.indexOf(endTarget, idx);
   console.log('Index of endTarget:', endIdx);
   if (endIdx !== -1) {
      const newBlock = `   // 5. Dynamic Staff List Logic (Data Driven + Shift Filter)
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

      code = code.substring(0, idx) + newBlock + code.substring(endIdx + endTarget.length);
      fs.writeFileSync(targetFile, code, 'utf8');
      console.log('Successfully replaced Effect 5!');
   } else {
      console.log('endTarget not found');
   }
} else {
   console.log('target not found');
}
