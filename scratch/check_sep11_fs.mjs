import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, limit } from 'firebase/firestore';

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

async function check() {
  console.log("Checking Firestore for date 11...");
  // Check range for 2026-09-11
  const startMs = new Date("2026-09-11T00:00:00").getTime();
  const endMs = new Date("2026-09-11T23:59:59.999").getTime();
  console.log("startMs:", startMs, "endMs:", endMs);

  const q1 = query(
    collection(db, 'scanned_items'),
    where('timestamp', '>=', startMs),
    where('timestamp', '<=', endMs),
    limit(20)
  );
  const snap1 = await getDocs(q1);
  console.log("Found with timestamp range 2026-09-11:", snap1.docs.length);
  if (snap1.docs.length > 0) {
    console.log("Sample doc 1:", snap1.docs[0].id, snap1.docs[0].data());
    const roles = new Set(snap1.docs.map(d => d.data().role));
    console.log("Roles found:", Array.from(roles));
  } else {
    // Let's check without timestamp filter, see recent docs or what year they are
    console.log("Checking last 10 docs in scanned_items...");
    const qRecent = query(collection(db, 'scanned_items'), limit(10));
    const snapRecent = await getDocs(qRecent);
    snapRecent.forEach(d => {
      const data = d.data();
      console.log(d.id, "role:", data.role, "timestamp:", data.timestamp, "date:", data.scan_date || data.date, "created_at:", data.created_at);
    });
  }
  process.exit(0);
}

check().catch(console.error);
