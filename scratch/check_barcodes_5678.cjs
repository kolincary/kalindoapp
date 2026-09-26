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

  const fsSnap = await getDocs(query(collection(db, 'admin_batch_imports'), where('batchId', '==', 'BTCH-20260926-5678')));
  const bData = fsSnap.docs[0].data();
  const barcodes = bData.barcodes;
  console.log('Total barcodes in BTCH-20260926-5678:', barcodes.length);

  // Check in Supabase scanned_items
  const { data: scans, count } = await supabase.from('scanned_items').select('*', { count: 'exact' }).in('barcode', barcodes);
  console.log(`In scanned_items: count = ${count}`);
  if (scans && scans.length > 0) {
    console.log('Sample scans:', scans.slice(0, 5));
  } else {
    console.log('NONE of these barcodes are in scanned_items!');
  }

  // Check in Supabase batch_items
  const { count: bCount } = await supabase.from('batch_items').select('*', { count: 'exact' }).in('barcode', barcodes);
  console.log(`In batch_items: count = ${bCount}`);

  // Check in leader_scan_2
  const { data: leaderScans } = await supabase.from('leader_scan_2').select('*').in('barcode', barcodes);
  console.log(`In leader_scan_2: count = ${leaderScans?.length}`);

  process.exit(0);
}

run();
