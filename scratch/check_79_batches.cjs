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

  const { data: sbBatches } = await supabase.from('batches').select('id, batch_no, excel_filename, created_at').ilike('batch_no', 'BTCH-20260926%').order('created_at', { ascending: false });

  console.log(`Checking ${sbBatches.length} batches in Supabase:`);
  let zeroScanCount = 0;
  for (const b of sbBatches) {
    const { count: iCount } = await supabase.from('batch_items').select('*', { count: 'exact', head: true }).eq('batch_id', b.id);
    
    // Check if this batch has scans in scanned_items
    // Fetch barcodes from Firestore admin_batch_imports
    const fsSnap = await getDocs(query(collection(db, 'admin_batch_imports'), where('batchId', '==', b.batch_no)));
    const fsDoc = fsSnap.docs[0]?.data();
    let sCount = 0;
    if (fsDoc && fsDoc.barcodes && fsDoc.barcodes.length > 0) {
      const { count } = await supabase.from('scanned_items').select('*', { count: 'exact', head: true }).in('barcode', fsDoc.barcodes.slice(0, 10));
      sCount = count || 0;
    }

    if (sCount === 0) {
      zeroScanCount++;
      console.log(`🚨 ZERO SCANS: ${b.batch_no} | ${b.excel_filename} | batch_items count: ${iCount} | created_at: ${b.created_at}`);
    }
  }

  console.log(`Total zero scans in SB batches: ${zeroScanCount}`);
  process.exit(0);
}

run();
