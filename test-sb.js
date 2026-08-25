const { createClient } = require('@supabase/supabase-js');
const ACTIVE_URL = 'https://lxhwyrzxgqvosecnhfli.supabase.co';
const ACTIVE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4aHd5cnp4Z3F2b3NlY25oZmxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzQ3MjEsImV4cCI6MjA4NTE1MDcyMX0.32gBAnMHN9R4eWl-Tu2NxivrM7c7Kqctk9XEvdpKf94';
const supabase = createClient(ACTIVE_URL, ACTIVE_KEY);

async function check() {
  try {
     const term = 'CM77367628500';
     const upper = term.toUpperCase();
     const { data, error } = await supabase
        .from('scanned_items')
        .select('*')
        .or('barcode.eq.' + upper + ',barcode.ilike.%' + term + '%,destination.ilike.%' + term + '%')
        .limit(100);
     
     console.log('Supabase-JS result length:', data ? data.length : 0, 'Error:', error);
  } catch(e) {
     console.error('Exception:', e);
  }
}
check();
