const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCyt5XTwrSIK0aWlZXkUw4wdaMrMZsfbP4",
  authDomain: "pro-pulsar-476713-s9.firebaseapp.com",
  projectId: "pro-pulsar-476713-s9",
  storageBucket: "pro-pulsar-476713-s9.firebasestorage.app",
  messagingSenderId: "1087859743191",
  appId: "1:1087859743191:web:aec1c24af3ad0b40d61392"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "project-ks");

async function checkDocs() {
  const startMs = new Date("2026-09-11T00:00:00").getTime();
  const endMs = new Date("2026-09-11T23:59:59.999").getTime();

  const q = query(
    collection(db, 'scanned_items'),
    where('timestamp', '>=', startMs),
    where('timestamp', '<=', endMs),
    limit(500)
  );
  const snap = await getDocs(q);
  console.log("Fetched sample 500 docs");
  const packingDocs = snap.docs.filter(d => {
    const r = (d.data().role || '').toUpperCase();
    return r === 'PACKING' || r.includes('PACK');
  });
  console.log("Packing docs count in first 500:", packingDocs.length);
  if (packingDocs.length > 0) {
    console.log("Sample packing doc:", packingDocs[0].id, packingDocs[0].data());
  }
  process.exit(0);
}
checkDocs().catch(console.error);
