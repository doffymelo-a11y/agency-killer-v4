/**
 * Script to add admin role to a user
 * Usage: node scripts/add-admin-role.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addAdminRole(email) {
  console.log(`\n🔍 Looking for user: ${email}\n`);

  // 1. Find user by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('❌ Error listing users:', userError.message);
    return;
  }

  const user = users.users.find(u => u.email === email);

  if (!user) {
    console.log(`❌ User not found with email: ${email}`);
    return;
  }

  console.log(`✅ Found user: ${user.id} (${user.email})\n`);

  // 2. Check if role already exists
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (existingRole) {
    console.log(`📋 Current role: ${existingRole.role}`);

    if (existingRole.role === 'admin' || existingRole.role === 'super_admin') {
      console.log('✅ User already has admin privileges!');
      return;
    }

    // Update to admin
    const { error: updateError } = await supabase
      .from('user_roles')
      .update({ role: 'admin' })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('❌ Error updating role:', updateError.message);
    } else {
      console.log(`\n✅ Role updated to admin for ${user.email}`);
    }
  } else {
    console.log('📋 No existing role found, creating new admin role...');

    // Insert new admin role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'admin'
      });

    if (insertError) {
      console.error('❌ Error inserting role:', insertError.message);
    } else {
      console.log(`\n✅ Admin role added for ${user.email}`);
    }
  }

  console.log('\n🎉 Done! You can now access the admin dashboard at /admin\n');
}

// Run with the target email
addAdminRole('doffymelo@gmail.com')
  .catch(console.error)
  .finally(() => process.exit(0));
