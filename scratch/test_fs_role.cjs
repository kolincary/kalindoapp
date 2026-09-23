const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, getCountFromServer, limit, orderBy } = require('firebase/firestore');

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

async function testRoleQuery() {
  const dateStr = '2026-09-11';
  const startMs = new Date(`${dateStr}T00:00:00`).getTime();
  const endMs = new Date(`${dateStr}T23:59:59.999`).getTime();

  console.log("Testing role query with timestamp range in Firestore...");
  
  // Test 1: where role == 'PACKING' and timestamp >= startMs and timestamp <= endMs
  try {
    const t0 = Date.now();
    const q1 = query(
      collection(db, 'scanned_items'),
      where('role', '==', 'PACKING'),
      where('timestamp', '>=', startMs),
      where('timestamp', '<=', endMs)
    );
    const snap1 = await getDocs(q1);
    console.log(`Test 1 SUCCESS! Found ${snap1.docs.length} docs in ${Date.now() - t0}ms`);
  } catch (err) {
    console.error("Test 1 FAILED:", err.message);
  }

  // Test 2: where role in ['PACKING', 'PACKING_DATA'] and timestamp range
  try {
    const t0 = Date.now();
    const q2 = query(
      collection(db, 'scanned_items'),
      where('role', 'in', ['PACKING', 'PACKING_DATA']),
      where('timestamp', '>=', startMs),
      where('timestamp', '<=', endMs)
    );
    const snap2 = await getDocs(q2);
    console.log(`Test 2 SUCCESS! Found ${snap2.docs.length} docs in ${Date.now() - t0}ms`);
  } catch (err) {
    console.error("Test 2 FAILED:", err.message);
  }

  // Test 3: count aggregation
  try {
    const t0 = Date.now();
    const q3 = query(
      collection(db, 'scanned_items'),
      where('role', '==', 'PACKING'),
      where('timestamp', '>=', startMs),
      where('timestamp', '<=', endMs)
    );
    const countSnap = await getCountFromServer(q3);
    console.log(`Test 3 getCountFromServer SUCCESS! Count = ${countSnap.data().count} in ${Date.now() - t0}ms`);
  } catch (err) {
    console.error("Test 3 FAILED:", err.message);
  }
}

testRoleQuery().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
