const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit, orderBy } = require('firebase/firestore');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const apiKey = env.match(/VITE_FIREBASE_API_KEY=(.*)/)?.[1]?.trim();
const projectId = env.match(/VITE_FIREBASE_PROJECT_ID=(.*)/)?.[1]?.trim();
const databaseId = env.match(/VITE_FIREBASE_DATABASE_ID=(.*)/)?.[1]?.trim() || 'project-ks';
const app = initializeApp({ apiKey, projectId });
const db = getFirestore(app, databaseId);

async function run() {
  console.log('--- Checking Firestore collections and dates ---');
  
  // 1. Get recent docs ordered by timestamp desc
  const qDesc = query(collection(db, 'scanned_items'), orderBy('timestamp', 'desc'), limit(10));
  const snapDesc = await getDocs(qDesc);
  console.log('Latest 10 docs in Firestore by timestamp:');
  snapDesc.docs.forEach(d => {
    const data = d.data();
    console.log(d.id, {
      barcode: data.barcode,
      role: data.role,
      employee_name: data.employee_name,
      timestamp: data.timestamp,
      date: data.timestamp ? new Date(data.timestamp).toISOString() : null,
      created_at: data.created_at,
      scan_date: data.scan_date
    });
  });

  // 2. Check around Sep 16, 2026:
  // Is it possible the timestamps in Firestore are in SECONDS instead of MILLISECONDS, or vice versa?
  // Let's check if there are docs with timestamp < 2000000000 (seconds)
  const qSeconds = query(collection(db, 'scanned_items'), where('timestamp', '>=', 1789491600), where('timestamp', '<=', 1789578000));
  const snapSeconds = await getDocs(qSeconds);
  console.log('Docs with timestamp in SECONDS for Sep 16, 2026:', snapSeconds.size);

  // 3. Are there other collections in Firestore?
  // Let's check common collection names: 'scans', 'packing_scans', 'scanned_items_backup', 'offline_scans'
  const collectionsToCheck = ['scans', 'packing_scans', 'scanned_items_backup', 'offline_scans', 'daily_scans', 'packing_data'];
  for (const colName of collectionsToCheck) {
    try {
      const q = query(collection(db, colName), limit(2));
      const s = await getDocs(q);
      console.log(`Collection '${colName}' exists? Count:`, s.size);
    } catch (e) {
      console.log(`Collection '${colName}' check failed:`, e.message);
    }
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
