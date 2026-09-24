const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit, orderBy } = require('firebase/firestore');

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

async function testIndexes() {
  console.log("Testing Firestore query possibilities...");
  
  // Test 1: scan_date (some docs have scan_date or created_at)
  try {
    const q1 = query(collection(db, 'scanned_items'), where('role', '==', 'LOGISTIK'), limit(5));
    const snap1 = await getDocs(q1);
    console.log("Role alone query: SUCCESS, found", snap1.docs.length);
  } catch (err) {
    console.log("Role alone query FAILED:", err.message);
  }

  // Test 2: order by timestamp desc with limit
  try {
    const q2 = query(collection(db, 'scanned_items'), orderBy('timestamp', 'desc'), limit(5));
    const snap2 = await getDocs(q2);
    console.log("OrderBy timestamp desc: SUCCESS, found", snap2.docs.length);
  } catch (err) {
    console.log("OrderBy timestamp desc FAILED:", err.message);
  }
}

testIndexes().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
