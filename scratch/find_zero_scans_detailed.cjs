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
  console.log(`Checking ${missingFromSb.length} missing batches for zero scans...`);

  let zeroScanCount = 0;
  for (const m of missingFromSb) {
    if (!m.barcodes || m.barcodes.length === 0) continue;
    const { count } = await supabase.from('scanned_items').select('*', { count: 'exact', head: true }).in('barcode', m.barcodes.slice(0, 10));
    if (count === 0) {
      zeroScanCount++;
      console.log(`🚨 FOUND ZERO SCAN MISSING BATCH: ${m.batchId} | ${m.excelFilename} | staff: ${m.staffName} | count: ${m.barcodes.length} | createdAt: ${m.createdAt}`);
    }
  }

  console.log(`Total zero scan missing batches: ${zeroScanCount}`);

  // ALSO check the 79 batches that ARE in Supabase to see if any of them has zero scans AND 0 batch_items!
  console.log('\nChecking the 79 batches in Supabase for zero scans & zero batch_items:');
  for (const b of sbBatches) {
    const { count: iCount } = await supabase.from('batch_items').select('*', { count: 'exact', head: true }).eq('batch_no', b.batch_no);
    const fsMatch = fsBatches.find(f => f.batchId === b.batch_no);
    if (fsMatch && fsMatch.barcodes) {
      const { count: sCount } = await supabase.from('scanned_items').select('*', { count: 'exact', head: true }).in('barcode', fsMatch.barcodes.slice(0, 10));
      if (sCount === 0) {
        console.log(`🚨 ZERO SCANS IN SB BATCH: ${b.batch_no} | ${b.excel_filename} | batch_items: ${iCount}`);
      }
    }
  }

  process.exit(0);
}

run();
