const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCyt5XTwrSIK0aWlZXkUw4wdaMrMZsfbP4",
  authDomain: "pro-pulsar-476713-s9.firebaseapp.com",
  projectId: "pro-pulsar-476713-s9",
  storageBucket: "pro-pulsar-476713-s9.firebasestorage.app",
  messagingSenderId: "1087859743191",
  appId: "1:1087859743191:web:aec1c24af3ad0b40d61392"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'project-ks');

async function checkFs() {
  console.log('Querying Firestore project-ks -> scanned_items...');
  const q = query(collection(db, 'scanned_items'), limit(5));
  const snap = await getDocs(q);
  console.log('Docs found in scanned_items:', snap.size);
  snap.forEach(d => console.log(d.id, d.data().barcode, d.data().role, d.data().timestamp, new Date(d.data().timestamp).toLocaleDateString()));
}

checkFs();
