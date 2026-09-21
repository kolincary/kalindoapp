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

async function checkCancel() {
  const targetDate = '2026-09-21';
  const start = new Date(targetDate + 'T00:00:00').getTime();
  const end = new Date(targetDate + 'T23:59:59.999').getTime();
  const startOfDay = new Date(targetDate + 'T00:00:00').toISOString();
  const endOfDay = new Date(targetDate + 'T23:59:59.999').toISOString();

  // 1. Cancelled orders table
  const { data: cancelRows } = await supabase.from('cancelled_orders').select('barcode, cancelled_at').eq('is_active', true).gte('cancelled_at', startOfDay).lte('cancelled_at', endOfDay).range(0, 1000);
  console.log('Total Master Data Cancel di menu Data Cancel (2026-09-21):', cancelRows ? cancelRows.length : 0);

  const cancelSet = new Set();
  (cancelRows || []).forEach(c => {
     const raw = (c.barcode || '').trim().toUpperCase();
     const norm = normalizeBarcodeKey(raw);
     if (raw) cancelSet.add(raw);
     if (norm) cancelSet.add(norm);
  });

  // 2. Picker items
  const { data: pickerItems } = await supabase.from('scanned_items').select('barcode, employee_name, timestamp, role').in('role', ['PICKER', 'Picker', 'PICKER_2', 'OJOL', 'Ojol']).gte('timestamp', start).lte('timestamp', end).range(0, 15000);

  // 3. Logistik items
  const { data: logistikItems } = await supabase.from('scanned_items').select('barcode, employee_name, timestamp, role').in('role', ['LOGISTIK', 'Logistik']).gte('timestamp', start).lte('timestamp', end).range(0, 15000);

  // Find which picker items are cancelled
  const pickerCancelled = [];
  (pickerItems || []).forEach(p => {
     const raw = (p.barcode || '').trim().toUpperCase();
     const norm = normalizeBarcodeKey(raw);
     if (cancelSet.has(raw) || cancelSet.has(norm)) {
        pickerCancelled.push(p);
     }
  });

  // Find which logistik items are cancelled
  const logistikCancelled = [];
  const logistikCancelSet = new Set();
  (logistikItems || []).forEach(l => {
     const raw = (l.barcode || '').trim().toUpperCase();
     const norm = normalizeBarcodeKey(raw);
     if (cancelSet.has(raw) || cancelSet.has(norm)) {
        logistikCancelled.push(l);
        logistikCancelSet.add(raw);
        logistikCancelSet.add(norm);
     }
  });

  console.log('Jumlah Resi Cancel yang sempat di-scan TIM PICKER   :', pickerCancelled.length);
  console.log('Jumlah Resi Cancel yang sempat di-scan TIM LOGISTIK  :', logistikCancelled.length);

  // Cross check:
  // Cancelled items in Picker that ALSO reached Logistik
  const bothCancel = pickerCancelled.filter(p => {
     const raw = (p.barcode || '').trim().toUpperCase();
     const norm = normalizeBarcodeKey(raw);
     return logistikCancelSet.has(raw) || logistikCancelSet.has(norm);
  });

  // Cancelled items in Picker that NEVER reached Logistik
  const pickerOnlyCancel = pickerCancelled.filter(p => {
     const raw = (p.barcode || '').trim().toUpperCase();
     const norm = normalizeBarcodeKey(raw);
     return !logistikCancelSet.has(raw) && !logistikCancelSet.has(norm);
  });

  console.log('1. Resi Cancel yang di-scan di Picker DAN JUGA di-scan di Logistik (Keduanya) :', bothCancel.length);
  console.log('2. Resi Cancel yang HANYA di-scan di Picker (TIDAK discan Logistik)            :', pickerOnlyCancel.length);

  console.log('\n--- Contoh 5 Resi Cancel yang HANYA di-scan Picker (Berhasil dicegat/tidak ke logistik) ---');
  pickerOnlyCancel.slice(0, 5).forEach((p, idx) => {
     console.log(`  ${idx+1}. Barcode: ${p.barcode} | Discan Picker oleh: ${p.employee_name}`);
  });

  console.log('\n--- Contoh 5 Resi Cancel yang lolos ter-scan di KEDUANYA (Picker & Logistik) ---');
  bothCancel.slice(0, 5).forEach((p, idx) => {
     console.log(`  ${idx+1}. Barcode: ${p.barcode} | Discan Picker oleh: ${p.employee_name}`);
  });
}

checkCancel();
