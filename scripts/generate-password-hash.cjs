// Generate password hash using GoTrue-compatible method
// Supabase GoTrue uses bcrypt with $2a$ prefix

const bcrypt = require('bcrypt');

const password = 'mourden123';
const rounds = 10;

// GoTrue uses $2a$ prefix, not $2b$
const salt = bcrypt.genSaltSync(rounds, 'a'); // 'a' for $2a$
const hash = bcrypt.hashSync(password, salt);

console.log('Password: mourden123');
console.log('Hash:', hash);
console.log('\nUse this SQL to update passwords:');
console.log(`
UPDATE auth.users SET encrypted_password = '${hash}' WHERE email = 'owner@mourden.co';
UPDATE auth.users SET encrypted_password = '${hash}' WHERE email = 'admin@mourden.co';
UPDATE auth.users SET encrypted_password = '${hash}' WHERE email = 'staff1@mourden.co';
UPDATE auth.users SET encrypted_password = '${hash}' WHERE email = 'staff2@mourden.co';
UPDATE auth.users SET encrypted_password = '${hash}' WHERE email = 'staff3@mourden.co';
`);
