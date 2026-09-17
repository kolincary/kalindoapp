const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../components/AdminDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const isCRLF = content.includes('\r\n');
let lines = content.replace(/\r\n/g, '\n').split('\n');

const startIdx = 1935; // index 1935 is line 1936: const handleGlobalSearchFs = async () => {
let endIdx = -1;

for (let i = startIdx; i < startIdx + 160; i++) {
  if (lines[i] && lines[i].includes('const handleSaveSupabaseConfig = async () => {')) {
    endIdx = i - 1;
    break;
  }
}

console.log('startIdx:', startIdx, 'endIdx:', endIdx);

const replacement = [
`   const handleGlobalSearchFs = async () => {
      const term = globalSearchTermFs.trim();
      if (!term || term.length < 3) {
         alert("Masukkan minimal 3 karakter.");
         return;
      }

      setIsGlobalSearchingFs(true);
      const upper = term.toUpperCase();
      console.log(\`[SYS] Deep Hunt Barcode (Firestore): \${upper}\`);

      try {
         const { db } = await import('../services/firebaseClient');
         const { collection, getDocs, query, where } = await import('firebase/firestore');
         let allData: any[] = [];

         const variations = Array.from(new Set([term, upper, term.toLowerCase()]));
         
         // Query 1: Search in barcode (scanned_items)
         try {
            const q1 = query(collection(db, 'scanned_items'), where('barcode', 'in', variations));
            const snap1 = await getDocs(q1);
            snap1.forEach(doc => {
               allData.push({ ...doc.data(), id: doc.id, source: 'FIRESTORE' });
            });
         } catch (e) {}

         // Query 2: Search in destination (scanned_items)
         try {
            const q2 = query(collection(db, 'scanned_items'), where('destination', 'in', variations));
            const snap2 = await getDocs(q2);
            snap2.forEach(doc => {
               if (!allData.find(d => d.id === doc.id)) {
                  allData.push({ ...doc.data(), id: doc.id, source: 'FIRESTORE' });
               }
            });
         } catch (e) {}

         // Query 3: Search in description (scanned_items)
         try {
            const q3 = query(collection(db, 'scanned_items'), where('description', 'in', variations));
            const snap3 = await getDocs(q3);
            snap3.forEach(doc => {
               if (!allData.find(d => d.id === doc.id)) {
                  allData.push({ ...doc.data(), id: doc.id, source: 'FIRESTORE' });
               }
            });
         } catch (e) {}

         // Query 4: Search in leader_pending_scans
         try {
            const q4 = query(collection(db, 'leader_pending_scans'), where('barcode', 'in', variations));
            const snap4 = await getDocs(q4);
            snap4.forEach(doc => {
               const d = doc.data() as any;
               if (!allData.find(dItem => dItem.id === doc.id)) {
                  allData.push({
                     ...d,
                     id: doc.id,
                     source: 'FIRESTORE',
                     role: 'LEADER_PENDING',
                     employee_name: d.leader_name || d.leader_profile || 'LEADER'
                  });
               }
            });
         } catch (e) {}
        
         // Sort by timestamp desc locally
         allData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
         
         setGlobalSearchResultsFs(allData);
         if (allData.length === 0) {
            alert(\`Tidak ditemukan data resi "\${term}" di Firestore.\`);
         }
      } catch (err: any) {
         console.error("Error global search firestore:", err);
         alert("Gagal mencari data di Firestore: " + err.message);
      } finally {
         setIsGlobalSearchingFs(false);
      }
   };

   const handleGlobalSearch = async () => {
      const term = globalSearchTerm.trim();
      if (!term || term.length < 3) {
         alert("Masukkan minimal 3 karakter.");
         return;
      }

      setIsGlobalSearching(true);
      const upper = term.toUpperCase();
      const lower = term.toLowerCase();
      const variations = Array.from(new Set([term, upper, lower]));

      try {
         const { supabase, supabaseNew, supabaseSpecialOld } = await import('../services/supabaseClient');
         const { db } = await import('../services/firebaseClient');
         const { collection, getDocs, query, where } = await import('firebase/firestore');

         const fetchSb = async (client: any, sourceDb: string, label: string, table: string = 'scanned_items', defaultRole?: string) => {
            try {
               if (!client) return [];
               const isLikelyBarcode = term.length >= 8 && !term.includes(' ');

               let orQuery = \`barcode.eq.\${upper}\`;
               if (!isLikelyBarcode) {
                  if (table === 'leader_pending_scans' || table === 'leader_scan_2') {
                     orQuery = \`barcode.eq.\${upper},barcode.ilike.%\${term}%,leader_name.ilike.%\${term}%,leader_profile.ilike.%\${term}%\`;
                  } else {
                     orQuery = \`barcode.eq.\${upper},barcode.ilike.%\${term}%,destination.ilike.%\${term}%\`;
                  }
               }

               const { data, error } = await client
                  .from(table)
                  .select('*')
                  .or(orQuery)
                  .limit(100);
               if (error || !data) return [];
               return data.map((item: any) => ({
                  ...item,
                  employee_name: item.employee_name || item.leader_name || item.leader_profile || 'LEADER',
                  role: item.role || defaultRole || (table === 'leader_pending_scans' ? 'LEADER_PENDING' : (table === 'leader_scan_2' ? 'LEADER_2' : 'UNKNOWN')),
                  source_db: sourceDb,
                  source_label: label + (table === 'leader_pending_scans' ? ' (Pending Leader)' : (table === 'leader_scan_2' ? ' (Rekap Leader)' : ''))
               }));
            } catch (e) {
               return [];
            }
         };

         const fetchFs = async () => {
            try {
               let fsItems: any[] = [];

               // 1. scanned_items by barcode
               try {
                  const q1 = query(collection(db, 'scanned_items'), where('barcode', 'in', variations));
                  const snap1 = await getDocs(q1);
                  snap1.forEach(doc => {
                     fsItems.push({ ...doc.data(), id: doc.id, source_db: 'FIRESTORE', source_label: 'Firestore' });
                  });
               } catch (e) {}

               // 2. scanned_items by destination
               try {
                  const q2 = query(collection(db, 'scanned_items'), where('destination', 'in', variations));
                  const snap2 = await getDocs(q2);
                  snap2.forEach(doc => {
                     if (!fsItems.find(d => d.id === doc.id)) {
                        fsItems.push({ ...doc.data(), id: doc.id, source_db: 'FIRESTORE', source_label: 'Firestore' });
                     }
                  });
               } catch (e) {}

               // 3. leader_pending_scans in Firestore
               try {
                  const qL = query(collection(db, 'leader_pending_scans'), where('barcode', 'in', variations));
                  const snapL = await getDocs(qL);
                  snapL.forEach(doc => {
                     const d = doc.data() as any;
                     if (!fsItems.find(item => item.id === doc.id)) {
                        fsItems.push({
                           ...d,
                           id: doc.id,
                           employee_name: d.leader_name || d.leader_profile || 'LEADER',
                           role: 'LEADER_PENDING',
                           source_db: 'FIRESTORE',
                           source_label: 'Firestore (Pending Leader)'
                        });
                     }
                  });
               } catch (e) {}

               return fsItems;
            } catch (e) {
               return [];
            }
         };

         const [
            primaryScans,
            archiveScans,
            oldScans,
            primaryLeaderPending,
            archiveLeaderPending,
            primaryLeader2,
            archiveLeader2,
            fsData
         ] = await Promise.all([
            fetchSb(supabase, 'SUPABASE_PRIMARY', 'Supabase Utama', 'scanned_items'),
            fetchSb(supabaseNew, 'SUPABASE_ARCHIVE', 'Supabase Archive', 'scanned_items'),
            fetchSb(supabaseSpecialOld, 'SUPABASE_OLD', 'Supabase Lama', 'scanned_items'),
            fetchSb(supabase, 'SUPABASE_PRIMARY', 'Supabase Utama', 'leader_pending_scans', 'LEADER_PENDING'),
            fetchSb(supabaseNew, 'SUPABASE_ARCHIVE', 'Supabase Archive', 'leader_pending_scans', 'LEADER_PENDING'),
            fetchSb(supabase, 'SUPABASE_PRIMARY', 'Supabase Utama', 'leader_scan_2', 'LEADER_2'),
            fetchSb(supabaseNew, 'SUPABASE_ARCHIVE', 'Supabase Archive', 'leader_scan_2', 'LEADER_2'),
            fetchFs()
         ]);

         let allMerged = [
            ...primaryScans,
            ...archiveScans,
            ...oldScans,
            ...primaryLeaderPending,
            ...archiveLeaderPending,
            ...primaryLeader2,
            ...archiveLeader2,
            ...fsData
         ];

         const uniqueMap = new Map();
         allMerged.forEach(item => {
            const key = item.id || \`\${item.barcode}_\${item.role}_\${item.timestamp}\`;
            if (!uniqueMap.has(key)) {
               uniqueMap.set(key, item);
            }
         });

         const sortedResults = Array.from(uniqueMap.values()).sort((a: any, b: any) => {
            const getT = (x: any) => x.timestamp ? new Date(x.timestamp).getTime() : 0;
            return getT(b) - getT(a);
         });

         setGlobalSearchResults(sortedResults);
         if (sortedResults.length === 0) {
            alert(\`Tidak ditemukan data resi "\${term}" di 4 Database (Supabase Utama, Archive, Supabase Lama, maupun Firestore).\`);
         }
      } catch (err: any) {
         console.error("Critical Failure in Global Search:", err);
         alert("Terjadi kesalahan saat mencari data: " + err.message);
      } finally {
         setIsGlobalSearching(false);
      }
   };`
];

lines.splice(startIdx, endIdx - startIdx + 1, ...replacement);
console.log('Successfully spliced search functions!');

let newContent = lines.join('\n');
if (isCRLF) newContent = newContent.replace(/\n/g, '\r\n');

fs.writeFileSync(targetFile, newContent, 'utf8');
console.log('AdminDashboard.tsx saved with updated search functions!');
