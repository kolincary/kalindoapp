const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

async function run() {
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

  // Query batches with batchId starting with BTCH-20260927 or BTCH-20260926
  const snap27 = await getDocs(query(collection(db, 'admin_batch_imports'), where('batchId', '>=', 'BTCH-20260927'), where('batchId', '<=', 'BTCH-20260927-9999')));
  console.log('BTCH-20260927 count:', snap27.size);
  snap27.forEach(d => console.log('27 doc:', d.id, d.data().batchId, d.data().excelFilename, d.data().createdAt));

  const snap26 = await getDocs(query(collection(db, 'admin_batch_imports'), where('batchId', '>=', 'BTCH-20260926'), where('batchId', '<=', 'BTCH-20260926-9999')));
  console.log('BTCH-20260926 count:', snap26.size);
  const list26 = snap26.docs.map(d => ({ id: d.id, ...d.data() }));
  // sort by batchId or createdAt
  list26.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  console.log('Latest 15 from 20260926:');
  list26.slice(0, 15).forEach(d => console.log(`  ${d.batchId} | ${d.excelFilename} | staff: ${d.staffName} | count: ${d.barcodes?.length} | createdAt: ${d.createdAt}`));

  process.exit(0);
}

run();
