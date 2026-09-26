const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

async function run() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  const { initializeApp } = await import('firebase/app');
  const { initializeFirestore, collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');

  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
  };

  const app = initializeApp(firebaseConfig);
  const db = initializeFirestore(app, {}, env.VITE_FIREBASE_DATABASE_ID || "project-ks");

  console.log('Fetching latest 25 docs from Firestore admin_batch_imports...');
  const snap = await getDocs(query(collection(db, 'admin_batch_imports'), orderBy('createdAt', 'desc'), limit(25)));

  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    // Check in Supabase batches
    const { data: sBatches } = await supabase.from('batches').select('*').eq('batch_no', d.batchId);
    let sBatch = sBatches?.[0];
    let sItemCount = 0;
    if (sBatch) {
      const { count } = await supabase.from('batch_items').select('*', { count: 'exact', head: true }).eq('batch_id', sBatch.id);
      sItemCount = count || 0;
    }

    // Check how many of d.barcodes are in scanned_items
    let scannedCount = 0;
    let sampleScans = [];
    if (d.barcodes && d.barcodes.length > 0) {
      const { data: scans } = await supabase.from('scanned_items').select('barcode, role, employee_name, description').in('barcode', d.barcodes.slice(0, 10));
      scannedCount = scans?.length || 0;
      sampleScans = scans || [];
    }

    console.log(`[FS] ${d.batchId} | ${d.excelFilename} | staff: ${d.staffName} | FS barcodes: ${d.barcodes?.length} | createdAt: ${d.createdAt}`);
    console.log(`     -> Supabase batch found: ${!!sBatch} (id: ${sBatch?.id}), batch_items: ${sItemCount}, sample scans (of 10): ${scannedCount}`);
    if (sItemCount === 0 && scannedCount === 0) {
      console.log(`     ⚠️⚠️ THIS BATCH HAS 0 ITEMS IN SUPABASE AND 0 SCANS! Barcode sample:`, d.barcodes?.slice(0, 3));
    }
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
