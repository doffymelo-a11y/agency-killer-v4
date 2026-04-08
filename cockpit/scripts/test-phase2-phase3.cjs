/**
 * Comprehensive Test Suite - Support System Phase 2 & 3
 * Tests all database features, functions, triggers, and RLS policies
 *
 * Run: node scripts/test-phase2-phase3.cjs
 */

const { Client } = require('pg');

const DB_CONFIG = {
  host: 'db.hwiyvpfaolmasqchqwsa.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Nejisasuke#7',
  ssl: { rejectUnauthorized: false }
};

let testsPassed = 0;
let testsFailed = 0;

function logTest(category, name, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`   ${icon} [${category}] ${name} - ${status}`);
  if (details && !passed) {
    console.log(`      Details: ${details}`);
  }
  if (passed) testsPassed++;
  else testsFailed++;
}

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Support System Phase 2 & 3 - Comprehensive Test Suite      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const client = new Client(DB_CONFIG);

  try {
    await client.connect();
    console.log('🔌 Connected to database\n');

    // ==================== TABLE EXISTENCE TESTS ====================
    console.log('📦 Testing Table Existence...\n');

    const expectedTables = [
      'email_logs',
      'user_email_preferences',
      'support_internal_notes',
      'ticket_satisfaction',
      'ticket_templates',
      'admin_response_templates',
      'kb_articles'
    ];

    for (const table of expectedTables) {
      const { rows } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [table]);
      logTest('Tables', table, rows[0].exists);
    }

    // ==================== COLUMN TESTS ====================
    console.log('\n📋 Testing New Columns...\n');

    const columnTests = [
      { table: 'support_tickets', column: 'first_response_at' },
      { table: 'support_tickets', column: 'sla_breached' },
      { table: 'support_tickets', column: 'ai_suggested_category' },
      { table: 'support_tickets', column: 'ai_confidence' },
      { table: 'support_tickets', column: 'sentiment' },
      { table: 'support_tickets', column: 'urgency_score' },
      { table: 'support_tickets', column: 'embedding' },
      { table: 'support_tickets', column: 'embedding_generated_at' },
    ];

    for (const test of columnTests) {
      const { rows } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = $1 AND column_name = $2
        )
      `, [test.table, test.column]);
      logTest('Columns', `${test.table}.${test.column}`, rows[0].exists);
    }

    // ==================== EXTENSION TESTS ====================
    console.log('\n🔌 Testing Extensions...\n');

    const { rows: extRows } = await client.query(`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `);
    logTest('Extensions', 'pgvector', extRows.length > 0);

    // ==================== FUNCTION TESTS ====================
    console.log('\n⚙️  Testing Functions...\n');

    const expectedFunctions = [
      'queue_email_notification_on_admin_message',
      'queue_email_notification_on_status_change',
      'calculate_ticket_sla',
      'set_first_response_at',
      'get_tickets_at_risk',
      'update_ticket_ai_analysis',
      'search_kb_articles',
      'find_similar_tickets',
      'find_ticket_duplicates',
      'mark_ticket_as_duplicate',
      'get_csat_summary',
      'increment_template_usage',
      'increment_response_template_usage'
    ];

    for (const func of expectedFunctions) {
      const { rows } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.routines
          WHERE routine_schema = 'public' AND routine_name = $1
        )
      `, [func]);
      logTest('Functions', func, rows[0].exists);
    }

    // ==================== TRIGGER TESTS ====================
    console.log('\n⚡ Testing Triggers...\n');

    const expectedTriggers = [
      { table: 'support_messages', trigger: 'after_admin_message_queue_email' },
      { table: 'support_tickets', trigger: 'after_ticket_status_change_queue_email' },
      { table: 'support_messages', trigger: 'trigger_set_first_response_at' },
      { table: 'support_internal_notes', trigger: 'trigger_update_internal_note_updated_at' },
      { table: 'kb_articles', trigger: 'trigger_update_kb_article_updated_at' },
      { table: 'ticket_templates', trigger: 'trigger_update_template_updated_at' },
      { table: 'ticket_satisfaction', trigger: 'trigger_update_satisfaction_updated_at' },
      { table: 'admin_response_templates', trigger: 'trigger_update_response_template_updated_at' }
    ];

    for (const test of expectedTriggers) {
      const { rows } = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_trigger
          WHERE tgname = $1 AND tgrelid = $2::regclass
        )
      `, [test.trigger, test.table]);
      logTest('Triggers', `${test.table}.${test.trigger}`, rows[0].exists);
    }

    // ==================== MATERIALIZED VIEW TESTS ====================
    console.log('\n📊 Testing Materialized Views...\n');

    const { rows: mvRows1 } = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_matviews WHERE matviewname = 'ticket_sla_dashboard'
      )
    `);
    logTest('Mat. Views', 'ticket_sla_dashboard', mvRows1[0].exists);

    const { rows: mvRows2 } = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_matviews WHERE matviewname = 'ticket_csat_metrics'
      )
    `);
    logTest('Mat. Views', 'ticket_csat_metrics', mvRows2[0].exists);

    // ==================== RLS POLICY TESTS ====================
    console.log('\n🔒 Testing RLS Policies...\n');

    const tablesWithRLS = [
      'email_logs',
      'user_email_preferences',
      'support_internal_notes',
      'kb_articles',
      'ticket_templates',
      'ticket_satisfaction',
      'admin_response_templates'
    ];

    for (const table of tablesWithRLS) {
      const { rows } = await client.query(`
        SELECT COUNT(*) as count FROM pg_policies
        WHERE schemaname = 'public' AND tablename = $1
      `, [table]);
      const policyCount = parseInt(rows[0].count);
      logTest('RLS Policies', `${table} (${policyCount} policies)`, policyCount > 0);
    }

    // ==================== FUNCTIONAL TESTS ====================
    console.log('\n🧪 Testing Function Execution...\n');

    // Test search_kb_articles
    try {
      const { rows } = await client.query(`
        SELECT * FROM search_kb_articles('pixel tracking', 5)
      `);
      logTest('Func Exec', 'search_kb_articles()', true, `Returned ${rows.length} results`);
    } catch (err) {
      logTest('Func Exec', 'search_kb_articles()', false, err.message);
    }

    // Test get_popular_kb_articles
    try {
      const { rows } = await client.query(`
        SELECT * FROM get_popular_kb_articles(5)
      `);
      logTest('Func Exec', 'get_popular_kb_articles()', true, `Returned ${rows.length} results`);
    } catch (err) {
      logTest('Func Exec', 'get_popular_kb_articles()', false, err.message);
    }

    // Test get_public_templates
    try {
      const { rows } = await client.query(`
        SELECT * FROM get_public_templates()
      `);
      logTest('Func Exec', 'get_public_templates()', true, `Found ${rows.length} templates`);
    } catch (err) {
      logTest('Func Exec', 'get_public_templates()', false, err.message);
    }

    // Test get_response_templates
    try {
      const { rows } = await client.query(`
        SELECT * FROM get_response_templates()
      `);
      logTest('Func Exec', 'get_response_templates()', true, `Found ${rows.length} templates`);
    } catch (err) {
      logTest('Func Exec', 'get_response_templates()', false, err.message);
    }

    // Test get_csat_summary
    try {
      const { rows } = await client.query(`
        SELECT * FROM get_csat_summary(30)
      `);
      logTest('Func Exec', 'get_csat_summary()', rows.length > 0);
    } catch (err) {
      logTest('Func Exec', 'get_csat_summary()', false, err.message);
    }

    // Test get_sla_summary
    try {
      const { rows } = await client.query(`
        SELECT * FROM get_sla_summary(30)
      `);
      logTest('Func Exec', 'get_sla_summary()', rows.length > 0);
    } catch (err) {
      logTest('Func Exec', 'get_sla_summary()', false, err.message);
    }

    // ==================== INDEX TESTS ====================
    console.log('\n🔍 Testing Indexes...\n');

    const expectedIndexes = [
      'idx_email_logs_ticket',
      'idx_email_logs_status',
      'idx_internal_notes_ticket',
      'idx_tickets_first_response',
      'idx_tickets_sla_breached',
      'idx_tickets_ai_confidence',
      'idx_tickets_embedding_cosine',
      'idx_kb_articles_search',
      'idx_satisfaction_ticket',
      'idx_templates_public',
      'idx_response_templates_category'
    ];

    for (const indexName of expectedIndexes) {
      const { rows } = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_indexes WHERE indexname = $1
        )
      `, [indexName]);
      logTest('Indexes', indexName, rows[0].exists);
    }

    // ==================== SEED DATA TESTS ====================
    console.log('\n🌱 Testing Seed Data...\n');

    // Check KB articles seeded
    const { rows: kbRows } = await client.query(`
      SELECT COUNT(*) as count FROM kb_articles
    `);
    logTest('Seed Data', `KB Articles (${kbRows[0].count} seeded)`, parseInt(kbRows[0].count) > 0);

    // Check ticket templates seeded
    const { rows: templateRows } = await client.query(`
      SELECT COUNT(*) as count FROM ticket_templates
    `);
    logTest('Seed Data', `Ticket Templates (${templateRows[0].count} seeded)`, parseInt(templateRows[0].count) > 0);

    // Check response templates seeded
    const { rows: respTemplateRows } = await client.query(`
      SELECT COUNT(*) as count FROM admin_response_templates
    `);
    logTest('Seed Data', `Response Templates (${respTemplateRows[0].count} seeded)`, parseInt(respTemplateRows[0].count) > 0);

    // ==================== DATA INTEGRITY TESTS ====================
    console.log('\n🔐 Testing Data Integrity...\n');

    // Test foreign key constraints
    const { rows: fkRows } = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
      AND table_name IN (
        'email_logs', 'support_internal_notes', 'ticket_satisfaction',
        'ticket_templates', 'admin_response_templates'
      )
    `);
    logTest('Data Integrity', `Foreign Keys (${fkRows[0].count} constraints)`, parseInt(fkRows[0].count) > 0);

    // Test check constraints
    const { rows: checkRows } = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_type = 'CHECK'
      AND table_schema = 'public'
      AND table_name IN ('ticket_satisfaction', 'support_tickets')
    `);
    logTest('Data Integrity', `Check Constraints (${checkRows[0].count} constraints)`, parseInt(checkRows[0].count) > 0);

    // ==================== SUMMARY ====================
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  Test Summary                                                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const total = testsPassed + testsFailed;
    const successRate = ((testsPassed / total) * 100).toFixed(1);

    console.log(`   Total Tests:    ${total}`);
    console.log(`   Passed:         ${testsPassed} (${successRate}%)`);
    console.log(`   Failed:         ${testsFailed}`);
    console.log('');

    if (testsFailed === 0) {
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║  ✅ ALL TESTS PASSED - SYSTEM READY FOR PRODUCTION           ║');
      console.log('╚══════════════════════════════════════════════════════════════╝\n');

      console.log('📝 Remaining Steps:\n');
      console.log('   1. Deploy Edge Functions to Supabase:');
      console.log('      cd supabase/functions');
      console.log('      supabase functions deploy send-support-email');
      console.log('      supabase functions deploy check-sla-breaches');
      console.log('      supabase functions deploy ai-categorize-ticket');
      console.log('      supabase functions deploy generate-ticket-embedding\n');
      console.log('   2. Configure environment variables in Supabase Dashboard:');
      console.log('      - SENDGRID_API_KEY (for email notifications)');
      console.log('      - ANTHROPIC_API_KEY (for AI categorization)');
      console.log('      - OPENAI_API_KEY (for duplicate detection)\n');
      console.log('   3. Test in UI:');
      console.log('      - Create a ticket and verify features');
      console.log('      - Test multi-file upload');
      console.log('      - Test admin internal notes');
      console.log('      - Test knowledge base search');
      console.log('      - Test satisfaction survey\n');
      process.exit(0);
    } else {
      console.log('╔══════════════════════════════════════════════════════════════╗');
      console.log('║  ❌ SOME TESTS FAILED - REVIEW ERRORS ABOVE                  ║');
      console.log('╚══════════════════════════════════════════════════════════════╝\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test suite failed with error:\n');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runTests();
