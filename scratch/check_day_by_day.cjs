const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit } = require('firebase/firestore');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const apiKey = env.match(/VITE_FIREBASE_API_KEY=(.*)/)?.[1]?.trim();
const projectId = env.match(/VITE_FIREBASE_PROJECT_ID=(.*)/)?.[1]?.trim();
const databaseId = env.match(/VITE_FIREBASE_DATABASE_ID=(.*)/)?.[1]?.trim() || 'project-ks';
const app = initializeApp({ apiKey, projectId });
const db = getFirestore(app, databaseId);

async function run() {
  console.log('--- Checking for ANY docs in Firestore related to 16 September 2026 ---');

  // Test 1: scan_date == '2026-09-16'
  const q1 = query(collection(db, 'scanned_items'), where('scan_date', '==', '2026-09-16'), limit(5));
  const s1 = await getDocs(q1);
  console.log('1. scan_date == "2026-09-16":', s1.size);

  // Test 2: scan_date == '16-09-2026' or '16/09/2026'
  const q2 = query(collection(db, 'scanned_items'), where('scan_date', '==', '16/09/2026'), limit(5));
  const s2 = await getDocs(q2);
  console.log('2. scan_date == "16/09/2026":', s2.size);

  // Test 3: created_at starts with '2026-09-16'
  const q3 = query(collection(db, 'scanned_items'), where('created_at', '>=', '2026-09-16'), where('created_at', '<=', '2026-09-16\uf8ff'), limit(5));
  const s3 = await getDocs(q3);
  console.log('3. created_at string 2026-09-16 prefix:', s3.size);
  if (s3.size > 0) {
    s3.docs.forEach(d => console.log('   Doc:', d.id, d.data().barcode, d.data().role, d.data().created_at, d.data().timestamp));
  }

  // Test 4: How many docs in Firestore have created_at as string vs number?
  // Let's check 11 September 2026 (which user said has data)
  console.log('\n--- Checking 11 September 2026 in Firestore (which user said has data) ---');
  const startMs11 = new Date('2026-09-11T00:00:00+07:00').getTime();
  const endMs11 = new Date('2026-09-11T23:59:59.999+07:00').getTime();
  const q11 = query(collection(db, 'scanned_items'), where('timestamp', '>=', startMs11), where('timestamp', '<=', endMs11));
  const s11 = await getDocs(q11);
  console.log('Docs on 11 Sep 2026 with timestamp ms:', s11.size);
  if (s11.size > 0) {
    const roles11 = {};
    s11.docs.forEach(d => {
      const r = d.data().role;
      roles11[r] = (roles11[r] || 0) + 1;
    });
    console.log('11 Sep 2026 Roles breakdown:', roles11);
    console.log('Sample doc from 11 Sep 2026:', s11.docs[0].id, s11.docs[0].data());
  }

  // Test 5: Check 12, 13, 14, 15, 16, 17 Sep in Firestore
  console.log('\n--- Day by day count in Firestore from 07 to 20 Sep 2026: ---');
  for (let day = 7; day <= 20; day++) {
    const dStr = `2026-09-${String(day).padStart(2, '0')}`;
    const sMs = new Date(`${dStr}T00:00:00+07:00`).getTime();
    const eMs = new Date(`${dStr}T23:59:59.999+07:00`).getTime();
    const qDay = query(collection(db, 'scanned_items'), where('timestamp', '>=', sMs), where('timestamp', '<=', eMs));
    const sDay = await getDocs(qDay);
    console.log(`Firestore ${dStr}: ${sDay.size} docs`);
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
