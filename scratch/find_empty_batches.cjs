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
  const { initializeFirestore, collection, getDocs, query, where, orderBy, limit } = await import('firebase/firestore');

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

  // Get latest 20 batches from Supabase
  const { data: batches } = await supabase.from('batches').select('*').order('created_at', { ascending: false }).limit(20);

  console.log('Checking 20 latest Supabase batches...');
  for (const b of batches) {
    const { count: bCount } = await supabase.from('batch_items').select('*', { count: 'exact', head: true }).eq('batch_id', b.id);
    
    if (bCount === 0) {
      // Find this batch in Firestore to get its barcodes
      const fsSnap = await getDocs(query(collection(db, 'admin_batch_imports'), where('batchId', '==', b.batch_no)));
      let fsBarcodes = [];
      let fsDoc = null;
      if (!fsSnap.empty) {
        fsDoc = fsSnap.docs[0].data();
        fsBarcodes = fsDoc.barcodes || [];
      } else {
        // Try match by excelFilename
        const fsSnap2 = await getDocs(query(collection(db, 'admin_batch_imports'), where('excelFilename', '==', b.excel_filename)));
        if (!fsSnap2.empty) {
          fsDoc = fsSnap2.docs[0].data();
          fsBarcodes = fsDoc.barcodes || [];
        }
      }

      // Check if these barcodes are in scanned_items
      let scannedCount = 0;
      if (fsBarcodes.length > 0) {
        const { data: sItems } = await supabase.from('scanned_items').select('barcode').in('barcode', fsBarcodes.slice(0, 50));
        scannedCount = sItems?.length || 0;
      }

      console.log(`\nBatch [${b.batch_no}] "${b.excel_filename}" (created: ${b.created_at}):`);
      console.log(`  batch_items: 0 | Firestore barcodes: ${fsBarcodes.length} | Found in scanned_items: ${scannedCount}`);
      if (fsBarcodes.length > 0 && scannedCount === 0) {
        console.log(`  🚨 FOUND IT! Batch has ${fsBarcodes.length} barcodes in Firestore, but 0 in batch_items AND 0 in scanned_items!`);
        console.log(`  Sample barcodes:`, fsBarcodes.slice(0, 5));
      }
    }
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
