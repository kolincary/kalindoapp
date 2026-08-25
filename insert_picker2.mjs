import { createClient } from '@supabase/supabase-js';

const url = 'https://iwvbrigjydmhbwbnbbbk.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dmJyaWdqeWRtaGJ3Ym5iYmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzQ5MzksImV4cCI6MjA4NTU1MDkzOX0.RkdZ2vZDWGvY6VTQLE3JYfpMEvIBOrO7b6xyGFoRf1k';

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('app_profiles_config')
    .upsert({ role: 'PICKER_2', is_active: true, sort_order: 1 }, { onConflict: 'role' });
    
  if (error) {
    console.error('Error inserting PICKER_2:', error);
  } else {
    console.log('Successfully inserted PICKER_2 config:', data);
  }

  // Also add PICKER_2 to users who have PICKER
  const { data: users, error: usersError } = await supabase.from('app_users').select('*');
  if (!usersError && users) {
    for (const user of users) {
      if (user.roles && user.roles.includes('PICKER') && !user.roles.includes('PICKER_2')) {
        await supabase.from('app_users').update({ roles: [...user.roles, 'PICKER_2'] }).eq('email', user.email);
        console.log(`Updated user ${user.email} with PICKER_2 role`);
      }
    }
  }
}

run();
