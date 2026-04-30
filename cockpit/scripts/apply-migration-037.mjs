// Apply migration 037_project_files.sql
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function applyMigration() {
  console.log('📦 Applying migration 037_project_files.sql...\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/037_project_files.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    // Execute migration using RPC (need to use service role)
    // Note: We can't execute raw SQL directly through the Supabase client
    // We need to use postgres connection or split the migration

    // Split migration into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} statements to execute\n`);

    // For this specific migration, we'll use direct postgres connection
    // Using pg library
    const { Client } = await import('pg');

    const client = new Client({
      connectionString: `postgresql://postgres.rvkpjlhlhphmqatyggqy:Nejisasuke%237@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
    });

    await client.connect();
    console.log('✅ Connected to Supabase Postgres\n');

    // Execute full SQL
    await client.query(sql);

    console.log('✅ Migration 037_project_files.sql applied successfully!\n');

    // Verify table exists
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'project_files'
      ) as exists;
    `);

    if (result.rows[0].exists) {
      console.log('✅ Table project_files verified in database');

      // Get table structure
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'project_files'
        ORDER BY ordinal_position;
      `);

      console.log('\n📋 Table structure:');
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
    } else {
      console.error('❌ Table project_files not found after migration');
      process.exit(1);
    }

    await client.end();
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
