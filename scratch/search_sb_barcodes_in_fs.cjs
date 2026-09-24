const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const apiKey = env.match(/VITE_FIREBASE_API_KEY=(.*)/)?.[1]?.trim();
const projectId = env.match(/VITE_FIREBASE_PROJECT_ID=(.*)/)?.[1]?.trim();
const databaseId = env.match(/VITE_FIREBASE_DATABASE_ID=(.*)/)?.[1]?.trim() || 'project-ks';
const app = initializeApp({ apiKey, projectId });
const db = getFirestore(app, databaseId);

const testBarcodes = [
  'JY1776898781',
  'TG0012284658',
  'SPXID069971689369',
  '004661100643',
  '006911672072',
  'SPXID060073537919',
  'SPXID068652484659',
  'JY1730998971',
  'SPXID068316273989'
];

async function run() {
  console.log('Searching Supabase screenshot barcodes in Firestore:');
  for (const b of testBarcodes) {
    const q = query(collection(db, 'scanned_items'), where('barcode', '==', b));
    const snap = await getDocs(q);
    console.log(`Barcode ${b} in Firestore: ${snap.size} docs`);
    snap.docs.forEach(d => {
      const data = d.data();
      console.log('  Doc:', d.id, {
        role: data.role,
        employee_name: data.employee_name,
        timestamp: data.timestamp,
        date: data.timestamp ? new Date(data.timestamp).toISOString() : null,
        created_at: data.created_at,
        scan_date: data.scan_date
      });
    });
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
