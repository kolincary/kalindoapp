const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

async function run() {
  const { initializeApp } = await import('firebase/app');
  const { initializeFirestore, collection, getDocs, query, where, limit } = await import('firebase/firestore');

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

  // Pick a doc from admin_batch_imports
  const snap = await getDocs(query(collection(db, 'admin_batch_imports'), where('batchId', '==', 'BTCH-20260926-6881')));
  if (snap.empty) {
    console.log('Not found');
    process.exit(0);
  }
  const d = snap.docs[0].data();
  const testBc = d.barcodes[0];
  console.log('Testing barcode from BTCH-20260926-6881:', testBc);

  // Test array-contains with exact barcode
  const q1 = query(collection(db, 'admin_batch_imports'), where('barcodes', 'array-contains', testBc), limit(1));
  const s1 = await getDocs(q1);
  console.log('Query 1 exact match size:', s1.size);

  // What if testBc has leading zeros or different case or spaces?
  // Let's test with lowercase
  const q2 = query(collection(db, 'admin_batch_imports'), where('barcodes', 'array-contains', testBc.toLowerCase()), limit(1));
  const s2 = await getDocs(q2);
  console.log('Query 2 lowercase match size:', s2.size);

  // Check what barcodes look like in a multi-item batch
  const snap2 = await getDocs(query(collection(db, 'admin_batch_imports'), where('batchId', '==', 'BTCH-20260926-6380')));
  const d2 = snap2.docs[0].data();
  console.log('\nTesting barcodes from BTCH-20260926-6380:');
  console.log('First 5 barcodes in Firestore:', d2.barcodes.slice(0, 5));
  
  for (const bc of d2.barcodes.slice(0, 3)) {
    const q = query(collection(db, 'admin_batch_imports'), where('barcodes', 'array-contains', bc), limit(1));
    const s = await getDocs(q);
    console.log(`Query for ${bc}: size = ${s.size}`);
  }

  process.exit(0);
}

run();
