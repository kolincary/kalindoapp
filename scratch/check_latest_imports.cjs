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

  console.log('Querying latest 10 Firestore admin_batch_imports by createdAt...');
  const snap = await getDocs(query(collection(db, 'admin_batch_imports'), orderBy('createdAt', 'desc'), limit(10)));
  
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    console.log('\n=======================================');
    console.log('FS ID:', docSnap.id);
    console.log('Batch ID (batchId):', data.batchId);
    console.log('Excel Filename:', data.excelFilename);
    console.log('Staff Name:', data.staffName);
    console.log('Barcodes Count:', data.barcodes?.length);
    console.log('CreatedAt:', data.createdAt);
    console.log('Timestamp:', data.timestamp);

    // Check if this batch exists in Supabase batches
    const { data: sBatch } = await supabase.from('batches').select('*').or(`batch_no.eq.${data.batchId},excel_filename.eq."${data.excelFilename}"`).limit(2);
    console.log('Supabase Batches matched:', sBatch);

    // Check if barcodes exist in Supabase batch_items
    const sampleBarcodes = data.barcodes || [];
    const { data: bItems, count: bCount } = await supabase.from('batch_items').select('barcode, batch_id', { count: 'exact' }).in('barcode', sampleBarcodes.slice(0, 10));
    console.log(`Matched in batch_items (sample 10): ${bCount} items`);

    // Check if barcodes exist in Supabase scanned_items
    const { data: sItems } = await supabase.from('scanned_items').select('barcode, role, employee_name, timestamp, description').in('barcode', sampleBarcodes.slice(0, 5));
    console.log('Matched in scanned_items (sample 5):', sItems?.length, sItems);
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
