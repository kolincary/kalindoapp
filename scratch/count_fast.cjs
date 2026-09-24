const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getCountFromServer } = require('firebase/firestore');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const apiKey = env.match(/VITE_FIREBASE_API_KEY=(.*)/)?.[1]?.trim();
const projectId = env.match(/VITE_FIREBASE_PROJECT_ID=(.*)/)?.[1]?.trim();
const databaseId = env.match(/VITE_FIREBASE_DATABASE_ID=(.*)/)?.[1]?.trim() || 'project-ks';
const app = initializeApp({ apiKey, projectId });
const db = getFirestore(app, databaseId);

async function run() {
  console.log('--- Fast counts in Firestore (using getCountFromServer) ---');
  for (let day = 7; day <= 20; day++) {
    const dStr = `2026-09-${String(day).padStart(2, '0')}`;
    const sMs = new Date(`${dStr}T00:00:00+07:00`).getTime();
    const eMs = new Date(`${dStr}T23:59:59.999+07:00`).getTime();
    const qDay = query(collection(db, 'scanned_items'), where('timestamp', '>=', sMs), where('timestamp', '<=', eMs));
    const snap = await getCountFromServer(qDay);
    console.log(`Firestore ${dStr}: ${snap.data().count} docs`);
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
