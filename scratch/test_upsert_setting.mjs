import { createClient } from '@supabase/supabase-js';
const ACTIVE_URL = 'https://nufvlqrtpzfiqghsxsze.supabase.co';
const ACTIVE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51ZnZscXJ0cHpmaXFnaHN4c3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjUwNDksImV4cCI6MjEwNDM0MTA0OX0.ckrLJhBmaGP3nBL_l3OjOntEliCuz4wtlJM3kgwZs_Y';
const supabase = createClient(ACTIVE_URL, ACTIVE_KEY);

async function testUpsert() {
  try {
    const { data: existing, error: selectErr } = await supabase
      .from('app_settings')
      .select('id, setting_key, setting_value')
      .eq('setting_key', 'active_db_source')
      .maybeSingle();

    console.log('existing:', existing, 'selectErr:', selectErr);

    if (existing) {
      const { data, error } = await supabase
        .from('app_settings')
        .update({ setting_value: 'FIRESTORE' })
        .eq('setting_key', 'active_db_source')
        .select();
      console.log('updated:', data, 'error:', error);
    } else {
      const { data, error } = await supabase
        .from('app_settings')
        .insert({ setting_key: 'active_db_source', setting_value: 'FIRESTORE' })
        .select();
      console.log('inserted:', data, 'error:', error);
    }
  } catch(e) {
    console.error('Exception:', e);
  }
}
testUpsert();
