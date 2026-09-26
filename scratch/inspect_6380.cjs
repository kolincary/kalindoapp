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

  const fsSnap = await getDocs(query(collection(db, 'admin_batch_imports'), where('batchId', '==', 'BTCH-20260926-6380')));
  const bData = fsSnap.docs[0].data();
  const barcodes = bData.barcodes;
  console.log('BTCH-20260926-6380 total barcodes:', barcodes.length);

  // Check how many of these 50 barcodes are in scanned_items for EACH role
  const { data: scans } = await supabase.from('scanned_items').select('barcode, role, employee_name, description, timestamp').in('barcode', barcodes);
  
  const byRole = {};
  const scannedBarcodesSet = new Set();
  scans?.forEach(s => {
    byRole[s.role] = (byRole[s.role] || 0) + 1;
    scannedBarcodesSet.add(s.barcode);
  });

  console.log('Scans breakdown by role:', byRole);
  console.log('Unique barcodes scanned:', scannedBarcodesSet.size, 'out of', barcodes.length);
  
  const unscanned = barcodes.filter(bc => !scannedBarcodesSet.has(bc));
  console.log('Unscanned barcodes count:', unscanned.length);
  if (unscanned.length > 0) {
    console.log('Sample unscanned barcodes:', unscanned.slice(0, 5));
  }

  // Check if any unscanned barcodes are in batch_items
  const { data: bItems } = await supabase.from('batch_items').select('*').in('barcode', barcodes);
  console.log('In batch_items count:', bItems?.length);

  process.exit(0);
}

run();
