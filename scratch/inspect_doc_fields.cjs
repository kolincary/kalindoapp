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

async function checkFields() {
  const q = query(collection(db, 'scanned_items'), limit(5));
  const snap = await getDocs(q);
  snap.docs.forEach((doc, i) => {
    console.log(`Doc ${i + 1} (${doc.id}):`, doc.data());
  });
}

checkFields().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
