const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('components/AdminDashboard.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

console.log('Original content length:', content.length);

// 1. View switch handler (line ~2987)
content = content.replace(
   "else if (activeView === 'PACKING_2_DATA') {\n         setFilterPackingRole('PACKING_2');",
   "else if (activeView === 'PACKING_2_DATA') {\n         setFilterPackingRole('PACKING');"
);
content = content.replace(
   "else if (activeView === 'PACKING_2_DATA') {\r\n         setFilterPackingRole('PACKING_2');",
   "else if (activeView === 'PACKING_2_DATA') {\r\n         setFilterPackingRole('PACKING');"
);

// 2. fetchDistinctStaff (line ~3314)
content = content.replace(
   "else if (activeView === 'PACKING_DATA') targetRole = 'PACKING';\n            else if (activeView === 'PACKING_2_DATA') targetRole = 'PACKING_2';",
   "else if (activeView === 'PACKING_DATA' || activeView === 'PACKING_2_DATA') targetRole = 'PACKING';"
);
content = content.replace(
   "else if (activeView === 'PACKING_DATA') targetRole = 'PACKING';\r\n            else if (activeView === 'PACKING_2_DATA') targetRole = 'PACKING_2';",
   "else if (activeView === 'PACKING_DATA' || activeView === 'PACKING_2_DATA') targetRole = 'PACKING';"
);

// 3. buildPackingQuery (line ~3676)
content = content.replace(
   "if (targetView === 'PACKING_DATA') effectiveRole = 'PACKING';\n         else if (targetView === 'PACKING_2_DATA') effectiveRole = 'PACKING_2';\n      else if (targetView === 'PACKING_2_DATA') effectiveRole = 'PACKING_2';",
   "if (targetView === 'PACKING_DATA' || targetView === 'PACKING_2_DATA') effectiveRole = 'PACKING';"
);
content = content.replace(
   "if (targetView === 'PACKING_DATA') effectiveRole = 'PACKING';\r\n         else if (targetView === 'PACKING_2_DATA') effectiveRole = 'PACKING_2';\r\n      else if (targetView === 'PACKING_2_DATA') effectiveRole = 'PACKING_2';",
   "if (targetView === 'PACKING_DATA' || targetView === 'PACKING_2_DATA') effectiveRole = 'PACKING';"
);
// In case of slight whitespace variance:
content = content.replace(
   "if (targetView === 'PACKING_DATA') effectiveRole = 'PACKING';\n      else if (targetView === 'PACKING_2_DATA') effectiveRole = 'PACKING_2';",
   "if (targetView === 'PACKING_DATA' || targetView === 'PACKING_2_DATA') effectiveRole = 'PACKING';"
);
content = content.replace(
   "if (targetView === 'PACKING_DATA') effectiveRole = 'PACKING';\r\n      else if (targetView === 'PACKING_2_DATA') effectiveRole = 'PACKING_2';",
   "if (targetView === 'PACKING_DATA' || targetView === 'PACKING_2_DATA') effectiveRole = 'PACKING';"
);

// 4. Firestore fallback (line ~3885)
content = content.replace(
   "const targetRoleName = activeView === 'PACKING_2_DATA' ? 'PACKING_2' : 'PACKING';",
   "const targetRoleName = 'PACKING';"
);

// 5. Update fetchPackingData to update packing2OverallTotal using role 'PACKING'
const oldFetchEnd = `         setPackingData(enrichedData);
         setTotalRows(count || 0);`;

const newFetchEnd = `         setPackingData(enrichedData);
         setTotalRows(count || 0);

         // Update overall total untuk Packing 2 analytics (menggunakan role PACKING yang sama)
         if (activeView === 'PACKING_2_DATA') {
            if (filterPackingStaff === 'ALL') {
               setPacking2OverallTotal(count || 0);
            } else {
               try {
                  const ovStart = new Date(effectiveStartDate + 'T00:00:00');
                  const ovEnd = new Date(effectiveEndDate + 'T23:59:59.999');
                  activeClient.from('scanned_items')
                     .select('id', { count: 'exact', head: true })
                     .gte('timestamp', ovStart.getTime())
                     .lte('timestamp', ovEnd.getTime())
                     .eq('role', 'PACKING')
                     .then(({ count: ovCount }: any) => {
                        if (ovCount !== null && ovCount !== undefined) {
                           setPacking2OverallTotal(ovCount);
                        }
                     });
               } catch (ovErr) {
                  console.error('Error fetching PACKING overall total for Packing 2:', ovErr);
               }
            }
         }`;

if (!content.includes('// Update overall total untuk Packing 2 analytics (menggunakan role PACKING yang sama)')) {
   content = content.replace(oldFetchEnd, newFetchEnd);
}

// 6. Delete target view
content = content.replace(
   "else if (deleteTargetView === 'PACKING_2_DATA') targetRole = 'PACKING_2';",
   "else if (deleteTargetView === 'PACKING_2_DATA') targetRole = 'PACKING';"
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Updated Data Packing 2 data source to match Data Packing perfectly!');
