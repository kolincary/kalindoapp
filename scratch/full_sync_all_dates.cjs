const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supaFile = fs.readFileSync('services/supabaseClient.ts', 'utf8');
const urlMatch = supaFile.match(/FALLBACK_URL\s*=\s*'([^']+)'/);
const keyMatch = supaFile.match(/FALLBACK_KEY\s*=\s*'([^']+)'/);
const newUrlMatch = supaFile.match(/DEFAULT_NEW_URL\s*=\s*'([^']+)'/);
const newKeyMatch = supaFile.match(/DEFAULT_NEW_KEY\s*=\s*'([^']+)'/);

async function fullSyncAllDates() {
  const cPrimary = createClient(urlMatch[1], keyMatch[1]);
  const cBackup = createClient(newUrlMatch[1], newKeyMatch[1]);

  console.log('--- Fetching all rows from Primary leader_scan_2 ---');
  let primaryAll = [];
  let page = 0;
  while (true) {
    const { data, error } = await cPrimary
      .from('leader_scan_2')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    primaryAll = primaryAll.concat(data);
    if (data.length < 1000) break;
    page++;
  }
  console.log(`Total rows in Primary: ${primaryAll.length}`);

  console.log('--- Fetching all rows from Backup leader_scan_2 ---');
  let backupAll = [];
  page = 0;
  while (true) {
    const { data, error } = await cBackup
      .from('leader_scan_2')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    backupAll = backupAll.concat(data);
    if (data.length < 1000) break;
    page++;
  }
  console.log(`Total rows in Backup: ${backupAll.length}`);

  const primaryMap = new Map();
  for (const r of primaryAll) {
    const b = r.barcode?.trim();
    if (b) {
      const existing = primaryMap.get(b);
      if (!existing || (r.timestamp || 0) > (existing.timestamp || 0)) {
        primaryMap.set(b, r);
      }
    }
  }

  const backupMap = new Map();
  for (const r of backupAll) {
    const b = r.barcode?.trim();
    if (b) {
      const existing = backupMap.get(b);
      if (!existing || (r.timestamp || 0) > (existing.timestamp || 0)) {
        backupMap.set(b, r);
      }
    }
  }

  const toSyncToPrimary = [];
  const toSyncToBackup = [];

  // Check rows in backup that are missing or newer than in primary
  for (const [barcode, bRow] of backupMap.entries()) {
    const pRow = primaryMap.get(barcode);
    if (!pRow || (bRow.timestamp || 0) > (pRow.timestamp || 0)) {
      toSyncToPrimary.push(bRow);
    }
  }

  // Check rows in primary that are missing or newer than in backup
  for (const [barcode, pRow] of primaryMap.entries()) {
    const bRow = backupMap.get(barcode);
    if (!bRow || (pRow.timestamp || 0) > (bRow.timestamp || 0)) {
      toSyncToBackup.push(pRow);
    }
  }

  console.log(`Rows to sync from Backup -> Primary: ${toSyncToPrimary.length}`);
  console.log(`Rows to sync from Primary -> Backup: ${toSyncToBackup.length}`);

  // Batch upsert to Primary
  const BATCH_SIZE = 100;
  for (let i = 0; i < toSyncToPrimary.length; i += BATCH_SIZE) {
    const batch = toSyncToPrimary.slice(i, i + BATCH_SIZE);
    const { error } = await cPrimary.from('leader_scan_2').upsert(batch, { onConflict: 'barcode' });
    if (error) console.error('Error batch upsert to primary:', error);
  }

  // Batch upsert to Backup
  for (let i = 0; i < toSyncToBackup.length; i += BATCH_SIZE) {
    const batch = toSyncToBackup.slice(i, i + BATCH_SIZE);
    const { error } = await cBackup.from('leader_scan_2').upsert(batch, { onConflict: 'barcode' });
    if (error) console.error('Error batch upsert to backup:', error);
  }

  console.log('--- ALL DATES SYNC COMPLETE ---');
}

fullSyncAllDates();
