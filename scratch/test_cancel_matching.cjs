const { createClient } = require('@supabase/supabase-js');
const url = 'https://nufvlqrtpzfiqghsxsze.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y';
const supabase = createClient(url, key);

async function testMatching() {
  const d23Start = new Date('2026-09-23T00:00:00').getTime();
  const d23End = new Date('2026-09-23T23:59:59.999').getTime();

  // 1. Fetch Picker on 23 Sep
  const { data: picker23, error: e1 } = await supabase.from('scanned_items')
    .select('barcode, role, employee_name')
    .in('role', ['PICKER', 'Picker', 'PICKER_2'])
    .gte('timestamp', d23Start)
    .lte('timestamp', d23End);

  // 2. Fetch Ojol on 23 Sep
  const { data: ojol23, error: e2 } = await supabase.from('scanned_items')
    .select('barcode, role, employee_name')
    .in('role', ['OJOL', 'Ojol'])
    .gte('timestamp', d23Start)
    .lte('timestamp', d23End);

  // 3. Fetch Logistik on 23 Sep
  const { data: logistik23, error: e3 } = await supabase.from('scanned_items')
    .select('barcode, role, employee_name')
    .in('role', ['LOGISTIK', 'Logistik'])
    .gte('timestamp', d23Start)
    .lte('timestamp', d23End);

  console.log('23 Sep counts - Picker:', picker23?.length, 'Ojol:', ojol23?.length, 'Logistik:', logistik23?.length);

  // Fetch all active cancels in chunks
  let allCancels = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.from('cancelled_orders').select('barcode').eq('is_active', true).range(offset, offset + 999);
    if (error || !data || data.length === 0) break;
    allCancels.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log('Total active cancel barcodes fetched:', allCancels.length);

  const cancelSet = new Set(allCancels.map(c => (c.barcode || '').trim().toUpperCase()));

  const matchedPicker = (picker23 || []).filter(p => cancelSet.has((p.barcode || '').trim().toUpperCase()));
  const matchedOjol = (ojol23 || []).filter(p => cancelSet.has((p.barcode || '').trim().toUpperCase()));
  const matchedLogistik = (logistik23 || []).filter(p => cancelSet.has((p.barcode || '').trim().toUpperCase()));

  console.log('23 Sep Matched Cancel - Picker:', matchedPicker.length, 'Ojol:', matchedOjol.length, 'Logistik:', matchedLogistik.length);
  if (matchedPicker.length > 0) console.log('Sample matched Picker:', matchedPicker.slice(0, 3));
  if (matchedOjol.length > 0) console.log('Sample matched Ojol:', matchedOjol.slice(0, 3));
  if (matchedLogistik.length > 0) console.log('Sample matched Logistik:', matchedLogistik.slice(0, 3));
}

testMatching().catch(console.error);
