const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supaFile = fs.readFileSync('services/supabaseClient.ts', 'utf8');
const urlMatch = supaFile.match(/FALLBACK_URL\s*=\s*'([^']+)'/);
const keyMatch = supaFile.match(/FALLBACK_KEY\s*=\s*'([^']+)'/);
const newUrlMatch = supaFile.match(/DEFAULT_NEW_URL\s*=\s*'([^']+)'/);
const newKeyMatch = supaFile.match(/DEFAULT_NEW_KEY\s*=\s*'([^']+)'/);

async function checkAndSync() {
  const cPrimary = createClient(urlMatch[1], keyMatch[1]);
  const cBackup = createClient(newUrlMatch[1], newKeyMatch[1]);

  console.log('1. Checking TK HOME in Primary DB...');
  const { data: primaryRow, error: pErr } = await cPrimary
    .from('leader_scan_2')
    .select('*')
    .eq('barcode', 'TK HOME 3.49 NOPIYA 22.PDF');
  console.log('Primary row:', primaryRow, pErr);

  console.log('2. Checking TK HOME in Backup DB (supabaseNew)...');
  const { data: backupRow, error: bErr } = await cBackup
    .from('leader_scan_2')
    .select('*')
    .eq('barcode', 'TK HOME 3.49 NOPIYA 22.PDF');
  console.log('Backup row:', backupRow, bErr);

  if (primaryRow && primaryRow.length > 0) {
    console.log('3. Syncing row to Backup DB...');
    const { data: upsertData, error: uErr } = await cBackup
      .from('leader_scan_2')
      .upsert(primaryRow, { onConflict: 'barcode' });
    console.log('Sync result:', upsertData, uErr);

    // Verify
    const { data: verifyRow } = await cBackup
      .from('leader_scan_2')
      .select('*')
      .eq('barcode', 'TK HOME 3.49 NOPIYA 22.PDF');
    console.log('Verified row in Backup DB:', verifyRow);
  }

  // Also check if there are any other rows from today missing in Backup DB
  const startTs = new Date('2026-09-22T00:00:00').getTime();
  const endTs = new Date('2026-09-22T23:59:59.999').getTime();
  const { data: todayPrimary } = await cPrimary
    .from('leader_scan_2')
    .select('*')
    .gte('timestamp', startTs)
    .lte('timestamp', endTs);

  console.log(`\nTotal rows today in Primary DB: ${todayPrimary?.length || 0}`);
  if (todayPrimary && todayPrimary.length > 0) {
    console.log('Syncing all today rows to Backup DB...');
    const { error: syncAllErr } = await cBackup
      .from('leader_scan_2')
      .upsert(todayPrimary, { onConflict: 'barcode' });
    console.log('Sync all today rows result error:', syncAllErr);
  }
}

checkAndSync();
