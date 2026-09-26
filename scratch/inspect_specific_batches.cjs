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

  const batchIds = ['BTCH-20260926-6380', 'BTCH-20260926-8601', 'BTCH-20260926-4123', 'BTCH-20260926-6881', 'BTCH-20260926-0852'];

  for (const bId of batchIds) {
    console.log('\n=======================================');
    console.log('Inspecting:', bId);
    
    // 1. Supabase batch
    const { data: sBatch } = await supabase.from('batches').select('*').eq('batch_no', bId);
    console.log('Supabase batch:', sBatch);
    const sId = sBatch?.[0]?.id;

    // 2. Supabase batch_items
    if (sId) {
      const { count: bCount, data: bItems } = await supabase.from('batch_items').select('*', { count: 'exact' }).eq('batch_id', sId);
      console.log(`Supabase batch_items count: ${bCount}`);
      if (bItems && bItems.length > 0) {
        console.log('Supabase batch_items sample:', bItems.slice(0, 3));
      }
    }

    // 3. Firestore admin_batch_imports
    const fsSnap = await getDocs(query(collection(db, 'admin_batch_imports'), where('batchId', '==', bId)));
    console.log(`Firestore docs found: ${fsSnap.size}`);
    fsSnap.forEach(d => {
      const fd = d.data();
      console.log('Firestore doc:', {
        id: d.id,
        batchId: fd.batchId,
        excelFilename: fd.excelFilename,
        staffName: fd.staffName,
        barcodesCount: fd.barcodes?.length,
        sampleBarcodes: fd.barcodes?.slice(0, 5)
      });

      // Check if these barcodes are in scanned_items
      if (fd.barcodes?.length) {
        supabase.from('scanned_items').select('barcode, role, employee_name, timestamp, description').in('barcode', fd.barcodes.slice(0, 5))
          .then(({ data: scans }) => {
            console.log(`Scanned items for ${bId} (sample 5):`, scans);
          });
      }
    });
  }

  setTimeout(() => process.exit(0), 3000);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
