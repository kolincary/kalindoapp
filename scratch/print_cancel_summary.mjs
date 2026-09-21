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
   if (/^00(?:2[6-9]|3\d|40)/.test(b)) b = b.slice(2);
   return /^(?:2[6-9]|3\d|40)/.test(b);
};

const isRevanOrRachelStaff = (empName) => {
   const name = (empName || '').toString().trim().toUpperCase();
   return name === 'REVAN' || name === 'RACHEL' || name.startsWith('REVAN') || name.startsWith('RACHEL') || name.includes('REVAN') || name.includes('RACHEL');
};

async function printAll70Cancel() {
  const targetDate = '2026-09-21';
  const start = new Date(targetDate + 'T00:00:00').getTime();
  const end = new Date(targetDate + 'T23:59:59.999').getTime();
  const startOfDay = new Date(targetDate + 'T00:00:00').toISOString();
  const endOfDay = new Date(targetDate + 'T23:59:59.999').toISOString();

  // Fetch cancel
  let allCancel = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase.from('cancelled_orders').select('barcode, cancelled_at').eq('is_active', true).gte('cancelled_at', startOfDay).lte('cancelled_at', endOfDay).range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allCancel.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }

  const cancelledBarcodeSet = new Set();
  allCancel.forEach(c => {
     const raw = (c.barcode || '').trim().toUpperCase();
     const norm = normalizeBarcodeKey(raw);
     if (raw) {
        cancelledBarcodeSet.add(raw);
        if (raw.startsWith('0026')) cancelledBarcodeSet.add(raw.slice(2));
     }
     if (norm) cancelledBarcodeSet.add(norm);
  });

  // Fetch picker
  let allPicker = [];
  offset = 0;
  while (true) {
    const { data } = await supabase.from('scanned_items').select('id, barcode, timestamp, role, employee_name').in('role', ['PICKER', 'Picker', 'PICKER_2', 'OJOL', 'Ojol']).gte('timestamp', start).lte('timestamp', end).range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allPicker.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }

  // Fetch logistik
  let allLogistik = [];
  offset = 0;
  while (true) {
    const { data } = await supabase.from('scanned_items').select('id, barcode, timestamp, role, employee_name').in('role', ['LOGISTIK', 'Logistik']).gte('timestamp', start).lte('timestamp', end).range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allLogistik.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }

  const filteredPicker = allPicker.filter(item => {
     const isOjol = (item.role || '').toUpperCase() === 'OJOL';
     const isPickerRevanRachel = !isOjol && isRevanOrRachelStaff(item.employee_name);
     if ((isOjol || isPickerRevanRachel) && isExcludedOrderSn(item.barcode)) return false;
     return true;
  });

  const pickerCancelled = filteredPicker.filter(item => {
     let raw = (item.barcode || '').toString().trim().toUpperCase();
     let stripped0026 = raw.startsWith('0026') ? raw.slice(2) : raw;
     const norm = normalizeBarcodeKey(raw);
     return cancelledBarcodeSet.has(raw) || cancelledBarcodeSet.has(stripped0026) || (norm && cancelledBarcodeSet.has(norm));
  });

  const logistikCancelled = allLogistik.filter(item => {
     let raw = (item.barcode || '').toString().trim().toUpperCase();
     let stripped0026 = raw.startsWith('0026') ? raw.slice(2) : raw;
     const norm = normalizeBarcodeKey(raw);
     return cancelledBarcodeSet.has(raw) || cancelledBarcodeSet.has(stripped0026) || (norm && cancelledBarcodeSet.has(norm));
  });

  console.log('Total Cancelled Barcodes in Picker Scans   :', pickerCancelled.length);
  console.log('Total Cancelled Barcodes in Logistik Scans :', logistikCancelled.length);

  const logistikCancelBarcodes = new Set(logistikCancelled.map(l => normalizeBarcodeKey(l.barcode)));

  let countInBoth = 0;
  let countPickerOnly = 0;

  const staffCount = {};

  pickerCancelled.forEach(p => {
     const norm = normalizeBarcodeKey(p.barcode);
     staffCount[p.employee_name] = (staffCount[p.employee_name] || 0) + 1;
     if (logistikCancelBarcodes.has(norm)) countInBoth++;
     else countPickerOnly++;
  });

  console.log('Cancelled scans yang ada di Picker DAN Logistik (Keduanya) :', countInBoth);
  console.log('Cancelled scans yang HANYA ada di Picker (Tidak ke Logistik):', countPickerOnly);
  console.log('\nDistribusi 70 Cancel Picker per Staff:');
  console.log(staffCount);
}

printAll70Cancel();
