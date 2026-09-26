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

  const snap = await getDocs(query(collection(db, 'admin_batch_imports'), orderBy('createdAt', 'desc'), limit(100)));
  console.log(`Checking 100 recent admin_batch_imports...`);

  let countZeroScans = 0;
  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    if (!d.barcodes || d.barcodes.length === 0) continue;

    // Check count in scanned_items
    const { count } = await supabase.from('scanned_items').select('*', { count: 'exact', head: true }).in('barcode', d.barcodes);
    
    // Check in batch_items
    const { count: bCount } = await supabase.from('batch_items').select('*', { count: 'exact', head: true }).in('barcode', d.barcodes);

    // Check in batches
    const { data: bHeader } = await supabase.from('batches').select('id, batch_no').eq('batch_no', d.batchId);

    if (count === 0) {
      countZeroScans++;
      console.log(`\n🚨 ZERO SCANS: Batch ${d.batchId} | ${d.excelFilename} | staff: ${d.staffName} | count: ${d.barcodes.length} | createdAt: ${d.createdAt}`);
      console.log(`   Supabase batches header exists: ${bHeader && bHeader.length > 0 ? 'YES (id: ' + bHeader[0].id + ')' : 'NO'}`);
      console.log(`   batch_items count: ${bCount}`);
      console.log(`   First 3 barcodes:`, d.barcodes.slice(0, 3));
    }
  }

  console.log(`\nTotal batches with 0 scans found: ${countZeroScans}`);
  process.exit(0);
}

run();
