// Reset password untuk semua user via Supabase Auth API
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ptdtuiuhjkpftukiflcm.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0ZHR1aXVoamtwZnR1a2lmbGNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODIyMjIzOSwiZXhwIjoyMDkzNzk4MjM5fQ.r4SOr0ex4C-yPlkyIGgL6kSR_8hstHmak93hK2oIcx8';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const users = [
  { email: 'owner@mourden.co', password: 'mourden123' },
  { email: 'admin@mourden.co', password: 'mourden123' },
  { email: 'staff1@mourden.co', password: 'mourden123' },
  { email: 'staff2@mourden.co', password: 'mourden123' },
  { email: 'staff3@mourden.co', password: 'mourden123' },
];

async function resetPasswords() {
  for (const user of users) {
    try {
      // Update user password via Admin API
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        user.email, // Actually need user ID, not email
        { password: user.password }
      );
      
      if (error) {
        console.error(`✗ ${user.email}: ${error.message}`);
      } else {
        console.log(`✓ ${user.email}: password updated`);
      }
    } catch (err) {
      console.error(`✗ ${user.email}: ${err.message}`);
    }
  }
}

// Alternative: Use listUsers to get IDs first
async function listAndReset() {
  const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('Failed to list users:', listError.message);
    return;
  }
  
  for (const user of users) {
    const dbUser = userList.users.find(u => u.email === user.email);
    if (dbUser) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        dbUser.id,
        { password: user.password }
      );
      if (error) {
        console.error(`✗ ${user.email}: ${error.message}`);
      } else {
        console.log(`✓ ${user.email}: password set to "mourden123"`);
      }
    } else {
      console.error(`✗ ${user.email}: User not found in auth.users`);
    }
  }
}

listAndReset();
