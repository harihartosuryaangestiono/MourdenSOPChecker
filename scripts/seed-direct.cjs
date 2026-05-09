const { Client } = require('pg');
const bcrypt = require('bcrypt');

const connectionString = 'postgresql://postgres:hariharto123@db.ptdtuiuhjkpftukiflcm.supabase.co:5432/postgres';

const users = [
  { email: 'owner@mourden.co', password: 'mourden123', name: 'Owner Mourden', role: 'owner', shift: 'all' },
  { email: 'admin@mourden.co', password: 'mourden123', name: 'Admin Mourden', role: 'admin', shift: 'all' },
  { email: 'staff1@mourden.co', password: 'mourden123', name: 'Budi Santoso', role: 'staff', shift: 'opening' },
  { email: 'staff2@mourden.co', password: 'mourden123', name: 'Ani Wijaya', role: 'staff', shift: 'middle' },
  { email: 'staff3@mourden.co', password: 'mourden123', name: 'Dedi Kurniawan', role: 'staff', shift: 'closing' },
];

async function seed() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    for (const user of users) {
      try {
        // Generate bcrypt hash (same as Supabase GoTrue)
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const metaData = JSON.stringify({ role: user.role, name: user.name });
        
        // Generate UUID for user
        const userId = require('crypto').randomUUID();
        
        // Check if user exists first
        const checkQuery = `SELECT id FROM auth.users WHERE email = $1 LIMIT 1`;
        const checkResult = await client.query(checkQuery, [user.email]);
        
        let actualUserId;
        
        if (checkResult.rows.length > 0) {
          // Update existing user
          actualUserId = checkResult.rows[0].id;
          const updateQuery = `
            UPDATE auth.users 
            SET encrypted_password = $1, 
                raw_user_meta_data = $2,
                email_confirmed_at = NOW(),
                updated_at = NOW()
            WHERE id = $3
          `;
          await client.query(updateQuery, [hashedPassword, metaData, actualUserId]);
          console.log(`  Updated existing user: ${user.email}`);
        } else {
          // Insert new user
          const authQuery = `
            INSERT INTO auth.users (
              id, email, encrypted_password, email_confirmed_at, 
              raw_user_meta_data, created_at, updated_at, confirmation_sent_at
            ) VALUES ($1, $2, $3, NOW(), $4, NOW(), NOW(), NOW())
            RETURNING id;
          `;
          const authResult = await client.query(authQuery, [
            userId, 
            user.email, 
            hashedPassword, 
            metaData
          ]);
          actualUserId = authResult.rows[0].id;
        }
        
        // Insert into public.users
        const publicQuery = `
          INSERT INTO public.users (
            id, name, email, role, shift_preference, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            shift_preference = EXCLUDED.shift_preference,
            updated_at = NOW();
        `;
        
        await client.query(publicQuery, [
          actualUserId,
          user.name,
          user.email,
          user.role,
          user.shift
        ]);
        
        console.log(`✓ Created user: ${user.email} (${user.role})`);
      } catch (err) {
        console.error(`✗ Failed to create ${user.email}:`, err.message);
      }
    }
    
    console.log('\n✓ Seeding completed!');
    console.log('You can now login with any of these accounts:');
    console.log('  Email: owner@mourden.co / staff1@mourden.co / etc');
    console.log('  Password: mourden123');
    
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
  }
}

seed();
