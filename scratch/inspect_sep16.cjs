const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, limit, orderBy } = require('firebase/firestore');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const apiKey = env.match(/VITE_FIREBASE_API_KEY=(.*)/)?.[1]?.trim();
const projectId = env.match(/VITE_FIREBASE_PROJECT_ID=(.*)/)?.[1]?.trim();
const databaseId = env.match(/VITE_FIREBASE_DATABASE_ID=(.*)/)?.[1]?.trim() || 'project-ks';

const app = initializeApp({ apiKey, projectId });
const db = getFirestore(app, databaseId);

const sbUrl = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const sbKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const sb = createClient(sbUrl, sbKey);

async function run() {
  console.log('--- 1. Supabase Check for 2026-09-16 ---');
  // In Supabase, created_at might be timestamptz e.g. 2026-09-16T... or date string
  const { count: sbCount, data: sbSample, error: sbErr } = await sb
    .from('scanned_items')
    .select('id, barcode, role, employee_name, created_at, scan_date', { count: 'exact' })
    .gte('created_at', '2026-09-16T00:00:00+00:00')
    .lte('created_at', '2026-09-16T23:59:59.999+00:00')
    .limit(3);

  console.log('Supabase UTC Count:', sbCount, 'Error:', sbErr);
  if (sbCount === 0 || sbErr) {
    // Try without timezone
    const res = await sb
      .from('scanned_items')
      .select('id, barcode, role, employee_name, created_at, scan_date', { count: 'exact' })
      .gte('created_at', '2026-09-16T00:00:00')
      .lte('created_at', '2026-09-16T23:59:59.999')
      .limit(3);
    console.log('Supabase local count:', res.count, 'Error:', res.error);
    if (res.data) console.log('Supabase sample:', res.data[0]);
  } else {
    console.log('Supabase sample:', sbSample[0]);
  }

  console.log('\n--- 2. Firestore Check with timestamp (ms) ---');
  // Check exact 16 Sep 2026 in timestamp ms
  // Notice in browser local timezone might be UTC+7 (Asia/Jakarta)
  // 2026-09-16 00:00:00 UTC+7 is:
  const startMsJkt = new Date('2026-09-16T00:00:00+07:00').getTime();
  const endMsJkt = new Date('2026-09-16T23:59:59.999+07:00').getTime();
  console.log('Jakarta MS range:', startMsJkt, 'to', endMsJkt);

  const fsQ = query(
    collection(db, 'scanned_items'),
    where('timestamp', '>=', startMsJkt),
    where('timestamp', '<=', endMsJkt)
  );
  const fsSnap = await getDocs(fsQ);
  console.log('Firestore count with Jakarta MS range:', fsSnap.size);

  const roleCounts = {};
  const staffCounts = {};
  fsSnap.docs.forEach(doc => {
    const data = doc.data();
    roleCounts[data.role] = (roleCounts[data.role] || 0) + 1;
    staffCounts[data.employee_name || 'UNASSIGNED'] = (staffCounts[data.employee_name || 'UNASSIGNED'] || 0) + 1;
  });
  console.log('Firestore Role breakdown:', roleCounts);
  console.log('Firestore Staff breakdown:', staffCounts);
  if (fsSnap.docs.length > 0) {
    console.log('First 2 docs:', fsSnap.docs.slice(0, 2).map(d => ({ id: d.id, ...d.data() })));
  }

  console.log('\n--- 3. Check user sample doc with barcode NJVTT06257979908 ---');
  const qResi = query(collection(db, 'scanned_items'), where('barcode', '==', 'NJVTT06257979908'));
  const snapResi = await getDocs(qResi);
  console.log('Firestore resi NJVTT06257979908 count:', snapResi.size);
  snapResi.docs.forEach(d => {
    const data = d.data();
    console.log('Doc id:', d.id);
    console.log('data:', data);
    console.log('timestamp as Date:', new Date(data.timestamp));
    console.log('created_at type:', typeof data.created_at, data.created_at);
    console.log('scan_date type:', typeof data.scan_date, data.scan_date);
  });
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
