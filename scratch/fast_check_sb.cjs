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
  const { initializeFirestore, collection, getDocs, query, where } = await import('firebase/firestore');

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

  // Get all 217 FS batches for 26 in ONE query
  const fsSnap = await getDocs(query(collection(db, 'admin_batch_imports'), where('batchId', '>=', 'BTCH-20260926'), where('batchId', '<=', 'BTCH-20260926-9999')));
  const fsMap = new Map();
  fsSnap.forEach(d => fsMap.set(d.data().batchId, d.data()));
  console.log(`Loaded ${fsMap.size} Firestore batches into memory.`);

  // Get all SB batches
  const { data: sbBatches } = await supabase.from('batches').select('id, batch_no, excel_filename, created_at').ilike('batch_no', 'BTCH-20260926%').order('created_at', { ascending: false });
  console.log(`Loaded ${sbBatches.length} Supabase batches.`);

  // For each batch in Supabase, check batch_items count
  // We can query batch_items for these batch_ids
  const batchIds = sbBatches.map(b => b.id);
  const { data: itemRows } = await supabase.from('batch_items').select('batch_id, barcode').in('batch_id', batchIds);
  const itemsByBatch = new Map();
  itemRows?.forEach(r => {
    itemsByBatch.set(r.batch_id, (itemsByBatch.get(r.batch_id) || 0) + 1);
  });

  console.log(`Loaded ${itemRows?.length || 0} batch_items across these batches.`);

  for (const b of sbBatches) {
    const count = itemsByBatch.get(b.id) || 0;
    const fsData = fsMap.get(b.batch_no);
    if (count > 0 || (fsData && fsData.barcodes?.length > 0)) {
      // If batch_items is 0, let's see why
      if (count === 0) {
        // check sample scan
        const { count: sCount } = await supabase.from('scanned_items').select('*', { count: 'exact', head: true }).in('barcode', (fsData?.barcodes || []).slice(0, 3));
        if (sCount === 0) {
          console.log(`🚨 ZERO ITEMS & ZERO SCANS: ${b.batch_no} | ${b.excel_filename} | created_at: ${b.created_at}`);
        }
      }
    }
  }

  console.log('Check finished successfully.');
  process.exit(0);
}

run();
