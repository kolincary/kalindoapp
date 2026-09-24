const { createClient } = require('@supabase/supabase-js');
const url = 'https://nufvlqrtpzfiqghsxsze.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y';
const supabase = createClient(url, key);

async function test() {
  const d23Start = new Date('2026-09-23T00:00:00').getTime();
  const d23End = new Date('2026-09-23T23:59:59.999').getTime();

  // All picker on 23 Sep
  let allPicker = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase.from('scanned_items')
      .select('barcode, employee_name, role, timestamp')
      .in('role', ['PICKER', 'Picker', 'PICKER_2', 'OJOL', 'Ojol'])
      .gte('timestamp', d23Start)
      .lte('timestamp', d23End)
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allPicker.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log('Total Picker/Ojol on 23 Sep:', allPicker.length);

  // All logistik on 23 Sep
  let allLogistik = [];
  offset = 0;
  while (true) {
    const { data } = await supabase.from('scanned_items')
      .select('barcode, employee_name, role, timestamp')
      .in('role', ['LOGISTIK', 'Logistik'])
      .gte('timestamp', d23Start)
      .lte('timestamp', d23End)
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allLogistik.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log('Total Logistik on 23 Sep:', allLogistik.length);

  // All active cancel
  let allCancels = [];
  offset = 0;
  while (true) {
    const { data } = await supabase.from('cancelled_orders').select('barcode, cancelled_at').eq('is_active', true).range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allCancels.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log('Total active cancel rows in DB:', allCancels.length);

  // Gudang cancel on 23 Sep
  const { data: gudangCancel } = await supabase.from('scanned_items')
    .select('barcode, employee_name, timestamp')
    .gte('timestamp', d23Start)
    .lte('timestamp', d23End)
    .ilike('menu_context', '%cancel%');
  console.log('Gudang cancel scans on 23 Sep:', gudangCancel?.length);

  const cancelSet = new Set(allCancels.map(c => (c.barcode || '').trim().toUpperCase()));
  if (gudangCancel) {
    gudangCancel.forEach(g => {
      if (g.barcode) cancelSet.add(g.barcode.trim().toUpperCase());
    });
  }

  const matchesPicker = allPicker.filter(p => {
    let b = (p.barcode || '').trim().toUpperCase();
    if (b.startsWith('0026')) b = b.slice(2);
    return cancelSet.has(b) || cancelSet.has((p.barcode || '').trim().toUpperCase());
  });

  const matchesLogistik = allLogistik.filter(l => {
    let b = (l.barcode || '').trim().toUpperCase();
    if (b.startsWith('0026')) b = b.slice(2);
    return cancelSet.has(b) || cancelSet.has((l.barcode || '').trim().toUpperCase());
  });

  console.log('Matched Picker/Ojol Cancel on 23 Sep:', matchesPicker.length);
  console.log('Matched Logistik Cancel on 23 Sep:', matchesLogistik.length);
  matchesLogistik.forEach((m, i) => {
    console.log(`${i+1}. Barcode: ${m.barcode}`);
  });
}

test().catch(console.error);
