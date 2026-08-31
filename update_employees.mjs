import { createClient } from '@supabase/supabase-js';

const url = 'https://lxhwyrzxgqvosecnhfli.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4aHd5cnp4Z3F2b3NlY25oZmxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzQ3MjEsImV4cCI6MjA4NTE1MDcyMX0.32gBAnMHN9R4eWl-Tu2NxivrM7c7Kqctk9XEvdpKf94';

const supabase = createClient(url, key);

async function run() {
  const { data: employees, error } = await supabase.from('employees').select('*');
  if (error) {
    console.error('Error fetching employees:', error);
    return;
  }
  
  if (employees) {
    for (const emp of employees) {
      if (emp.allowed_roles) {
        let roles = [];
        try {
          roles = typeof emp.allowed_roles === 'string' ? JSON.parse(emp.allowed_roles) : emp.allowed_roles;
        } catch (e) {
          roles = [emp.allowed_roles];
        }

        if (Array.isArray(roles) && (roles.includes('PICKER') || roles.includes('Picker')) && !roles.includes('PICKER_2')) {
          roles.push('PICKER_2');
          
          await supabase.from('employees').update({ allowed_roles: roles }).eq('id', emp.id);
          console.log(`Updated employee ${emp.name} with PICKER_2 role`);
        }
      }
    }
    console.log("Finished updating employees.");
  }
}

run();
