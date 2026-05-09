const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ptdtuiuhjkpftukiflcm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0ZHR1aXVoamtwZnR1a2lmbGNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIyMjIzOSwiZXhwIjoyMDkzNzk4MjM5fQ.r4SOr0ex4C-yPlkyIGgL6kSR_8hstHmak93hK2oIcx8',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const users = [
  { id: '00000000-0000-0000-0000-000000000001', email: 'owner@mourden.co' },
  { id: '00000000-0000-0000-0000-000000000002', email: 'admin@mourden.co' },
  { id: '00000000-0000-0000-0000-000000000003', email: 'staff1@mourden.co' },
  { id: '00000000-0000-0000-0000-000000000004', email: 'staff2@mourden.co' },
  { id: '00000000-0000-0000-0000-000000000005', email: 'staff3@mourden.co' }
];

async function fixPasswords() {
  for (const u of users) {
    const { error } = await supabase.auth.admin.updateUserById(u.id, { password: 'mourden123' });
    console.log(error ? `✗ ${u.email}: ${error.message}` : `✓ ${u.email}: password updated`);
  }
}

fixPasswords();
