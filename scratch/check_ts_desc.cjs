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

  console.log('Querying admin_batch_imports by timestamp desc...');
  const snap = await getDocs(query(collection(db, 'admin_batch_imports'), orderBy('timestamp', 'desc'), limit(15)));

  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    console.log(`[FS timestamp desc] ${d.batchId} | ${d.excelFilename} | staff: ${d.staffName} | count: ${d.barcodes?.length} | ts: ${d.timestamp} | createdAt: ${d.createdAt}`);
  }

  // Also check Supabase batches ordered by created_at desc
  console.log('\nQuerying Supabase batches ordered by created_at desc...');
  const { data: sBatches } = await supabase.from('batches').select('*').order('created_at', { ascending: false }).limit(10);
  for (const b of sBatches) {
    const { count } = await supabase.from('batch_items').select('*', { count: 'exact', head: true }).eq('batch_id', b.id);
    console.log(`[Supabase batches] ${b.batch_no} | ${b.excel_filename} | created_at: ${b.created_at} | batch_items count: ${count}`);
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
