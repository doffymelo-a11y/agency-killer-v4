#!/usr/bin/env node

/**
 * Script to apply database migrations to Supabase via SQL Editor API
 * Usage: node scripts/apply-migrations.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found');
  process.exit(1);
}

async function applyMigration(sqlFilePath) {
  try {
    console.log(`\n📄 Reading migration: ${sqlFilePath}`);
    const sql = readFileSync(sqlFilePath, 'utf-8');

    console.log('🚀 Executing migration via Supabase REST API...');
    console.log('');
    console.log('⚠️  ATTENTION: This script cannot apply migrations automatically.');
    console.log('');
    console.log('Please apply the migration manually via Supabase Dashboard:');
    console.log('');
    console.log('1. Open: https://supabase.com/dashboard/project/hwiyvpfaolmasqchqwsa/sql/new');
    console.log('');
    console.log('2. Copy the content from:');
    console.log('   ' + sqlFilePath);
    console.log('');
    console.log('3. Paste it in the SQL Editor');
    console.log('');
    console.log('4. Click "Run"');
    console.log('');
    console.log('5. Expected duration: ~10 seconds');
    console.log('');

    // Show first 20 lines as preview
    const lines = sql.split('\n').slice(0, 20);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('PREVIEW (first 20 lines):');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(lines.join('\n'));
    console.log('...');
    console.log('');
    console.log('Total lines:', sql.split('\n').length);
    console.log('');

    return false; // Manual action required

  } catch (error) {
    console.error('❌ Error reading migration file:', error.message);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('THE HIVE OS V4 - Database Migration Script');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const migrationPath = join(__dirname, '../supabase/migrations/APPLY_NOW_security_migrations.sql');

  const success = await applyMigration(migrationPath);

  if (success) {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ ALL MIGRATIONS APPLIED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('Next steps:');
    console.log('1. Verify RLS policies: Check Supabase Dashboard > Authentication > Policies');
    console.log('2. Backfill user_id for existing data');
    console.log('3. Test multi-tenant isolation\n');
  } else {
    console.error('\n❌ Migration failed. Please check the error above.\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
