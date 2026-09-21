const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nufvlqrtpzfiqghsxsze.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y'
);

async function run() {
  const start = new Date('2026-09-21T00:00:00').getTime();
  const end = new Date('2026-09-21T23:59:59.999').getTime();

  // Test old fetch without deterministic tie breaker
  const oldPickerData = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from('scanned_items')
      .select('id, barcode')
      .in('role', ['PICKER', 'Picker', 'PICKER_2'])
      .gte('timestamp', start)
      .lte('timestamp', end)
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    oldPickerData.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log(`OLD Picker fetch: ${oldPickerData.length} records, unique IDs: ${new Set(oldPickerData.map(x=>x.id)).size}`);
  console.log(`Found 006912414671 in OLD fetch?`, oldPickerData.find(x => x.barcode === '006912414671'));

  // Test NEW fetch with deterministic tie breaker
  const newPickerData = [];
  offset = 0;
  while (true) {
    const { data } = await supabase
      .from('scanned_items')
      .select('id, barcode')
      .in('role', ['PICKER', 'Picker', 'PICKER_2'])
      .gte('timestamp', start)
      .lte('timestamp', end)
      .order('timestamp', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    newPickerData.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log(`NEW Picker fetch: ${newPickerData.length} records, unique IDs: ${new Set(newPickerData.map(x=>x.id)).size}`);
  console.log(`Found 006912414671 in NEW fetch?`, newPickerData.find(x => x.barcode === '006912414671'));
}

run();
