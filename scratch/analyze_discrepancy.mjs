import { createClient } from '@supabase/supabase-js';
const ACTIVE_URL = 'https://nufvlqrtpzfiqghsxsze.supabase.co';
const ACTIVE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y';
const supabase = createClient(ACTIVE_URL, ACTIVE_KEY);

function normalizeBarcodeKey(raw) {
  if (!raw) return '';
  let clean = raw.trim().toUpperCase();
  if (clean.startsWith('0026')) clean = clean.slice(2);
  if (/^LXAD[^-]/i.test(clean)) clean = 'LXAD-' + clean.substring(4);
  if (/^JNAP[^-]/i.test(clean)) clean = 'JNAP-' + clean.substring(4);
  if (/^JNEB[^-]/i.test(clean)) clean = 'JNEB-' + clean.substring(4);
  return clean;
}

const isRevanOrRachelStaff = (name) => {
  const norm = (name || '').trim().toUpperCase();
  return norm.includes('REVAN') || norm.includes('RACHEL');
};

const isExcludedOrderSn = (barcode) => {
  if (!barcode) return false;
  const raw = barcode.trim();
  const pattern00 = /^00(?:2[6-9]|3\d|40)/;
  const patternNo00 = /^(?:2[6-9]|3\d|40)/;
  return pattern00.test(raw) || patternNo00.test(raw);
};

async function fetchAllRecordsForRoles(roles, start, end) {
  let all = [];
  let page = 0;
  const size = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase
      .from('scanned_items')
      .select('id, barcode, timestamp, role, employee_name')
      .in('role', roles)
      .gte('timestamp', start)
      .lte('timestamp', end)
      .range(page * size, (page + 1) * size - 1);
    if (error) {
       console.error('Error fetching roles', roles, error);
       break;
    }
    if (data && data.length > 0) {
       all = all.concat(data);
       if (data.length < size) hasMore = false;
       else page++;
    } else {
       hasMore = false;
    }
  }
  return all;
}

async function fetchCancelledOrders(targetDate) {
  const startOfDay = new Date(targetDate + 'T00:00:00').toISOString();
  const endOfDay = new Date(targetDate + 'T23:59:59.999').toISOString();
  let allCancel = [];
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await supabase
      .from('cancelled_orders')
      .select('barcode, cancelled_at')
      .eq('is_active', true)
      .gte('cancelled_at', startOfDay)
      .lte('cancelled_at', endOfDay)
      .range(offset, offset + 999);
    if (error || !data || data.length === 0) break;
    allCancel.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return allCancel;
}

async function run() {
  const targetDate = '2026-09-21';
  const start = new Date(targetDate + 'T00:00:00').getTime();
  const end = new Date(targetDate + 'T23:59:59.999').getTime();

  console.log('--- FETCHING REAL DATA FOR', targetDate, '---');

  const [pickerRaw, ojolRaw, logistikRaw, cancelRows] = await Promise.all([
    fetchAllRecordsForRoles(['PICKER', 'Picker', 'PICKER_2'], start, end),
    fetchAllRecordsForRoles(['OJOL', 'Ojol'], start, end),
    fetchAllRecordsForRoles(['LOGISTIK', 'Logistik'], start, end),
    fetchCancelledOrders(targetDate)
  ]);

  console.log('Raw Scanned: Picker =', pickerRaw.length, ', Ojol =', ojolRaw.length, ', Logistik =', logistikRaw.length);
  console.log('Cancelled Orders in Table:', cancelRows.length);

  // Filter out excluded prefix
  const filteredPicker = pickerRaw.filter(p => !(isRevanOrRachelStaff(p.employee_name) && isExcludedOrderSn(p.barcode)));
  const filteredOjol = ojolRaw.filter(o => !isExcludedOrderSn(o.barcode));
  const combinedPicker = [...filteredPicker, ...filteredOjol];

  console.log('Combined Picker & Ojol after prefix exclusion:', combinedPicker.length);

  // Cancelled set
  const cancelSet = new Set();
  cancelRows.forEach(c => {
    const raw = (c.barcode || '').trim().toUpperCase();
    const norm = normalizeBarcodeKey(raw);
    if (raw) {
      cancelSet.add(raw);
      if (raw.startsWith('0026')) cancelSet.add(raw.slice(2));
    }
    if (norm) cancelSet.add(norm);
  });

  // Logistik Norm Set
  const logistikNormSet = new Set();
  const logistikNormMap = new Map();
  logistikRaw.forEach(l => {
    const raw = (l.barcode || '').trim();
    const norm = normalizeBarcodeKey(raw);
    if (norm) {
      logistikNormSet.add(norm);
      logistikNormSet.add(raw.toUpperCase());
      logistikNormMap.set(norm, l);
    }
  });

  // Picker processing
  const pickerNormMap = new Map();
  let pickerCancelledCount = 0;
  let pickerMatchCount = 0;
  const pickerUnmatchedList = [];
  const pickerCancelledList = [];
  const pickerMatchedList = [];

  combinedPicker.forEach(p => {
    let raw = (p.barcode || '').trim();
    if (raw.startsWith('0026')) raw = raw.slice(2);
    if (/^LXAD[^-]/i.test(raw)) raw = 'LXAD-' + raw.substring(4);
    if (/^JNAP[^-]/i.test(raw)) raw = 'JNAP-' + raw.substring(4);
    if (/^JNEB[^-]/i.test(raw)) raw = 'JNEB-' + raw.substring(4);

    const norm = normalizeBarcodeKey(raw);
    const isCanc = cancelSet.has(raw.toUpperCase()) || (norm && cancelSet.has(norm));

    if (isCanc) {
      pickerCancelledCount++;
      pickerCancelledList.push(p);
    } else {
      if (norm) {
        pickerNormMap.set(norm, p);
        pickerNormMap.set(raw.toUpperCase(), p);
      }
      const isMatch = logistikNormSet.has(norm) || logistikNormSet.has(raw.toUpperCase());
      if (isMatch) {
        pickerMatchCount++;
        pickerMatchedList.push(p);
      } else {
        pickerUnmatchedList.push(p);
      }
    }
  });

  // Logistik processing
  let logistikCancelledCount = 0;
  let logistikMatchTodayCount = 0;
  let logistikUnmatchedToday = [];

  logistikRaw.forEach(l => {
    let raw = (l.barcode || '').trim();
    const norm = normalizeBarcodeKey(raw);
    const isCanc = cancelSet.has(raw.toUpperCase()) || (norm && cancelSet.has(norm));

    if (isCanc) {
      logistikCancelledCount++;
    } else {
      const isMatchToday = pickerNormMap.has(norm) || pickerNormMap.has(raw.toUpperCase());
      if (isMatchToday) {
        logistikMatchTodayCount++;
      } else {
        logistikUnmatchedToday.push(l);
      }
    }
  });

  // Historical cross check for logistik unmatched today
  const unmatchedBarcodes = logistikUnmatchedToday.map(l => (l.barcode || '').trim());
  let logistikMatchPrevCount = 0;
  let logistikPureUnmatchCount = 0;

  if (unmatchedBarcodes.length > 0) {
    const { data: histData } = await supabase
      .from('scanned_items')
      .select('barcode, scan_date, timestamp, role, employee_name')
      .in('role', ['PICKER', 'Picker', 'PICKER_2', 'OJOL', 'Ojol'])
      .lt('timestamp', start)
      .in('barcode', unmatchedBarcodes);

    const histMap = new Map();
    if (histData) {
      histData.forEach(h => {
        const norm = normalizeBarcodeKey(h.barcode);
        if (norm) histMap.set(norm, h);
        histMap.set((h.barcode || '').trim().toUpperCase(), h);
      });
    }

    logistikUnmatchedToday.forEach(l => {
      const norm = normalizeBarcodeKey(l.barcode);
      const raw = (l.barcode || '').trim().toUpperCase();
      if (histMap.has(norm) || histMap.has(raw)) {
        logistikMatchPrevCount++;
      } else {
        logistikPureUnmatchCount++;
      }
    });
  }

  console.log('\n=========================================');
  console.log('📊 REKAP HITUNGAN LENGKAP TANGGAL 2026-09-21');
  console.log('=========================================');
  console.log('1. KOLOM DATA PICKER & OJOL (Total:', combinedPicker.length, ')');
  console.log('   - Match di Logistik :', pickerMatchCount);
  console.log('   - Cancel            :', pickerCancelledCount);
  console.log('   - Belum Logistik    :', pickerUnmatchedList.length);
  console.log('   ----------------------------------- +');
  console.log('   Total Penjumlahan   :', pickerMatchCount + pickerCancelledCount + pickerUnmatchedList.length);

  console.log('\n2. KOLOM DATA LOGISTIK (Total:', logistikRaw.length, ')');
  console.log('   - Match Hari Ini    :', logistikMatchTodayCount);
  console.log('   - Match Beda Hari   :', logistikMatchPrevCount, '(barang sisa/kemarin yang baru discan logistik hari ini)');
  console.log('   - Cancel            :', logistikCancelledCount);
  console.log('   - Murni Belum       :', logistikPureUnmatchCount);
  console.log('   ----------------------------------- +');
  console.log('   Total Penjumlahan   :', logistikMatchTodayCount + logistikMatchPrevCount + logistikCancelledCount + logistikPureUnmatchCount);

  console.log('\n3. ANALISIS PERBEDAAN (KENAPA 12.275 != 12.185):');
  console.log('   A. Resi yang discan Picker hari ini tapi BELUM discan Logistik hari ini (Belum Logistik):', pickerUnmatchedList.length, 'resi');
  console.log('   B. Resi yang discan Logistik hari ini tapi scan Pickernya di HARI SEBELUMNYA (Match Beda Hari):', logistikMatchPrevCount, 'resi');
  console.log('   C. Selisih Cancel Picker (', pickerCancelledCount, ') vs Cancel Logistik (', logistikCancelledCount, ') =', pickerCancelledCount - logistikCancelledCount, 'resi (ada cancel yang tidak/belum discan logistik)');
  
  // Let's check duplicate scans within picker and logistik
  const pickerUnique = new Set(combinedPicker.map(p => normalizeBarcodeKey(p.barcode)));
  const logistikUnique = new Set(logistikRaw.map(l => normalizeBarcodeKey(l.barcode)));
  console.log('   D. Duplikasi scan:');
  console.log('      - Picker: Total baris =', combinedPicker.length, ', Barcode Unik =', pickerUnique.size, '(Selisih multi-scan =', combinedPicker.length - pickerUnique.size, ')');
  console.log('      - Logistik: Total baris =', logistikRaw.length, ', Barcode Unik =', logistikUnique.size, '(Selisih multi-scan =', logistikRaw.length - logistikUnique.size, ')');

  console.log('\nContoh beberapa resi Picker yang Belum Logistik (Top 10):');
  pickerUnmatchedList.slice(0, 10).forEach((p, idx) => {
    console.log(`   ${idx + 1}. ${p.barcode} | Staff: ${p.employee_name} | Role: ${p.role}`);
  });
}

run();
