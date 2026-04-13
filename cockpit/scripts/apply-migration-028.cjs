const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: 'db.hwiyvpfaolmasqchqwsa.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Nejisasuke#7',
  ssl: { rejectUnauthorized: false }
};

async function applyMigration028() {
  const client = new Client(DB_CONFIG);

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected\n');

    const migrationPath = path.join(__dirname, '../supabase/migrations/028_system_logs.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Applying migration 028_system_logs.sql...\n');

    await client.query(sql);

    console.log('✅ Migration 028 applied successfully!\n');

    // Test the functions
    console.log('🧪 Testing RPC functions...');

    const tests = [
      { fn: 'get_error_count(1)', desc: 'Error count' },
      { fn: 'get_agent_stats(30)', desc: 'Agent stats' },
      { fn: 'get_recent_logs(10)', desc: 'Recent logs' },
      { fn: 'get_business_stats(30)', desc: 'Business stats' }
    ];

    for (const test of tests) {
      try {
        await client.query(`SELECT ${test.fn}`);
        console.log(`  ✅ ${test.desc} OK`);
      } catch (e) {
        console.log(`  ❌ ${test.desc} FAILED: ${e.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration028();
