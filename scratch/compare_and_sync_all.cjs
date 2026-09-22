const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supaFile = fs.readFileSync('services/supabaseClient.ts', 'utf8');
const urlMatch = supaFile.match(/FALLBACK_URL\s*=\s*'([^']+)'/);
const keyMatch = supaFile.match(/FALLBACK_KEY\s*=\s*'([^']+)'/);
const newUrlMatch = supaFile.match(/DEFAULT_NEW_URL\s*=\s*'([^']+)'/);
const newKeyMatch = supaFile.match(/DEFAULT_NEW_KEY\s*=\s*'([^']+)'/);

async function checkAndBidirectionalSync() {
  const cPrimary = createClient(urlMatch[1], keyMatch[1]);
  const cBackup = createClient(newUrlMatch[1], newKeyMatch[1]);

  const targetBarcodes = [
    'KILAT 2.50 ZAHRA 22.PDF',
    'TK CAMPUR 51.50 HELEN 22.PDF',
    'SP CAMPUR 66.50 ZAHRA 22.PDF'
  ];

  console.log('--- 1. Checking the 3 target barcodes in Primary & Backup ---');
  for (const b of targetBarcodes) {
    const { data: pData } = await cPrimary.from('leader_scan_2').select('*').eq('barcode', b);
    const { data: bData } = await cBackup.from('leader_scan_2').select('*').eq('barcode', b);
    console.log(`Barcode: "${b}"`);
    console.log(`  - Primary (${pData?.length} rows):`, pData);
    console.log(`  - Backup  (${bData?.length} rows):`, bData);
  }

  console.log('\n--- 2. Fetching all records from Primary & Backup for today and recent dates ---');
  // Let's fetch all rows from today (22/9/2026) or timestamp >= 00:00:00 2026-09-22
  const startTs = new Date('2026-09-22T00:00:00').getTime();
  const endTs = new Date('2026-09-22T23:59:59.999').getTime();

  // Helper to fetch all with pagination
  async function fetchAllToday(client, dbName) {
    let all = [];
    let page = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await client
        .from('leader_scan_2')
        .select('*')
        .gte('timestamp', startTs)
        .lte('timestamp', endTs)
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) {
        console.error(`Error fetching from ${dbName}:`, error);
        break;
      }
      if (!data || data.length === 0) break;
      all = all.concat(data);
      if (data.length < pageSize) break;
      page++;
    }
    return all;
  }

  const primaryToday = await fetchAllToday(cPrimary, 'Primary');
  const backupToday = await fetchAllToday(cBackup, 'Backup');

  console.log(`Primary DB Today Count: ${primaryToday.length}`);
  console.log(`Backup DB Today Count:  ${backupToday.length}`);

  const primaryMap = new Map(primaryToday.map(r => [r.barcode?.trim(), r]));
  const backupMap = new Map(backupToday.map(r => [r.barcode?.trim(), r]));

  // In Primary but missing in Backup
  const missingInBackup = primaryToday.filter(r => !backupMap.has(r.barcode?.trim()));
  // In Backup but missing in Primary
  const missingInPrimary = backupToday.filter(r => !primaryMap.has(r.barcode?.trim()));

  console.log(`Missing in Backup DB (${missingInBackup.length}):`, missingInBackup.map(r => r.barcode));
  console.log(`Missing in Primary DB (${missingInPrimary.length}):`, missingInPrimary.map(r => r.barcode));

  // Sync missingInPrimary to Primary
  if (missingInPrimary.length > 0) {
    console.log('\n--- 3. Syncing missing rows from Backup -> Primary ---');
    const { data: upsertP, error: errP } = await cPrimary
      .from('leader_scan_2')
      .upsert(missingInPrimary, { onConflict: 'barcode' });
    console.log('Upsert to Primary result:', upsertP, errP);
  }

  // Sync missingInBackup to Backup
  if (missingInBackup.length > 0) {
    console.log('\n--- 4. Syncing missing rows from Primary -> Backup ---');
    const { data: upsertB, error: errB } = await cBackup
      .from('leader_scan_2')
      .upsert(missingInBackup, { onConflict: 'barcode' });
    console.log('Upsert to Backup result:', upsertB, errB);
  }

  console.log('\n--- 5. Verification after sync ---');
  for (const b of targetBarcodes) {
    const { data: pData } = await cPrimary.from('leader_scan_2').select('*').eq('barcode', b);
    const { data: bData } = await cBackup.from('leader_scan_2').select('*').eq('barcode', b);
    console.log(`Barcode: "${b}"`);
    console.log(`  - Primary now:`, pData?.length ? 'EXISTS (OK)' : 'MISSING');
    console.log(`  - Backup now: `, bData?.length ? 'EXISTS (OK)' : 'MISSING');
  }

  const primaryFinal = await fetchAllToday(cPrimary, 'Primary');
  const backupFinal = await fetchAllToday(cBackup, 'Backup');
  console.log(`\nFinal Primary DB Today Count: ${primaryFinal.length}`);
  console.log(`Final Backup DB Today Count:  ${backupFinal.length}`);
}

checkAndBidirectionalSync();
