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

  // Query latest 40 from admin_batch_imports
  const snap = await getDocs(query(collection(db, 'admin_batch_imports'), orderBy('createdAt', 'desc'), limit(40)));
  console.log(`Checking 40 latest admin_batch_imports...`);

  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    if (!d.barcodes || d.barcodes.length === 0) continue;

    // Check 3 sample barcodes in scanned_items
    const { count: sCount } = await supabase.from('scanned_items').select('*', { count: 'exact', head: true }).in('barcode', d.barcodes.slice(0, 5));
    const { count: bCount } = await supabase.from('batch_items').select('*', { count: 'exact', head: true }).in('barcode', d.barcodes.slice(0, 5));
    const { data: sBatch } = await supabase.from('batches').select('id, batch_no').eq('batch_no', d.batchId);

    if (sCount === 0) {
      console.log(`\n🔍 ZERO SCANS FOUND:`);
      console.log(`   Batch: ${d.batchId} | ${d.excelFilename} | staff: ${d.staffName} | count: ${d.barcodes.length} | createdAt: ${d.createdAt} | ts: ${d.timestamp}`);
      console.log(`   In Supabase batches: ${sBatch && sBatch.length > 0 ? sBatch[0].id : 'NOT FOUND'}`);
      console.log(`   In batch_items (sample 5): ${bCount}`);
      console.log(`   Barcodes sample:`, d.barcodes.slice(0, 5));
    }
  }

  process.exit(0);
}

run();
