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

async function checkThe4Barcodes() {
  const docRef = doc(db, 'admin_batch_imports', 'oegASh4U5haIO6veEUL4');
  const snap = await getDoc(docRef);
  const data = snap.data();
  const all50 = data.barcodes;

  const { data: scans46 } = await supabase
    .from('scanned_items')
    .select('barcode')
    .ilike('excel_filename', '%SP CAMPUR 24.50 NOPIYA 22%');

  const scannedSet = new Set(scans46.map(s => s.barcode));
  const missing4 = all50.filter(b => !scannedSet.has(b));
  console.log('The 4 barcodes in this batch that are not in the 46 auto-batch scans:', missing4);

  // For each of the 4 missing barcodes, get ALL rows from scanned_items
  for (const b of missing4) {
    const { data: bScans } = await supabase
      .from('scanned_items')
      .select('*')
      .eq('barcode', b);

    console.log(`\n=== Barcode: ${b} ===`);
    console.log(`Index in batch 50 list: ${all50.indexOf(b)}`);
    console.table(bScans.map(s => ({
      id: s.id,
      role: s.role,
      employee_name: s.employee_name,
      description: s.description,
      timestamp: s.timestamp,
      date_iso: new Date(Number(s.timestamp) || s.timestamp).toISOString(),
      excel_filename: s.excel_filename
    })));
  }

  process.exit(0);
}

checkThe4Barcodes().catch(e => {
  console.error(e);
  process.exit(1);
});
