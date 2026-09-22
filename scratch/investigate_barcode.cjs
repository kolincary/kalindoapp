const { createClient } = require('@supabase/supabase-js');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, getDoc } = require('firebase/firestore');

const supabase = createClient(
  'https://nufvlqrtpzfiqghsxsze.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y'
);

const firebaseConfig = {
  apiKey: "AIzaSyCyt5XTwrSIK0aWlZXkUw4wdaMrMZsfbP4",
  authDomain: "pro-pulsar-476713-s9.firebaseapp.com",
  projectId: "pro-pulsar-476713-s9",
  storageBucket: "pro-pulsar-476713-s9.firebasestorage.app",
  messagingSenderId: "1087859743191",
  appId: "1:1087859743191:web:aec1c24af3ad0b40d61392"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "project-ks");

const TARGET_BARCODE = 'SPXID067603215979';

async function investigate() {
  console.log(`=== DEEP INVESTIGATION FOR BARCODE: ${TARGET_BARCODE} ===\n`);

  // 1. Supabase scanned_items
  console.log('--- 1. Supabase scanned_items ---');
  const { data: sbScans, error: sbErr } = await supabase
    .from('scanned_items')
    .select('*')
    .eq('barcode', TARGET_BARCODE);
  console.log('Found in Supabase scanned_items:', sbScans?.length || 0, sbErr || '');
  if (sbScans && sbScans.length > 0) {
    console.table(sbScans.map(s => ({
      id: s.id,
      role: s.role,
      employee_name: s.employee_name,
      user_email: s.user_email,
      timestamp: s.timestamp,
      date: s.date,
      description: s.description,
      barcode: s.barcode,
      order_id: s.order_id
    })));
  }

  // 2. Supabase batch_items
  console.log('\n--- 2. Supabase batch_items ---');
  const { data: sbBatchItems, error: biErr } = await supabase
    .from('batch_items')
    .select('*')
    .eq('barcode', TARGET_BARCODE);
  console.log('Found in Supabase batch_items:', sbBatchItems?.length || 0, biErr || '');
  if (sbBatchItems && sbBatchItems.length > 0) {
    console.log(sbBatchItems);
    for (const item of sbBatchItems) {
      if (item.batch_id) {
        const { data: bData } = await supabase
          .from('batches')
          .select('*')
          .eq('id', item.batch_id);
        console.log('Associated batch header:', bData);
      }
    }
  }

  // 3. Supabase batches by batch_no
  console.log('\n--- 3. Supabase batches (BTCH-20260922-2719) ---');
  const { data: batchesFound } = await supabase
    .from('batches')
    .select('*')
    .ilike('batch_no', '%2719%');
  console.log('Batches matching 2719:', batchesFound);

  // 4. Firestore admin_batch_imports
  console.log('\n--- 4. Firestore admin_batch_imports ---');
  const qFs = query(collection(db, 'admin_batch_imports'), where('barcodes', 'array-contains', TARGET_BARCODE));
  const snapFs = await getDocs(qFs);
  console.log('Found in admin_batch_imports docs:', snapFs.size);
  let batchDocData = null;
  snapFs.forEach(docSnap => {
    const data = docSnap.data();
    batchDocData = data;
    console.log('Doc ID:', docSnap.id);
    console.log('Filename:', data.excelFilename);
    console.log('Batch ID:', data.batchId);
    console.log('Staff Name:', data.staffName);
    console.log('Jumlah:', data.jumlah);
    console.log('Timestamp:', data.timestamp);
    console.log('Total barcodes in doc:', data.barcodes?.length);
  });

  // 5. Firestore scanned_items
  console.log('\n--- 5. Firestore scanned_items ---');
  const qFsScans = query(collection(db, 'scanned_items'), where('barcode', '==', TARGET_BARCODE));
  const snapFsScans = await getDocs(qFsScans);
  console.log('Found in Firestore scanned_items docs:', snapFsScans.size);
  snapFsScans.forEach(docSnap => {
    console.log('FS Scan:', docSnap.id, docSnap.data());
  });

  // 6. Check other barcodes in the same batch from admin_batch_imports
  if (batchDocData && batchDocData.barcodes) {
    console.log(`\n--- 6. Analyzing ALL ${batchDocData.barcodes.length} barcodes in batch ${batchDocData.batchId} (${batchDocData.excelFilename}) ---`);
    const allBc = batchDocData.barcodes;
    
    // Check how many are in Supabase scanned_items
    const { data: allScans } = await supabase
      .from('scanned_items')
      .select('id, barcode, role, employee_name, description, timestamp')
      .in('barcode', allBc);
    
    console.log(`Total scans found in Supabase for this batch's barcodes: ${allScans?.length || 0}`);
    
    // Group scans by role & employee_name
    const roleStaffMap = {};
    const scannedBarcodeSet = new Set();
    (allScans || []).forEach(s => {
      const key = `${s.role} - ${s.employee_name} (${s.description || 'NORMAL'})`;
      roleStaffMap[key] = (roleStaffMap[key] || 0) + 1;
      scannedBarcodeSet.add(s.barcode);
    });
    console.log('Scan breakdown by role/employee in this batch:', roleStaffMap);
    
    const unscanned = allBc.filter(b => !scannedBarcodeSet.has(b));
    console.log(`Barcodes in this batch not scanned by anyone: ${unscanned.length}`);
    console.log('Sample unscanned barcodes:', unscanned.slice(0, 5));

    // Check how many are still in batch_items
    const { data: inBatchItems } = await supabase
      .from('batch_items')
      .select('id, barcode, batch_id')
      .in('barcode', allBc);
    console.log(`Barcodes still in batch_items table: ${inBatchItems?.length || 0}`);

    // Check DIKA scans today
    console.log('\n--- 7. Check DIKA scans on 2026-09-22 ---');
    const { data: dikaScans } = await supabase
      .from('scanned_items')
      .select('id, barcode, role, employee_name, description, timestamp')
      .ilike('employee_name', '%DIKA%')
      .gte('timestamp', '2026-09-22T00:00:00')
      .lte('timestamp', '2026-09-22T23:59:59');
    console.log(`Total scans by DIKA today: ${dikaScans?.length || 0}`);
    const dikaRoles = {};
    (dikaScans || []).forEach(s => {
      dikaRoles[s.role] = (dikaRoles[s.role] || 0) + 1;
    });
    console.log('DIKA scan roles breakdown:', dikaRoles);

    // Check if DIKA scanned any barcode from this batch
    const dikaBatchScans = (dikaScans || []).filter(s => allBc.includes(s.barcode));
    console.log(`Number of barcodes from this batch scanned by DIKA: ${dikaBatchScans.length}`);
    if (dikaBatchScans.length > 0) {
      console.log('Sample DIKA scans from this batch:', dikaBatchScans.slice(0, 5));
    }
  }

  process.exit(0);
}

investigate().catch(e => {
  console.error(e);
  process.exit(1);
});
