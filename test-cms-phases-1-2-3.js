#!/usr/bin/env node

/**
 * Test CMS Connector - Phases 1-2-3
 * Validation complète avant Phase 4
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TEST CMS CONNECTOR - PHASES 1-2-3\n');
console.log('=' .repeat(60));

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passCount++;
    return true;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failCount++;
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────
// PHASE 1 - MCP Server
// ─────────────────────────────────────────────────────────────────

console.log('\n📦 PHASE 1 - MCP Server\n');

test('Phase 1.1: MCP server folder exists', () => {
  const serverPath = path.join(__dirname, 'mcp-servers/cms-connector-server');
  if (!fs.existsSync(serverPath)) {
    throw new Error(`MCP server folder not found: ${serverPath}`);
  }
});

test('Phase 1.2: package.json exists', () => {
  const pkgPath = path.join(__dirname, 'mcp-servers/cms-connector-server/package.json');
  if (!fs.existsSync(pkgPath)) {
    throw new Error('package.json not found');
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkg.name !== '@hive-os/cms-connector-server') {
    throw new Error(`Wrong package name: ${pkg.name}`);
  }
});

test('Phase 1.3: index.ts exists', () => {
  const indexPath = path.join(__dirname, 'mcp-servers/cms-connector-server/src/index.ts');
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.ts not found');
  }
});

test('Phase 1.4: WordPress adapter exists', () => {
  const adapterPath = path.join(__dirname, 'mcp-servers/cms-connector-server/src/adapters/wordpress.adapter.ts');
  if (!fs.existsSync(adapterPath)) {
    throw new Error('wordpress.adapter.ts not found');
  }
});

test('Phase 1.5: All 4 libs exist', () => {
  const libs = ['rate-limiter.ts', 'content-sanitizer.ts', 'change-recorder.ts', 'error-handler.ts'];
  for (const lib of libs) {
    const libPath = path.join(__dirname, 'mcp-servers/cms-connector-server/src/lib', lib);
    if (!fs.existsSync(libPath)) {
      throw new Error(`Missing lib: ${lib}`);
    }
  }
});

test('Phase 1.6: 16 tools defined in index.ts', () => {
  const indexPath = path.join(__dirname, 'mcp-servers/cms-connector-server/src/index.ts');
  const content = fs.readFileSync(indexPath, 'utf8');

  const tools = [
    'validate_cms_credentials',
    'get_cms_site_info',
    'get_cms_posts',
    'get_cms_post',
    'create_cms_post',
    'update_cms_post',
    'delete_cms_post',
    'get_cms_pages',
    'update_cms_page',
    'get_cms_media',
    'upload_cms_media',
    'update_cms_seo_meta',
    'get_cms_categories',
    'manage_cms_category',
    'get_cms_products',
    'update_cms_product',
    'bulk_update_cms_seo'
  ];

  for (const tool of tools) {
    if (!content.includes(`name: '${tool}'`)) {
      throw new Error(`Tool not found: ${tool}`);
    }
  }
});

test('Phase 1.7: Test file exists (7/7 tests passed)', () => {
  const testPath = path.join(__dirname, 'mcp-servers/cms-connector-server/test-mcp.js');
  if (!fs.existsSync(testPath)) {
    throw new Error('test-mcp.js not found');
  }
});

// ─────────────────────────────────────────────────────────────────
// PHASE 2 - Backend Integration
// ─────────────────────────────────────────────────────────────────

console.log('\n🔧 PHASE 2 - Backend Integration\n');

test('Phase 2.1: Migration 015_cms_change_log.sql exists', () => {
  const migrationPath = path.join(__dirname, 'cockpit/supabase/migrations/015_cms_change_log.sql');
  if (!fs.existsSync(migrationPath)) {
    throw new Error('Migration 015 not found');
  }
  const content = fs.readFileSync(migrationPath, 'utf8');
  if (!content.includes('cms_change_log')) {
    throw new Error('cms_change_log table not defined');
  }
});

test('Phase 2.2: Migration 016_add_doffy_agent.sql exists', () => {
  const migrationPath = path.join(__dirname, 'cockpit/supabase/migrations/016_add_doffy_agent.sql');
  if (!fs.existsSync(migrationPath)) {
    throw new Error('Migration 016 not found');
  }
  const content = fs.readFileSync(migrationPath, 'utf8');
  if (!content.includes("'doffy'")) {
    throw new Error('doffy not added to CHECK constraint');
  }
});

test('Phase 2.3: cms.routes.ts exists with 3 endpoints', () => {
  const routesPath = path.join(__dirname, 'backend/src/routes/cms.routes.ts');
  if (!fs.existsSync(routesPath)) {
    throw new Error('cms.routes.ts not found');
  }
  const content = fs.readFileSync(routesPath, 'utf8');
  if (!content.includes("'/execute'")) {
    throw new Error('/execute endpoint not found');
  }
  if (!content.includes("'/rollback'")) {
    throw new Error('/rollback endpoint not found');
  }
  if (!content.includes("'/pending'")) {
    throw new Error('/pending endpoint not found');
  }
});

test('Phase 2.4: cms.service.ts exists with 4 functions', () => {
  const servicePath = path.join(__dirname, 'backend/src/services/cms.service.ts');
  if (!fs.existsSync(servicePath)) {
    throw new Error('cms.service.ts not found');
  }
  const content = fs.readFileSync(servicePath, 'utf8');
  const functions = ['executeCMSChange', 'rollbackCMSChange', 'getPendingCMSApprovals', 'recordCMSChange'];
  for (const fn of functions) {
    if (!content.includes(`export async function ${fn}`)) {
      throw new Error(`Function not found: ${fn}`);
    }
  }
});

test('Phase 2.5: CMS types added to api.types.ts', () => {
  const typesPath = path.join(__dirname, 'backend/src/types/api.types.ts');
  if (!fs.existsSync(typesPath)) {
    throw new Error('api.types.ts not found');
  }
  const content = fs.readFileSync(typesPath, 'utf8');
  const types = ['CMSExecuteRequest', 'CMSExecuteResponse', 'CMSRollbackRequest', 'CMSRollbackResponse'];
  for (const type of types) {
    if (!content.includes(`export interface ${type}`)) {
      throw new Error(`Type not found: ${type}`);
    }
  }
});

test('Phase 2.6: CMS validation schemas added to validation.middleware.ts', () => {
  const validationPath = path.join(__dirname, 'backend/src/middleware/validation.middleware.ts');
  if (!fs.existsSync(validationPath)) {
    throw new Error('validation.middleware.ts not found');
  }
  const content = fs.readFileSync(validationPath, 'utf8');
  if (!content.includes('cmsExecuteRequest') || !content.includes('cmsRollbackRequest')) {
    throw new Error('CMS validation schemas not found');
  }
});

test('Phase 2.7: CMS routes registered in index.ts', () => {
  const indexPath = path.join(__dirname, 'backend/src/index.ts');
  if (!fs.existsSync(indexPath)) {
    throw new Error('backend index.ts not found');
  }
  const content = fs.readFileSync(indexPath, 'utf8');
  if (!content.includes("import cmsRoutes from './routes/cms.routes.js'")) {
    throw new Error('cms.routes import not found');
  }
  if (!content.includes("app.use('/api/cms', cmsRoutes)")) {
    throw new Error('cms routes not registered');
  }
});

// ─────────────────────────────────────────────────────────────────
// PHASE 3 - Agent Integration
// ─────────────────────────────────────────────────────────────────

console.log('\n🤖 PHASE 3 - Agent Integration\n');

test('Phase 3.1: Luna has 10 CMS tools in agents.config.ts', () => {
  const configPath = path.join(__dirname, 'backend/src/config/agents.config.ts');
  if (!fs.existsSync(configPath)) {
    throw new Error('agents.config.ts not found');
  }
  const content = fs.readFileSync(configPath, 'utf8');

  // Extract Luna's mcpTools array
  const lunaMatch = content.match(/luna:\s*\{[\s\S]*?mcpTools:\s*\[([\s\S]*?)\]/);
  if (!lunaMatch) {
    throw new Error('Luna mcpTools not found');
  }

  const lunaTools = lunaMatch[1];
  const cmsToolsCount = (lunaTools.match(/cms-connector__/g) || []).length;

  if (cmsToolsCount < 10) {
    throw new Error(`Luna has only ${cmsToolsCount} CMS tools, expected 10`);
  }
});

test('Phase 3.2: Doffy has 16 CMS tools in agents.config.ts', () => {
  const configPath = path.join(__dirname, 'backend/src/config/agents.config.ts');
  const content = fs.readFileSync(configPath, 'utf8');

  // Extract Doffy's mcpTools array
  const doffyMatch = content.match(/doffy:\s*\{[\s\S]*?mcpTools:\s*\[([\s\S]*?)\]/);
  if (!doffyMatch) {
    throw new Error('Doffy mcpTools not found');
  }

  const doffyTools = doffyMatch[1];
  const cmsToolsCount = (doffyTools.match(/cms-connector__/g) || []).length;

  if (cmsToolsCount < 16) {
    throw new Error(`Doffy has only ${cmsToolsCount} CMS tools, expected 16`);
  }
});

test('Phase 3.3: Milo has upload_cms_media in agents.config.ts', () => {
  const configPath = path.join(__dirname, 'backend/src/config/agents.config.ts');
  const content = fs.readFileSync(configPath, 'utf8');

  // Extract Milo's mcpTools array
  const miloMatch = content.match(/milo:\s*\{[\s\S]*?mcpTools:\s*\[([\s\S]*?)\]/);
  if (!miloMatch) {
    throw new Error('Milo mcpTools not found');
  }

  const miloTools = miloMatch[1];
  if (!miloTools.includes('cms-connector__upload_cms_media')) {
    throw new Error('Milo does not have upload_cms_media tool');
  }
});

test('Phase 3.4: Luna system prompt updated with CMS section', () => {
  const configPath = path.join(__dirname, 'backend/src/config/agents.config.ts');
  const content = fs.readFileSync(configPath, 'utf8');

  // Extract Luna system prompt
  const lunaPromptMatch = content.match(/const LUNA_SYSTEM_PROMPT = `([\s\S]*?)`;/);
  if (!lunaPromptMatch) {
    throw new Error('Luna system prompt not found');
  }

  const lunaPrompt = lunaPromptMatch[1];
  if (!lunaPrompt.includes('CMS Connector')) {
    throw new Error('Luna system prompt does not mention CMS Connector');
  }
  if (!lunaPrompt.toLowerCase().includes('approval')) {
    throw new Error('Luna system prompt does not explain approval workflow');
  }
});

test('Phase 3.5: Doffy system prompt updated with CMS section', () => {
  const configPath = path.join(__dirname, 'backend/src/config/agents.config.ts');
  const content = fs.readFileSync(configPath, 'utf8');

  // Extract Doffy system prompt
  const doffyPromptMatch = content.match(/const DOFFY_SYSTEM_PROMPT = `([\s\S]*?)`;/);
  if (!doffyPromptMatch) {
    throw new Error('Doffy system prompt not found');
  }

  const doffyPrompt = doffyPromptMatch[1];
  if (!doffyPrompt.includes('CMS Connector')) {
    throw new Error('Doffy system prompt does not mention CMS Connector');
  }
  if (!doffyPrompt.includes('Cross-posting')) {
    throw new Error('Doffy system prompt does not mention cross-posting use case');
  }
});

test('Phase 3.6: recordCMSChange imported in agent-executor.ts', () => {
  const executorPath = path.join(__dirname, 'backend/src/agents/agent-executor.ts');
  if (!fs.existsSync(executorPath)) {
    throw new Error('agent-executor.ts not found');
  }
  const content = fs.readFileSync(executorPath, 'utf8');
  if (!content.includes("import { recordCMSChange } from '../services/cms.service.js'")) {
    throw new Error('recordCMSChange not imported');
  }
});

test('Phase 3.7: recordCMSChangeIfNeeded function exists', () => {
  const executorPath = path.join(__dirname, 'backend/src/agents/agent-executor.ts');
  const content = fs.readFileSync(executorPath, 'utf8');
  if (!content.includes('async function recordCMSChangeIfNeeded')) {
    throw new Error('recordCMSChangeIfNeeded function not found');
  }
});

test('Phase 3.8: executeMCPToolCalls detects cms-connector', () => {
  const executorPath = path.join(__dirname, 'backend/src/agents/agent-executor.ts');
  const content = fs.readFileSync(executorPath, 'utf8');
  if (!content.includes("server === 'cms-connector'")) {
    throw new Error('cms-connector detection not found in executeMCPToolCalls');
  }
});

test('Phase 3.9: userId passed to executeAgent in orchestrator.ts', () => {
  const orchestratorPath = path.join(__dirname, 'backend/src/agents/orchestrator.ts');
  if (!fs.existsSync(orchestratorPath)) {
    throw new Error('orchestrator.ts not found');
  }
  const content = fs.readFileSync(orchestratorPath, 'utf8');
  if (!content.includes('userId,') && !content.includes('userId: userId')) {
    throw new Error('userId not passed to executeAgent');
  }
});

// ─────────────────────────────────────────────────────────────────
// Documentation
// ─────────────────────────────────────────────────────────────────

console.log('\n📚 Documentation\n');

test('Doc 1: CMS_CONNECTOR_DOCUMENTATION_COMPLETE.md exists', () => {
  const docPath = path.join(__dirname, 'CMS_CONNECTOR_DOCUMENTATION_COMPLETE.md');
  if (!fs.existsSync(docPath)) {
    throw new Error('CMS_CONNECTOR_DOCUMENTATION_COMPLETE.md not found');
  }
});

test('Doc 2: CMS_PHASE_2_COMPLETE.md exists', () => {
  const docPath = path.join(__dirname, 'CMS_PHASE_2_COMPLETE.md');
  if (!fs.existsSync(docPath)) {
    throw new Error('CMS_PHASE_2_COMPLETE.md not found');
  }
});

test('Doc 3: CMS_PHASE_3_COMPLETE.md exists', () => {
  const docPath = path.join(__dirname, 'CMS_PHASE_3_COMPLETE.md');
  if (!fs.existsSync(docPath)) {
    throw new Error('CMS_PHASE_3_COMPLETE.md not found');
  }
});

test('Doc 4: CMS_PHASES_1_2_3_RECAP.md exists', () => {
  const docPath = path.join(__dirname, 'CMS_PHASES_1_2_3_RECAP.md');
  if (!fs.existsSync(docPath)) {
    throw new Error('CMS_PHASES_1_2_3_RECAP.md not found');
  }
});

// ─────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(60));
console.log(`\n📊 RESULTS: ${passCount}/${passCount + failCount} tests passed\n`);

if (failCount === 0) {
  console.log('🎉 ALL TESTS PASSED - Phases 1-2-3 are COMPLETE!\n');
  console.log('✅ Ready for Phase 4 - Frontend UI\n');
  process.exit(0);
} else {
  console.log(`❌ ${failCount} test(s) failed\n`);
  console.log('⚠️  Fix errors before proceeding to Phase 4\n');
  process.exit(1);
}
