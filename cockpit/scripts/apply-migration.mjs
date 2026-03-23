/**
 * Apply Migration 017 - Support Tickets via Supabase direct query
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n🚀 Attempting to apply Migration 017...\n');

try {
  // First check if we can read from support_tickets (will fail if not created yet)
  console.log('🔍 Checking if tables already exist...');

  const { data, error } = await supabase
    .from('support_tickets')
    .select('count')
    .limit(1);

  if (!error) {
    console.log('\n✅ MIGRATION ALREADY APPLIED!');
    console.log('   Tables support_tickets and support_messages already exist.\n');

    console.log('🎯 Next steps:');
    console.log('   1. Configure Cloudinary (if not done):');
    console.log('      Edit cockpit/.env and add:');
    console.log('      VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name');
    console.log('      VITE_CLOUDINARY_UPLOAD_PRESET=your-preset\n');
    console.log('   2. Run: npm run dev');
    console.log('   3. Test at: http://localhost:5173/support\n');
    process.exit(0);
  }

  console.log('⚠️  Tables do not exist yet. Migration needs to be applied.\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  MANUAL MIGRATION REQUIRED');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('Due to Supabase security restrictions, migrations must be applied');
  console.log('through the Supabase Dashboard SQL Editor.\n');

  console.log('📋 QUICK STEPS:\n');

  console.log('1. Open: https://supabase.com/dashboard/project/hwiyvpfaolmasqchqwsa/sql/new\n');

  console.log('2. Copy the migration file content:');
  console.log('   File: cockpit/supabase/migrations/017_support_tickets.sql\n');

  console.log('3. Paste into SQL Editor and click RUN\n');

  console.log('4. Verify success (no errors)\n');

  console.log('5. Run this script again to verify:\n');
  console.log('   node scripts/apply-migration.mjs\n');

  console.log('═══════════════════════════════════════════════════════════════\n');

  // Optionally display the SQL
  const migrationPath = join(__dirname, '../supabase/migrations/017_support_tickets.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration SQL Preview (first 500 chars):\n');
  console.log(sql.substring(0, 500) + '...\n');
  console.log(`   Full length: ${sql.length} characters\n`);

} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
