import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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
  const startMs = new Date("2026-09-11T00:00:00").getTime();
  const endMs = new Date("2026-09-11T23:59:59.999").getTime();

  const q = query(
    collection(db, 'scanned_items'),
    where('timestamp', '>=', startMs),
    where('timestamp', '<=', endMs)
  );
  const snap = await getDocs(q);
  console.log("Total docs on 2026-09-11:", snap.docs.length);

  const roleCounts = {};
  const menuContextCounts = {};

  snap.docs.forEach(d => {
    const data = d.data();
    const r = data.role || 'EMPTY_ROLE';
    const mc = data.menu_context || 'EMPTY_MC';
    roleCounts[r] = (roleCounts[r] || 0) + 1;
    menuContextCounts[mc] = (menuContextCounts[mc] || 0) + 1;
  });

  console.log("Role counts:", roleCounts);
  console.log("Menu context counts:", menuContextCounts);
  process.exit(0);
}

check().catch(console.error);
