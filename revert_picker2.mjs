import { createClient } from '@supabase/supabase-js';

const url = 'https://lxhwyrzxgqvosecnhfli.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4aHd5cnp4Z3F2b3NlY25oZmxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzQ3MjEsImV4cCI6MjA4NTE1MDcyMX0.32gBAnMHN9R4eWl-Tu2NxivrM7c7Kqctk9XEvdpKf94';

const supabase = createClient(url, key);

async function revert() {
  console.log("Reverting app_users...");
  const { data: users, error: usersError } = await supabase.from('app_users').select('*');
  if (!usersError && users) {
    for (const user of users) {
      if (user.roles && user.roles.includes('PICKER_2')) {
        const newRoles = user.roles.filter(r => r !== 'PICKER_2');
        await supabase.from('app_users').update({ roles: newRoles }).eq('email', user.email);
        console.log(`Reverted user ${user.email} (removed PICKER_2)`);
      }
    }
  }

  console.log("Reverting employees...");
  const { data: employees, error: empError } = await supabase.from('employees').select('*');
  if (!empError && employees) {
    for (const emp of employees) {
      if (emp.allowed_roles) {
        let roles = [];
        try {
          roles = typeof emp.allowed_roles === 'string' ? JSON.parse(emp.allowed_roles) : emp.allowed_roles;
        } catch (e) {
          roles = [emp.allowed_roles];
        }

        if (Array.isArray(roles) && roles.includes('PICKER_2')) {
          const newRoles = roles.filter(r => r !== 'PICKER_2');
          await supabase.from('employees').update({ allowed_roles: newRoles }).eq('id', emp.id);
          console.log(`Reverted employee ${emp.name} (removed PICKER_2)`);
        }
      }
    }
  }
  
  console.log("Finished reverting PICKER_2 role from all users and employees.");
}

revert();
