/**
 * Apply migration 030 - Super Admin Backoffice
 * Run with: node scripts/apply-migration-030.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'Nejisasuke#7';
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hwiyvpfaolmasqchqwsa.supabase.co';

console.log('🔍 Debug info:');
console.log('  Password loaded:', dbPassword ? `${dbPassword.substring(0, 3)}...` : 'NOT LOADED');
console.log('  Project ref:', supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1]);

// Extract project ref from Supabase URL
const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project ref from SUPABASE_URL');
  process.exit(1);
}

// URL-encode the password (# needs to be %23)
const encodedPassword = encodeURIComponent(dbPassword);

const connectionString = `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;

async function applyMigration() {
  console.log('📦 Loading migration file...');

  const migrationPath = path.join(__dirname, '../supabase/migrations/030_super_admin_backoffice.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('🚀 Connecting to database...');

  // Use connection pooler (port 6543) for better external access
  const client = new Client({
    host: `aws-0-us-east-1.pooler.supabase.com`,
    port: 6543,
    database: 'postgres',
    user: 'postgres.hwiyvpfaolmasqchqwsa',
    password: dbPassword,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('🚀 Applying migration 030...');

    // Execute the SQL
    const result = await client.query(sql);

    console.log('✅ Migration 030 applied successfully!');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('👋 Database connection closed');
  }

  process.exit(0);
}

applyMigration();
