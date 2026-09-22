const { createClient } = require('@supabase/supabase-js');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

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

async function checkBatchDetails() {
  const docRef = doc(db, 'admin_batch_imports', 'oegASh4U5haIO6veEUL4');
  const snap = await getDoc(docRef);
  const data = snap.data();
  console.log('Doc data:', data.excelFilename, data.batchId, 'Total barcodes in Firestore:', data.barcodes.length);
  
  const barcodes = data.barcodes;
  console.log('Index of SPXID067603215979 in array:', barcodes.indexOf('SPXID067603215979'));

  // Get all scans for all 50 barcodes from Supabase
  const { data: allScans, error: scErr } = await supabase
    .from('scanned_items')
    .select('*')
    .in('barcode', barcodes);

  if (scErr) console.error('Error fetching scans:', scErr);
  console.log('Total scans for these 50 barcodes:', allScans ? allScans.length : 0);

  // For each barcode, show which roles scanned it
  const barcodeScanMap = {};
  barcodes.forEach(b => barcodeScanMap[b] = []);
  (allScans || []).forEach(s => {
    if (barcodeScanMap[s.barcode]) {
      const tsDate = new Date(Number(s.timestamp) || s.timestamp);
      barcodeScanMap[s.barcode].push(`${s.role} (${s.employee_name}, desc: ${s.description}, ts: ${tsDate.toISOString()})`);
    }
  });

  // Check barcodes that DO NOT have PICKER scan
  const missingPicker = barcodes.filter(b => !barcodeScanMap[b].some(str => str.includes('PICKER')));
  console.log('Barcodes missing PICKER scan:', missingPicker);
  missingPicker.forEach(b => {
    console.log(`- ${b}:`, barcodeScanMap[b]);
  });

  // Also check the 3 trigger scans by DIKA
  const dikaScans = (allScans || []).filter(s => s.employee_name === 'DIKA');
  console.log('DIKA scans count:', dikaScans.length);
  console.log('DIKA camera scans:', dikaScans.filter(s => s.description === 'Camera Scan').map(s => ({ barcode: s.barcode, ts: s.timestamp })));
  console.log('DIKA auto-batch scans count:', dikaScans.filter(s => s.description && s.description.includes('AUTO-BATCH')).length);

  process.exit(0);
}

checkBatchDetails().catch(e => {
  console.error(e);
  process.exit(1);
});
