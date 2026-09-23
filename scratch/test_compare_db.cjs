const { createClient } = require('@supabase/supabase-js');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, getCountFromServer } = require('firebase/firestore');

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

const supabase = createClient(
  'https://nufvlqrtpzfiqghsxsze.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y'
);

async function checkDate(dateStr) {
  console.log(`\n================ Checking Date: ${dateStr} ================`);
  const startMs = new Date(`${dateStr}T00:00:00`).getTime();
  const endMs = new Date(`${dateStr}T23:59:59.999`).getTime();

  // 1. Supabase Check
  console.log(`[1] Supabase check (timestamp between ${startMs} and ${endMs}):`);
  const { data: sbData, error: sbErr, count: sbCount } = await supabase
    .from('scanned_items')
    .select('role', { count: 'exact' })
    .gte('timestamp', startMs)
    .lte('timestamp', endMs);

  if (sbErr) console.error("Supabase error:", sbErr);
  else {
    console.log(`Total Supabase records: ${sbCount}`);
    const sbRoles = {};
    (sbData || []).forEach(r => {
      sbRoles[r.role] = (sbRoles[r.role] || 0) + 1;
    });
    console.log("Supabase roles breakdown:", sbRoles);
  }

  // 2. Firestore Check
  console.log(`\n[2] Firestore check in 'scanned_items':`);
  try {
    const q = query(
      collection(db, 'scanned_items'),
      where('timestamp', '>=', startMs),
      where('timestamp', '<=', endMs)
    );
    const snap = await getDocs(q);
    console.log(`Total Firestore docs: ${snap.docs.length}`);
    const fsRoles = {};
    const sampleDocs = [];
    snap.docs.forEach((doc, idx) => {
      const d = doc.data();
      const r = (d.role || 'UNKNOWN').toUpperCase();
      fsRoles[r] = (fsRoles[r] || 0) + 1;
      if (idx < 3) sampleDocs.push({ id: doc.id, barcode: d.barcode, role: d.role, timestamp: d.timestamp, date: d.timestamp ? new Date(d.timestamp).toISOString() : null });
    });
    console.log("Firestore roles breakdown:", fsRoles);
    console.log("Sample Firestore docs:", sampleDocs);
  } catch (fsErr) {
    console.error("Firestore error:", fsErr);
  }
}

async function main() {
  await checkDate('2026-09-11');
  await checkDate('2026-09-12');
}

main().catch(console.error);
