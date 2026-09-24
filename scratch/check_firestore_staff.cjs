const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit, orderBy, getCountFromServer } = require('firebase/firestore');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const apiKey = env.match(/VITE_FIREBASE_API_KEY=(.*)/)?.[1]?.trim();
const projectId = env.match(/VITE_FIREBASE_PROJECT_ID=(.*)/)?.[1]?.trim();
const databaseId = env.match(/VITE_FIREBASE_DATABASE_ID=(.*)/)?.[1]?.trim() || 'project-ks';
const app = initializeApp({ apiKey, projectId });
const db = getFirestore(app, databaseId);

async function run() {
  console.log('--- Checking Firestore scanned_items total count & samples ---');
  try {
    const coll = collection(db, 'scanned_items');
    const countSnap = await getCountFromServer(coll);
    console.log('Total documents in Firestore scanned_items:', countSnap.data().count);
  } catch (e) {
    console.log('getCountFromServer error:', e.message);
  }

  // Let's check where the user's sample document comes from
  // "HANDI PERMANA", "SOPANDI", "NJVTT06257979908"
  // Let's check how many documents have created_at as a number (double/Excel serial)!
  const qExcel = query(collection(db, 'scanned_items'), where('created_at', '>=', 40000), where('created_at', '<=', 50000), limit(10));
  try {
    const snapExcel = await getDocs(qExcel);
    console.log('Docs with created_at as Excel serial number (>= 40000):', snapExcel.size);
    if (snapExcel.size > 0) {
      console.log('Sample Excel serial doc:', snapExcel.docs[0].id, snapExcel.docs[0].data());
    }
  } catch (e) {
    console.log('Error querying created_at >= 40000:', e.message);
  }

  // Let's check if there are documents around 16 September with created_at as Excel serial!
  // In Excel:
  // 2026-09-16:
  // Date('2026-09-16') - Date('1899-12-30') / 86400000 = 46281!
  console.log('\nChecking Excel serial for September 16, 2026 (46281.x)...');
  const qSep16Excel = query(
    collection(db, 'scanned_items'),
    where('created_at', '>=', 46281),
    where('created_at', '<', 46282)
  );
  try {
    const snapSep16 = await getDocs(qSep16Excel);
    console.log('Docs with created_at in 46281 (16 Sep 2026):', snapSep16.size);
    if (snapSep16.size > 0) {
      console.log('Sample doc in 46281:', snapSep16.docs[0].id, snapSep16.docs[0].data());
    }
  } catch (e) {
    console.log('Error querying created_at 46281:', e.message);
  }

  // Also check scan_date for 46281
  const qScanDateSep16 = query(
    collection(db, 'scanned_items'),
    where('scan_date', '>=', 46281),
    where('scan_date', '<', 46282)
  );
  try {
    const snapScanDateSep16 = await getDocs(qScanDateSep16);
    console.log('Docs with scan_date in 46281 (16 Sep 2026):', snapScanDateSep16.size);
    if (snapScanDateSep16.size > 0) {
      console.log('Sample doc scan_date 46281:', snapScanDateSep16.docs[0].id, snapScanDateSep16.docs[0].data());
    }
  } catch (e) {
    console.log('Error querying scan_date 46281:', e.message);
  }

  // Let's check employee "LISTI BAITI" or "DAFA CAHYA RAMADHANU" in Firestore!
  // In Supabase screenshot 2, the staff on 16 Sep 2026 are:
  // "LISTI BAITI", "DAFA CAHYA RAMADHANU"
  console.log('\nChecking if LISTI BAITI or DAFA CAHYA RAMADHANU exist in Firestore:');
  const qStaff1 = query(collection(db, 'scanned_items'), where('employee_name', '==', 'LISTI BAITI'), limit(5));
  const snapStaff1 = await getDocs(qStaff1);
  console.log('LISTI BAITI docs in Firestore:', snapStaff1.size);
  snapStaff1.docs.forEach(d => console.log('LISTI BAITI doc:', d.id, d.data().barcode, d.data().role, d.data().created_at, d.data().timestamp, new Date(d.data().timestamp)));

  const qStaff2 = query(collection(db, 'scanned_items'), where('employee_name', '==', 'DAFA CAHYA RAMADHANU'), limit(5));
  const snapStaff2 = await getDocs(qStaff2);
  console.log('DAFA CAHYA RAMADHANU docs in Firestore:', snapStaff2.size);
  snapStaff2.docs.forEach(d => console.log('DAFA doc:', d.id, d.data().barcode, d.data().role, d.data().created_at, d.data().timestamp, new Date(d.data().timestamp)));
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
