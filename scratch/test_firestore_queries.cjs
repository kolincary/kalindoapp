const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit, orderBy, getCountFromServer } = require('firebase/firestore');

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

async function test() {
  console.log("Testing Firestore queries...");
  const startMs = new Date('2026-09-18T00:00:00').getTime();
  const endMs = new Date('2026-09-24T23:59:59').getTime();
  
  // Test 1: Count query (range only)
  try {
    const qCount = query(
      collection(db, 'scanned_items'),
      where('timestamp', '>=', startMs),
      where('timestamp', '<=', endMs)
    );
    const countSnap = await getCountFromServer(qCount);
    console.log("Total docs in range 18-24 Sep (All roles):", countSnap.data().count);
  } catch (e) {
    console.error("Count query error:", e.message);
  }

  // Test 2: Role + Timestamp query (Check if composite index exists)
  try {
    const qRole = query(
      collection(db, 'scanned_items'),
      where('role', '==', 'LOGISTIK'),
      where('timestamp', '>=', startMs),
      where('timestamp', '<=', endMs),
      limit(10)
    );
    const snapRole = await getDocs(qRole);
    console.log("Role query success! Sample doc count:", snapRole.docs.length);
  } catch (e) {
    console.error("Role + Timestamp query error (Missing index?):", e.message);
  }

  // Test 3: Role Count query
  try {
    const qRoleCount = query(
      collection(db, 'scanned_items'),
      where('role', '==', 'LOGISTIK'),
      where('timestamp', '>=', startMs),
      where('timestamp', '<=', endMs)
    );
    const countRoleSnap = await getCountFromServer(qRoleCount);
    console.log("Total LOGISTIK docs in range 18-24 Sep:", countRoleSnap.data().count);
  } catch (e) {
    console.error("Role Count query error:", e.message);
  }
}

test().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
