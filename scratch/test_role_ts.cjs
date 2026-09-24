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

async function testRoleAndTimestamp() {
  const startMs = new Date("2026-09-11T00:00:00").getTime();
  const endMs = new Date("2026-09-11T23:59:59.999").getTime();

  try {
    const q = query(
      collection(db, 'scanned_items'),
      where('role', '==', 'PACKING'),
      where('timestamp', '>=', startMs),
      where('timestamp', '<=', endMs),
      limit(5)
    );
    const snap = await getDocs(q);
    console.log("Query role+timestamp SUCCESS! Docs count:", snap.docs.length);
  } catch (err) {
    console.log("Query role+timestamp FAILED:", err.message);
  }
  process.exit(0);
}

testRoleAndTimestamp().catch(console.error);
