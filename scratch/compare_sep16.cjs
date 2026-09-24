const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit } = require('firebase/firestore');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const apiKey = env.match(/VITE_FIREBASE_API_KEY=(.*)/)?.[1]?.trim();
const projectId = env.match(/VITE_FIREBASE_PROJECT_ID=(.*)/)?.[1]?.trim();
const databaseId = env.match(/VITE_FIREBASE_DATABASE_ID=(.*)/)?.[1]?.trim() || 'project-ks';
const app = initializeApp({ apiKey, projectId });
const db = getFirestore(app, databaseId);

const sbUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const sbKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const sb = createClient(sbUrl, sbKey);

async function run() {
  // Let's get 5 barcodes from Supabase on 16 Sep 2026 (Packing)
  const { data: sbItems, error } = await sb
    .from('scanned_items')
    .select('id, barcode, role, employee_name, created_at, scan_date')
    .gte('created_at', '2026-09-16T00:00:00')
    .lte('created_at', '2026-09-16T23:59:59')
    .in('role', ['PACKING', 'PACKING_2'])
    .limit(5);

  console.log('5 Supabase items from 16 Sep 2026:');
  console.log(sbItems);

  if (sbItems && sbItems.length > 0) {
    for (const item of sbItems) {
      console.log('\nLooking up in Firestore for barcode:', item.barcode);
      const q = query(collection(db, 'scanned_items'), where('barcode', '==', item.barcode));
      const snap = await getDocs(q);
      console.log('Found in Firestore:', snap.size);
      snap.docs.forEach(d => {
        const data = d.data();
        console.log('Firestore doc:', d.id, {
          role: data.role,
          employee_name: data.employee_name,
          timestamp: data.timestamp,
          timestampDate: data.timestamp ? new Date(data.timestamp).toISOString() : null,
          created_at: data.created_at,
          scan_date: data.scan_date
        });
      });
    }
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
