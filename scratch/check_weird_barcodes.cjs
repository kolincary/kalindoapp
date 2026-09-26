const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});

async function run() {
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

  const snap = await getDocs(query(collection(db, 'admin_batch_imports'), orderBy('createdAt', 'desc'), limit(30)));
  console.log('Inspecting barcodes format of 30 recent batches in Firestore:');

  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const bcs = d.barcodes || [];
    // Check if any barcode looks weird (contains spaces, non-standard characters, looks like order id, etc.)
    const weird = bcs.filter(bc => !bc || bc.length < 5 || bc.length > 40 || /\s/.test(bc) || bc.startsWith('INV/') || bc.startsWith('ORD'));
    if (weird.length > 0) {
      console.log(`⚠️ Weird barcodes in batch ${d.batchId} (${d.excelFilename}):`, weird.slice(0, 5));
    }
  }
  console.log('Done check.');
  process.exit(0);
}

run();
