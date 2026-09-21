import { createClient } from '@supabase/supabase-js';
const ACTIVE_URL = 'https://nufvlqrtpzfiqghsxsze.supabase.co';
const ACTIVE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y';
const supabase = createClient(ACTIVE_URL, ACTIVE_KEY);

const normalizeBarcodeKey = (raw) => {
   if (!raw) return '';
   let s = String(raw).trim().toUpperCase();
   if (s.startsWith('0026')) s = s.slice(2);
   s = s.replace(/[\s\-_/\\,.]/g, '');
   if (s.startsWith('00') && s.length > 8) {
      s = s.substring(2);
   }
   return s;
};

const isExcludedOrderSn = (barcode) => {
   let b = (barcode || '').toString().trim();
   if (/^00(?:2[6-9]|3\d|40)/.test(b)) {
      b = b.slice(2);
   }
   return /^(?:2[6-9]|3\d|40)/.test(b);
};

const isRevanOrRachelStaff = (empName) => {
   const name = (empName || '').toString().trim().toUpperCase();
   return name === 'REVAN' || name === 'RACHEL' || name.startsWith('REVAN') || name.startsWith('RACHEL') || name.includes('REVAN') || name.includes('RACHEL');
};

async function fetchAllRecordsForRoles(roles, start, end) {
  let all = [];
  let offset = 0;
  const batchSize = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data: pageData, error } = await supabase
      .from('scanned_items')
      .select('id, barcode, timestamp, scan_date, role, employee_name')
      .in('role', roles)
      .gte('timestamp', start)
      .lte('timestamp', end)
      .order('timestamp', { ascending: false })
      .range(offset, offset + batchSize - 1);
    if (error || !pageData || pageData.length === 0) break;
    all.push(...pageData);
    if (pageData.length < batchSize) hasMore = false;
    else offset += batchSize;
  }
  return all;
}

async function fetchAllCancelledOrdersForDate(targetDate) {
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
  const effectiveDate = '2026-09-21';
  const start = new Date(effectiveDate + 'T00:00:00').getTime();
  const end = new Date(effectiveDate + 'T23:59:59.999').getTime();

  const [pickerRaw, ojolRaw, logistikRaw, cancelRows] = await Promise.all([
     fetchAllRecordsForRoles(['PICKER', 'Picker', 'PICKER_2'], start, end),
     fetchAllRecordsForRoles(['OJOL', 'Ojol'], start, end),
     fetchAllRecordsForRoles(['LOGISTIK', 'Logistik'], start, end),
     fetchAllCancelledOrdersForDate(effectiveDate)
  ]);

  const filteredPickerRaw = pickerRaw.filter((item) => {
     if (isRevanOrRachelStaff(item.employee_name) && isExcludedOrderSn(item.barcode)) {
        return false;
     }
     return true;
  });

  const filteredOjolRaw = ojolRaw.filter((item) => {
     return !isExcludedOrderSn(item.barcode);
  });

  const combinedPickerRaw = [...filteredPickerRaw, ...filteredOjolRaw].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const cancelledBarcodeSet = new Set();
  if (cancelRows && cancelRows.length > 0) {
     cancelRows.forEach((c) => {
        const raw = (c.barcode || '').trim().toUpperCase();
        const norm = normalizeBarcodeKey(raw);
        if (raw) {
           cancelledBarcodeSet.add(raw);
           if (raw.startsWith('0026')) cancelledBarcodeSet.add(raw.slice(2));
        }
        if (norm) cancelledBarcodeSet.add(norm);
     });
  }

  const pickerNormMap = new Map();
  const logistikNormSet = new Set();
  const staffSet = new Set();
  let pickerCount = 0;
  let ojolCount = 0;
  let cancelPickerCount = 0;

  logistikRaw.forEach((item) => {
     const raw = (item.barcode || '').trim();
     const norm = normalizeBarcodeKey(raw);
     if (norm) {
        logistikNormSet.add(norm);
        logistikNormSet.add(raw.toUpperCase());
     }
  });

  combinedPickerRaw.forEach((item) => {
     if (item.employee_name) staffSet.add(item.employee_name.trim());
     const isOjol = (item.role || '').toUpperCase() === 'OJOL';
     if (isOjol) ojolCount++;
     else pickerCount++;

     let rawBarcode = (item.barcode || '').toString().trim().toUpperCase();
     let stripped0026 = rawBarcode.startsWith('0026') ? rawBarcode.slice(2) : rawBarcode;
     const norm = normalizeBarcodeKey(rawBarcode);
     const isCancelled = cancelledBarcodeSet.has(rawBarcode) ||
                         cancelledBarcodeSet.has(stripped0026) ||
                         (norm && cancelledBarcodeSet.has(norm));

     if (!isCancelled && norm) {
        pickerNormMap.set(norm, item);
        pickerNormMap.set(rawBarcode.toUpperCase(), item);
     }
  });

  let pickerMatchCount = 0;
  const formattedPicker = combinedPickerRaw.map((item) => {
     let rawBarcode = (item.barcode || '').toString().trim();
     let stripped0026 = rawBarcode.startsWith('0026') ? rawBarcode.slice(2) : rawBarcode;
     if (rawBarcode.startsWith('0026')) rawBarcode = rawBarcode.slice(2);
     if (/^LXAD[^-]/i.test(rawBarcode)) rawBarcode = 'LXAD-' + rawBarcode.substring(4);
     if (/^JNAP[^-]/i.test(rawBarcode)) rawBarcode = 'JNAP-' + rawBarcode.substring(4);
     if (/^JNEB[^-]/i.test(rawBarcode)) rawBarcode = 'JNEB-' + rawBarcode.substring(4);

     const norm = normalizeBarcodeKey(rawBarcode);
     const isCancelled = cancelledBarcodeSet.has(rawBarcode.toUpperCase()) ||
                         cancelledBarcodeSet.has(stripped0026.toUpperCase()) ||
                         (norm ? cancelledBarcodeSet.has(norm) : false);

     if (isCancelled) cancelPickerCount++;
     const isMatch = !isCancelled && (logistikNormSet.has(norm) || logistikNormSet.has(rawBarcode.toUpperCase()));
     if (isMatch) pickerMatchCount++;

     return {
        barcode: rawBarcode,
        employee_name: item.employee_name,
        role: item.role,
        is_matched_logistik: isMatch,
        is_cancelled: isCancelled
     };
  });

  // Logistik side
  const unmatchedLogistikBarcodes = [];
  logistikRaw.forEach((item) => {
     const raw = (item.barcode || '').toString().trim();
     const norm = normalizeBarcodeKey(raw);
     const stripped0026 = raw.startsWith('0026') ? raw.slice(2) : raw;
     const isCancelled = cancelledBarcodeSet.has(raw.toUpperCase()) ||
                         cancelledBarcodeSet.has(stripped0026.toUpperCase()) ||
                         (norm ? cancelledBarcodeSet.has(norm) : false);
     const isMatchToday = pickerNormMap.has(norm) || pickerNormMap.has(raw.toUpperCase());
     if (!isCancelled && !isMatchToday && raw) {
        unmatchedLogistikBarcodes.push(raw);
        if (norm && norm !== raw) unmatchedLogistikBarcodes.push(norm);
     }
  });

  const historicalPickerMap = new Map();
  if (unmatchedLogistikBarcodes.length > 0) {
     const uniqueUnmatched = Array.from(new Set(unmatchedLogistikBarcodes));
     const chunkSize = 500;
     const chunkPromises = [];
     for (let i = 0; i < uniqueUnmatched.length; i += chunkSize) {
        const chunk = uniqueUnmatched.slice(i, i + chunkSize);
        chunkPromises.push(
           supabase
              .from('scanned_items')
              .select('barcode, employee_name, timestamp, scan_date, role')
              .in('role', ['PICKER', 'Picker', 'PICKER_2', 'OJOL', 'Ojol'])
              .lt('timestamp', start)
              .in('barcode', chunk)
              .order('timestamp', { ascending: false })
        );
     }
     const chunkResults = await Promise.all(chunkPromises);
     chunkResults.forEach((res) => {
        if (res && res.data) {
           res.data.forEach((pItem) => {
              const isOjol = (pItem.role || '').toUpperCase() === 'OJOL';
              const isPickerRevanRachel = !isOjol && isRevanOrRachelStaff(pItem.employee_name);
              const bRaw = (pItem.barcode || '').trim();
              if ((isOjol || isPickerRevanRachel) && isExcludedOrderSn(bRaw)) return;
              const bNorm = normalizeBarcodeKey(bRaw);
              const isCanc = cancelledBarcodeSet.has(bRaw.toUpperCase()) || (bNorm && cancelledBarcodeSet.has(bNorm));
              if (!isCanc) {
                 if (bRaw && !historicalPickerMap.has(bRaw.toUpperCase())) historicalPickerMap.set(bRaw.toUpperCase(), pItem);
                 if (bNorm && !historicalPickerMap.has(bNorm)) historicalPickerMap.set(bNorm, pItem);
              }
           });
        }
     });
  }

  let matchTodayCount = 0;
  let matchPrevCount = 0;
  let cancelLogistikCount = 0;
  let pureUnmatchCount = 0;

  const formattedLogistik = logistikRaw.map((item) => {
     let rawBarcode = (item.barcode || '').toString().trim();
     let stripped0026 = rawBarcode.startsWith('0026') ? rawBarcode.slice(2) : rawBarcode;
     const norm = normalizeBarcodeKey(rawBarcode);
     const isCancelled = cancelledBarcodeSet.has(rawBarcode.toUpperCase()) ||
                         cancelledBarcodeSet.has(stripped0026.toUpperCase()) ||
                         (norm ? cancelledBarcodeSet.has(norm) : false);

     if (isCancelled) {
        cancelLogistikCount++;
        return { barcode: rawBarcode, match_type: 'CANCEL' };
     }
     const isMatchToday = pickerNormMap.has(norm) || pickerNormMap.has(rawBarcode.toUpperCase());
     if (isMatchToday) {
        matchTodayCount++;
        return { barcode: rawBarcode, match_type: 'SAME_DAY' };
     }
     const histItem = historicalPickerMap.get(norm) || historicalPickerMap.get(rawBarcode.toUpperCase());
     if (histItem) {
        matchPrevCount++;
        return { barcode: rawBarcode, match_type: 'PREV_DAY' };
     }
     pureUnmatchCount++;
     return { barcode: rawBarcode, match_type: 'UNMATCH' };
  });

  const totalPicker = formattedPicker.length;
  const totalLogistik = formattedLogistik.length;
  const totalMatchLogistik = matchTodayCount + matchPrevCount;
  const pickerUnmatchCount = Math.max(0, totalPicker - pickerMatchCount - cancelPickerCount);

  console.log('=== EXACT DASHBOARD STATS OUTPUT ===');
  console.log('Total Picker & Ojol      :', totalPicker);
  console.log('  - Match (Picker View)  :', pickerMatchCount);
  console.log('  - Cancel Picker        :', cancelPickerCount);
  console.log('  - Belum Logistik       :', pickerUnmatchCount);
  console.log('  Check: Match + Cancel + Belum =', pickerMatchCount + cancelPickerCount + pickerUnmatchCount);

  console.log('\nTotal Logistik           :', totalLogistik);
  console.log('  - Match Hari Ini       :', matchTodayCount);
  console.log('  - Match Beda Hari      :', matchPrevCount);
  console.log('  - Cancel Logistik      :', cancelLogistikCount);
  console.log('  - Murni Belum Scan     :', pureUnmatchCount);
  console.log('  Check: MatchToday + MatchPrev + Cancel + Belum =', matchTodayCount + matchPrevCount + cancelLogistikCount + pureUnmatchCount);

  console.log('\nTop KPI Cards:');
  console.log('Card 1 (Total Scan Picker & Ojol) :', totalPicker, `(${pickerCount} Picker • ${ojolCount} Ojol • ${cancelPickerCount} Cancel)`);
  console.log('Card 2 (Total Data Logistik)      :', totalLogistik);
  console.log('Card 3 (Total Match Logistik)     :', totalMatchLogistik, `(${matchTodayCount} Hari Ini • ${matchPrevCount} Beda Hari)`);
  console.log('Card 4 (Sisa Belum Match)         :', `${pickerUnmatchCount} Pckr/Ojol / ${pureUnmatchCount} Log (Murni Belum)`);
}

run();
