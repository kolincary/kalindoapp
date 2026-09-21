const { createClient } = require('@supabase/supabase-js');
const sbUrl = 'https://nufvlqrtpzfiqghsxsze.supabase.co';
const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y';
const supabase = createClient(sbUrl, sbKey);

async function run() {
  const targetDate = '2026-09-21';
  const start = new Date(targetDate + 'T00:00:00').getTime();
  const end = new Date(targetDate + 'T23:59:59.999').getTime();

  // 1. Fetch count
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

  console.log('Raw counts:');
  console.log('Picker raw:', picker.length);
  console.log('Ojol raw:', ojol.length);
  console.log('Logistik raw:', logistik.length);

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

  console.log('Filtered Picker + Ojol:', combinedPicker.length);

  // Cancelled
  const startOfDay = new Date(targetDate + 'T00:00:00').toISOString();
  const endOfDay = new Date(targetDate + 'T23:59:59.999').toISOString();
  const { data: cancelData } = await supabase.from('cancelled_orders').select('barcode').eq('is_active', true).gte('cancelled_at', startOfDay).lte('cancelled_at', endOfDay);
  console.log('Cancelled orders count in DB:', cancelData ? cancelData.length : 0);

  // Normalization helper
  const normKey = (s) => (s || '').toString().trim().toUpperCase().replace(/[\s\-_]/g, '');

  const cancelSet = new Set((cancelData || []).map(c => normKey(c.barcode)));
  const logistikMap = new Map();
  logistik.forEach(l => {
    const k = normKey(l.barcode);
    logistikMap.set(k, l);
  });

  const pickerMap = new Map();
  combinedPicker.forEach(p => {
    const k = normKey(p.barcode);
    pickerMap.set(k, p);
  });

  // Check matching
  let pickerInLogistik = 0;
  let pickerCancel = 0;
  let pickerNotLogistik = 0;
  const pickerNotLogistikList = [];

  combinedPicker.forEach(p => {
    const k = normKey(p.barcode);
    if (cancelSet.has(k)) {
      pickerCancel++;
    } else if (logistikMap.has(k)) {
      pickerInLogistik++;
    } else {
      pickerNotLogistik++;
      pickerNotLogistikList.push(p);
    }
  });

  console.log('\n=== PICKER BREAKDOWN ===');
  console.log('Total Picker & Ojol:      ', combinedPicker.length);
  console.log('  1. Match dengan Logistik: ', pickerInLogistik);
  console.log('  2. Resi Cancel:          ', pickerCancel);
  console.log('  3. Belum ada di Logistik: ', pickerNotLogistik);
  console.log('  -> SUM:                  ', pickerInLogistik + pickerCancel + pickerNotLogistik);

  // Check Logistik breakdown
  let logistikInPickerToday = 0;
  let logistikCancel = 0;
  let logistikNotInPickerToday = 0;
  const logistikNotInPickerTodayList = [];

  logistik.forEach(l => {
    const k = normKey(l.barcode);
    if (cancelSet.has(k)) {
      logistikCancel++;
    } else if (pickerMap.has(k)) {
      logistikInPickerToday++;
    } else {
      logistikNotInPickerToday++;
      logistikNotInPickerTodayList.push(l);
    }
  });

  console.log('\n=== LOGISTIK BREAKDOWN ===');
  console.log('Total Data Logistik:      ', logistik.length);
  console.log('  1. Match dengan Picker:  ', logistikInPickerToday);
  console.log('  2. Resi Cancel:          ', logistikCancel);
  console.log('  3. Belum ada di Picker:  ', logistikNotInPickerToday);
  console.log('  -> SUM:                  ', logistikInPickerToday + logistikCancel + logistikNotInPickerToday);

  console.log('\n=== DIRECT COMPARISON ===');
  console.log('Total Picker - Total Logistik =', combinedPicker.length - logistik.length);
  console.log('Picker Match - Logistik Match =', pickerInLogistik - logistikInPickerToday);
}
run();
