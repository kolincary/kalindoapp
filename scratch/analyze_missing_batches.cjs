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

  const snap = await getDocs(query(collection(db, 'admin_batch_imports'), where('batchId', '>=', 'BTCH-20260926'), where('batchId', '<=', 'BTCH-20260926-9999')));
  const fsBatches = snap.docs.map(d => d.data());

  const { data: sbBatches } = await supabase.from('batches').select('batch_no, excel_filename, created_at').ilike('batch_no', 'BTCH-20260926%');
  const sbSet = new Set(sbBatches.map(b => b.batch_no));

  const missingFromSb = fsBatches.filter(fb => !sbSet.has(fb.batchId));
  console.log(`Total in Firestore: ${fsBatches.length}`);
  console.log(`Total in Supabase: ${sbBatches.length}`);
  console.log(`Missing from Supabase: ${missingFromSb.length}`);

  console.log('\nSample 10 batches missing from Supabase:');
  for (const m of missingFromSb.slice(0, 10)) {
    // Check if barcodes of m are in scanned_items
    const { count } = await supabase.from('scanned_items').select('*', { count: 'exact', head: true }).in('barcode', m.barcodes.slice(0, 10));
    console.log(`  ${m.batchId} | ${m.excelFilename} | staff: ${m.staffName} | count: ${m.barcodes?.length} | scans in scanned_items (sample 10): ${count}`);
  }

  process.exit(0);
}

run();
