const { createClient } = require('@supabase/supabase-js');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit, orderBy } = require('firebase/firestore');

const supabase = createClient(
  'https://nufvlqrtpzfiqghsxsze.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y'
);

const firebaseConfig = {
  apiKey: 'AIzaSyCyt5XTwrSIK0aWlZXkUw4wdaMrMZsfbP4',
  authDomain: 'pro-pulsar-476713-s9.firebaseapp.com',
  projectId: 'pro-pulsar-476713-s9',
  storageBucket: 'pro-pulsar-476713-s9.firebasestorage.app',
  messagingSenderId: '1087859743191',
  appId: '1:1087859743191:web:aec1c24af3ad0b40d61392'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'project-ks');

async function findAllDiscrepancies() {
  const snap = await getDocs(query(collection(db, 'admin_batch_imports'), orderBy('timestamp', 'desc'), limit(500)));
  console.log(`Checking latest ${snap.size} batch import docs in Firestore...`);

  let allImportedBarcodes = [];
  const batchMap = {};
  snap.forEach(d => {
    const data = d.data();
    (data.barcodes || []).forEach(b => {
      if (!batchMap[b]) {
        allImportedBarcodes.push(b);
        batchMap[b] = { batchId: data.batchId, filename: data.excelFilename, staff: data.staffName, docId: d.id, timestamp: data.timestamp };
      }
    });
  });

  console.log(`Total unique barcodes in these batches: ${allImportedBarcodes.length}`);

  const CHUNK_SIZE = 500;
  let allScans = [];
  for (let i = 0; i < allImportedBarcodes.length; i += CHUNK_SIZE) {
    const chunk = allImportedBarcodes.slice(i, i + CHUNK_SIZE);
    const { data } = await supabase
      .from('scanned_items')
      .select('barcode, role, employee_name, description, timestamp')
      .in('barcode', chunk);
    if (data) allScans = allScans.concat(data);
  }

  const barcodeToScans = {};
  allImportedBarcodes.forEach(b => barcodeToScans[b] = []);
  allScans.forEach(s => {
    if (barcodeToScans[s.barcode]) {
      barcodeToScans[s.barcode].push(s);
    }
  });

  const onlyLogistikNoPicker = [];
  for (const b of allImportedBarcodes) {
    const scans = barcodeToScans[b] || [];
    const hasPicker = scans.some(s => s.role === 'PICKER' || s.role === 'PICKER_2');
    const hasLogistik = scans.some(s => s.role === 'LOGISTIK' || s.role === 'Logistik');

    if (!hasPicker && hasLogistik) {
      onlyLogistikNoPicker.push({
        barcode: b,
        batch: batchMap[b],
        allRolesFound: scans.map(s => `${s.role} (${s.employee_name})`).join(', ')
      });
    }
  }

  console.log(`\nFound ${onlyLogistikNoPicker.length} barcodes across batches with LOGISTIK scan but NO PICKER scan:`);
  console.table(onlyLogistikNoPicker.slice(0, 20).map(item => ({
    barcode: item.barcode,
    batchFilename: item.batch.filename,
    batchStaff: item.batch.staff,
    batchDate: item.batch.timestamp?.slice(0, 10),
    allRoles: item.allRolesFound
  })));

  process.exit(0);
}

findAllDiscrepancies().catch(e => {
  console.error(e);
  process.exit(1);
});
