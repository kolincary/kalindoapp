const { createClient } = require('@supabase/supabase-js');
const sbUrl = 'https://nufvlqrtpzfiqghsxsze.supabase.co';
const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y';
const supabase = createClient(sbUrl, sbKey);

async function run() {
  const targetDate = '2026-09-21';
  const start = new Date(targetDate + 'T00:00:00').getTime();
  const end = new Date(targetDate + 'T23:59:59.999').getTime();

  const fetchAll = async (roles) => {
    let all = [];
    let offset = 0;
    while (true) {
      const { data, error } = await supabase
        .from('scanned_items')
        .select('id, barcode, employee_name, timestamp, role, menu_context')
        .in('role', roles)
        .gte('timestamp', start)
        .lte('timestamp', end)
        .order('timestamp', { ascending: true })
        .order('id', { ascending: true })
        .range(offset, offset + 999);
      if (error || !data || data.length === 0) break;
      all.push(...data);
      if (data.length < 1000) break;
      offset += 1000;
    }
    return all;
  };

  const [picker, ojol, logistik] = await Promise.all([
    fetchAll(['PICKER', 'Picker', 'PICKER_2']),
    fetchAll(['OJOL', 'Ojol']),
    fetchAll(['LOGISTIK', 'Logistik'])
  ]);

  const isExcludedOrderSn = (barcode) => {
    let b = (barcode || '').toString().trim();
    if (/^00(?:2[6-9]|3\d|40)/.test(b)) b = b.slice(2);
    return /^(?:2[6-9]|3\d|40)/.test(b);
  };
  const isRevanOrRachel = (name) => {
    const n = (name || '').toString().trim().toUpperCase();
    return n.includes('REVAN') || n.includes('RACHEL');
  };

  const filteredPicker = picker.filter(item => !(isRevanOrRachel(item.employee_name) && isExcludedOrderSn(item.barcode)));
  const filteredOjol = ojol.filter(item => !isExcludedOrderSn(item.barcode));
  const combinedPicker = [...filteredPicker, ...filteredOjol];

  const normKey = (s) => (s || '').toString().trim().toUpperCase().replace(/[\s\-_]/g, '');

  const startOfDay = new Date(targetDate + 'T00:00:00').toISOString();
  const endOfDay = new Date(targetDate + 'T23:59:59.999').toISOString();
  const { data: cancelData } = await supabase.from('cancelled_orders').select('barcode').eq('is_active', true).gte('cancelled_at', startOfDay).lte('cancelled_at', endOfDay);
  const cancelSet = new Set((cancelData || []).map(c => normKey(c.barcode)));

  // Gudang & Leader Pending
  const [gPending, lPending] = await Promise.all([
    supabase.from('scanned_items').select('barcode').eq('role', 'GUDANG').or('menu_context.eq.PENDING,status.eq.PENDING'),
    supabase.from('leader_pending_scans').select('barcode').eq('status', 'PENDING')
  ]);
  const pendingSet = new Set([
    ...(gPending.data || []).map(g => normKey(g.barcode)),
    ...(lPending.data || []).map(l => normKey(l.barcode))
  ]);

  const logistikSet = new Set(logistik.map(l => normKey(l.barcode)));
  const pickerSet = new Set(combinedPicker.map(p => normKey(p.barcode)));

  // Detailed breakdown of Picker (12.275)
  let pMatch = 0;
  let pCancel = 0;
  let pPending = 0;
  let pPureBelum = 0;

  combinedPicker.forEach(p => {
    const k = normKey(p.barcode);
    const isCanc = cancelSet.has(k);
    const isM = !isCanc && logistikSet.has(k);
    const isPend = !isCanc && !isM && pendingSet.has(k);

    if (isCanc) pCancel++;
    else if (isM) pMatch++;
    else if (isPend) pPending++;
    else pPureBelum++;
  });

  console.log('=== BREAKDOWN PICKER (Total: ' + combinedPicker.length + ') ===');
  console.log('1. Match Logistik:  ', pMatch);
  console.log('2. Pending LT3:      ', pPending);
  console.log('3. Cancel:           ', pCancel);
  console.log('4. Belum Logistik:   ', pPureBelum);
  console.log('TOTAL PICKER SUM:   ', pMatch + pPending + pCancel + pPureBelum);

  // Detailed breakdown of Logistik (12.185)
  let lMatchToday = 0;
  let lCancel = 0;
  let lPending = 0;
  let lBelum = 0;

  logistik.forEach(l => {
    const k = normKey(l.barcode);
    const isCanc = cancelSet.has(k);
    const isM = !isCanc && pickerSet.has(k);
    const isPend = !isCanc && !isM && pendingSet.has(k);

    if (isCanc) lCancel++;
    else if (isM) lMatchToday++;
    else if (isPend) lPending++;
    else lBelum++;
  });

  console.log('\n=== BREAKDOWN LOGISTIK (Total: ' + logistik.length + ') ===');
  console.log('1. Match Hari Ini:   ', lMatchToday);
  console.log('2. Pending LT3:      ', lPending);
  console.log('3. Cancel:           ', lCancel);
  console.log('4. Belum di-scan:    ', lBelum);
  console.log('TOTAL LOGISTIK SUM: ', lMatchToday + lPending + lCancel + lBelum);

  console.log('\n=== DIRECT FORMULA ===');
  console.log('Total Picker:        ', combinedPicker.length);
  console.log('Total Logistik:      ', logistik.length);
  console.log('Selisih Langsung:    ', combinedPicker.length - logistik.length);
  console.log('Selisih Cancel:      ', pCancel - lCancel, `(Picker: ${pCancel} vs Logistik: ${lCancel})`);
  console.log('Pending LT3:         ', pPending, `(Hanya di Picker)`);
  console.log('Sisa Belum Murni:    ', pPureBelum);
}
run();
