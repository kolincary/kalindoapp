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
  const { initializeFirestore, collection, getDocs, query, where, limit } = await import('firebase/firestore');

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

  // Query Firestore admin_batch_imports for recent batches
  console.log('Querying Firestore admin_batch_imports...');
  const snap = await getDocs(query(collection(db, 'admin_batch_imports'), where('batchId', '>=', 'BTCH-20260926'), limit(5)));
  
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    console.log('\n--- FIRESTORE BATCH ---');
    console.log('ID:', docSnap.id, 'batchId:', data.batchId, 'excelFilename:', data.excelFilename, 'barcodes count:', data.barcodes?.length);
    const sampleBarcodes = data.barcodes?.slice(0, 5) || [];
    console.log('Sample barcodes:', sampleBarcodes);

    // Check where these sample barcodes are in Supabase:
    // 1. In batch_items?
    const { data: bItems } = await supabase.from('batch_items').select('*').in('barcode', sampleBarcodes);
    console.log('Found in batch_items:', bItems?.length, bItems?.map(b => ({ barcode: b.barcode, batch_id: b.batch_id })));

    // 2. In scanned_items?
    const { data: sItems } = await supabase.from('scanned_items').select('barcode, role, employee_name, timestamp, description').in('barcode', sampleBarcodes);
    console.log('Found in scanned_items:', sItems?.length, sItems);
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
