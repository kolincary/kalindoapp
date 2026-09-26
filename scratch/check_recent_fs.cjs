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

  // Get all documents from admin_batch_imports created recently
  const snap = await getDocs(query(collection(db, 'admin_batch_imports'), orderBy('createdAt', 'desc'), limit(30)));
  console.log(`Checking ${snap.docs.length} most recent Firestore admin_batch_imports...`);

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const batchId = data.batchId;
    const excelFilename = data.excelFilename;
    const barcodes = data.barcodes || [];

    // Check Supabase batches
    const { data: sBatch } = await supabase.from('batches').select('*').eq('batch_no', batchId).maybeSingle();
    const { count: bCount } = await supabase.from('batch_items').select('*', { count: 'exact', head: true }).eq('batch_id', sBatch?.id || 'none');
    
    // Check scanned_items for sample of barcodes
    let scannedCount = 0;
    if (barcodes.length > 0) {
      const { data: sItems } = await supabase.from('scanned_items').select('barcode').in('barcode', barcodes.slice(0, 50));
      scannedCount = sItems?.length || 0;
    }

    console.log(`\nFS [${docSnap.id}] | batchId: ${batchId} | File: "${excelFilename}"`);
    console.log(`  CreatedAt: ${data.createdAt} | Barcodes in FS: ${barcodes.length}`);
    console.log(`  Supabase batch exists? ${!!sBatch} (id: ${sBatch?.id}) | batch_items count: ${bCount} | scanned_items count: ${scannedCount}`);

    if (scannedCount === 0 && bCount === 0) {
      console.log(`  ⚠️🚨 UNPROCESSED & MISSING! Neither in batch_items NOR in scanned_items!`);
      console.log(`  Sample barcodes:`, barcodes.slice(0, 5));
    }
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
