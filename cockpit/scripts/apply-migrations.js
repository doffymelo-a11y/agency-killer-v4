/**
 * Apply Support System Migration using PostgreSQL direct connection
 * Run: node scripts/apply-migrations.js
 */

import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Construct PostgreSQL connection string
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const password = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl || !password) {
  console.error('❌ Missing credentials in .env');
  console.error('   Required: VITE_SUPABASE_URL, SUPABASE_DB_PASSWORD');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
const connectionString = `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

async function applyMigration() {
  console.log('🚀 Applying Migration 017 - Support Tickets System\n');

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const migrationPath = join(__dirname, '../supabase/migrations/017_support_tickets.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📖 Migration file loaded:', migrationPath);
    console.log('📏 SQL length:', migrationSQL.length, 'characters\n');

    console.log('⚙️  Executing migration...\n');

    await client.query('BEGIN');

    try {
      await client.query(migrationSQL);
      await client.query('COMMIT');
      console.log('✅ Migration executed successfully!\n');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

    console.log('🔍 Verifying tables...');

    const { rows: ticketsRows } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('support_tickets', 'support_messages')
      ORDER BY table_name;
    `);

    console.log('✅ Tables created:', ticketsRows.map(r => r.table_name).join(', '));

    const { rows: enumRows } = await client.query(`
      SELECT typname FROM pg_type
      WHERE typname IN ('ticket_status', 'ticket_priority', 'ticket_category', 'message_sender_type')
      ORDER BY typname;
    `);

    console.log('✅ ENUM types created:', enumRows.map(r => r.typname).join(', '));

    const { rows: functionRows } = await client.query(`
      SELECT routine_name FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN ('get_user_unread_ticket_messages', 'get_ticket_stats')
      ORDER BY routine_name;
    `);

    console.log('✅ Functions created:', functionRows.map(r => r.routine_name).join(', '));

    const { rows: policyRows } = await client.query(`
      SELECT tablename, COUNT(*) as policy_count
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename IN ('support_tickets', 'support_messages')
      GROUP BY tablename
      ORDER BY tablename;
    `);

    console.log('✅ RLS policies:');
    policyRows.forEach(row => {
      console.log(`   - ${row.tablename}: ${row.policy_count} policies`);
    });

    console.log('\n🎉 Migration 017 applied successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);

    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Some objects already exist - might be okay if re-running\n');
    } else {
      console.error('\nFull error:', error);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

applyMigration();
