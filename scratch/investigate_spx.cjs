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

  const barcode = 'SPXID066597987679';

  // 1. Check in Firestore admin_batch_imports
  const fsSnap = await getDocs(query(collection(db, 'admin_batch_imports'), where('barcodes', 'array-contains', barcode)));
  console.log(`Firestore admin_batch_imports docs found: ${fsSnap.size}`);
  fsSnap.forEach(d => {
    const fd = d.data();
    console.log('  Firestore doc:', d.id, fd.batchId, fd.excelFilename, fd.createdAt, fd.timestamp);
  });

  // 2. Check in Supabase batches
  if (fsSnap.size > 0) {
    const bId = fsSnap.docs[0].data().batchId;
    const { data: sBatch } = await supabase.from('batches').select('*').eq('batch_no', bId);
    console.log(`  Supabase batch for ${bId}:`, sBatch);
  }

  // 3. Check in Supabase batch_items
  const { data: bItems } = await supabase.from('batch_items').select('*').eq('barcode', barcode);
  console.log('  Supabase batch_items:', bItems);

  // 4. Check in Supabase scanned_items
  const { data: scans } = await supabase.from('scanned_items').select('*').eq('barcode', barcode);
  console.log('  Supabase scanned_items:', scans);

  process.exit(0);
}

run();
