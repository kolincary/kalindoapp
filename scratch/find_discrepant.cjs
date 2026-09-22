const { createClient } = require('@supabase/supabase-js');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

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

async function findDiscrepantBarcodes() {
  console.log('=== FINDING ALL BARCODES IN ADMIN_BATCH_IMPORTS TODAY (2026-09-22) ===');
  const q = query(
    collection(db, 'admin_batch_imports'),
    where('timestamp', '>=', '2026-09-22T00:00:00'),
    where('timestamp', '<=', '2026-09-22T23:59:59.999')
  );
  const snap = await getDocs(q);
  console.log(`Found ${snap.size} batch import documents today in Firestore.`);

  let allImportedBarcodes = [];
  const batchMap = {};
  snap.forEach(d => {
    const data = d.data();
    (data.barcodes || []).forEach(b => {
      allImportedBarcodes.push(b);
      batchMap[b] = { batchId: data.batchId, filename: data.excelFilename, staff: data.staffName };
    });
  });

  console.log(`Total barcodes in these batches: ${allImportedBarcodes.length}`);

  // Fetch all scans for these barcodes from Supabase
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

  console.log(`Total scan records found in Supabase: ${allScans.length}`);

  // Group scans by barcode
  const barcodeToScans = {};
  allImportedBarcodes.forEach(b => barcodeToScans[b] = []);
  allScans.forEach(s => {
    if (barcodeToScans[s.barcode]) {
      barcodeToScans[s.barcode].push(s);
    }
  });

  // Find barcodes that have LOGISTIK scan but NO PICKER scan
  const onlyLogistikNoPicker = [];
  const noScansAtAll = [];
  const hasPickerAndLogistik = [];
  const hasPickerOnly = [];

  for (const b of allImportedBarcodes) {
    const scans = barcodeToScans[b] || [];
    const hasPicker = scans.some(s => s.role === 'PICKER' || s.role === 'PICKER_2');
    const hasLogistik = scans.some(s => s.role === 'LOGISTIK' || s.role === 'Logistik');

    if (!hasPicker && hasLogistik) {
      onlyLogistikNoPicker.push({
        barcode: b,
        batch: batchMap[b],
        logistikScan: scans.find(s => s.role === 'LOGISTIK' || s.role === 'Logistik')
      });
    } else if (!hasPicker && !hasLogistik && scans.length === 0) {
      noScansAtAll.push(b);
    } else if (hasPicker && hasLogistik) {
      hasPickerAndLogistik.push(b);
    } else if (hasPicker && !hasLogistik) {
      hasPickerOnly.push(b);
    }
  }

  console.log('\n=== SUMMARY OF BATCH BARCODES TODAY ===');
  console.log(`- Has PICKER & LOGISTIK: ${hasPickerAndLogistik.length}`);
  console.log(`- Has PICKER only (not yet Logistik): ${hasPickerOnly.length}`);
  console.log(`- Only LOGISTIK (NO PICKER scan!): ${onlyLogistikNoPicker.length}`);
  console.log(`- No scans at all: ${noScansAtAll.length}`);

  if (onlyLogistikNoPicker.length > 0) {
    console.log('\n=== DETAILS OF BARCODES WITH LOGISTIK ONLY (NO PICKER) ===');
    console.table(onlyLogistikNoPicker.map(item => ({
      barcode: item.barcode,
      batchFilename: item.batch.filename,
      batchStaff: item.batch.staff,
      logistikEmployee: item.logistikScan.employee_name,
      logistikTime: new Date(Number(item.logistikScan.timestamp) || item.logistikScan.timestamp).toLocaleTimeString()
    })));
  }

  process.exit(0);
}

findDiscrepantBarcodes().catch(e => {
  console.error(e);
  process.exit(1);
});
