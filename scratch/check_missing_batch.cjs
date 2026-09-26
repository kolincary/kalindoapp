const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

async function run() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

  const { data: b } = await supabase.from('batches').select('*').eq('batch_no', 'BTCH-20260926-5678');
  console.log('BTCH-20260926-5678 in Supabase batches:', b);

  const { data: b2 } = await supabase.from('batches').select('*').ilike('excel_filename', '%SP CAMPUR 12.50%');
  console.log('SP CAMPUR 12.50 in Supabase batches:', b2);

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
  console.log('BTCH-20260926-5678 in Firestore:', fsSnap.docs.map(d => d.data()));

  process.exit(0);
}

run();
