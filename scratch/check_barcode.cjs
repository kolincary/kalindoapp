const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nufvlqrtpzfiqghsxsze.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y'
);

async function run() {
  const { data: logistikData, error } = await supabase
    .from('scanned_items')
    .select('id, barcode, role, scan_date, timestamp, employee_name')
    .in('role', ['LOGISTIK', 'Logistik'])
    .ilike('barcode', '%4662850240%');
    
  console.log('Logistik exact barcode 4662850240:', logistikData);

  // Let's check all logistik barcodes with 466285
  const { data: all466 } = await supabase
    .from('scanned_items')
    .select('id, barcode, role, scan_date, timestamp, employee_name')
    .in('role', ['LOGISTIK', 'Logistik'])
    .ilike('barcode', '%466285%')
    .limit(20);
    
  console.log('Logistik barcodes with 466285:', all466);
}

run();
