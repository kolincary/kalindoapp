const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const apiKey = env.match(/VITE_FIREBASE_API_KEY=(.*)/)?.[1]?.trim();
const projectId = env.match(/VITE_FIREBASE_PROJECT_ID=(.*)/)?.[1]?.trim();
const databaseId = env.match(/VITE_FIREBASE_DATABASE_ID=(.*)/)?.[1]?.trim() || 'project-ks';
const app = initializeApp({ apiKey, projectId });
const db = getFirestore(app, databaseId);

async function run() {
  const docId = '1789565277107-0flqqhi6i';
  const dSnap = await getDoc(doc(db, 'scanned_items', docId));
  console.log(`Document ${docId} in Firestore exists?`, dSnap.exists());
  if (dSnap.exists()) {
    console.log('Doc data:', dSnap.data());
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
