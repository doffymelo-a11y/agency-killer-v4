#!/usr/bin/env node

/**
 * Test CMS Connector - Phase 4 Frontend UI
 * Validation complète de l'interface utilisateur
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TEST CMS CONNECTOR - PHASE 4 FRONTEND UI\n');
console.log('='.repeat(60));

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
// PHASE 4.1 - Types CMS
// ─────────────────────────────────────────────────────────────────

console.log('\n📦 PHASE 4.1 - Types CMS\n');

test('Phase 4.1.1: cms.types.ts exists', () => {
  const typesPath = path.join(__dirname, 'cockpit/src/types/cms.types.ts');
  if (!fs.existsSync(typesPath)) {
    throw new Error('cms.types.ts not found');
  }
});

test('Phase 4.1.2: CMSType exported', () => {
  const typesPath = path.join(__dirname, 'cockpit/src/types/cms.types.ts');
  const content = fs.readFileSync(typesPath, 'utf8');
  if (!content.includes("export type CMSType = 'wordpress' | 'shopify' | 'webflow'")) {
    throw new Error('CMSType not correctly exported');
  }
});

test('Phase 4.1.3: CMSCredentials interface exists', () => {
  const typesPath = path.join(__dirname, 'cockpit/src/types/cms.types.ts');
  const content = fs.readFileSync(typesPath, 'utf8');
  if (!content.includes('export interface CMSCredentials')) {
    throw new Error('CMSCredentials interface not found');
  }
});

test('Phase 4.1.4: CMSChange interface exists', () => {
  const typesPath = path.join(__dirname, 'cockpit/src/types/cms.types.ts');
  const content = fs.readFileSync(typesPath, 'utf8');
  if (!content.includes('export interface CMSChange')) {
    throw new Error('CMSChange interface not found');
  }
});

test('Phase 4.1.5: CMSChangeSummary interface exists', () => {
  const typesPath = path.join(__dirname, 'cockpit/src/types/cms.types.ts');
  const content = fs.readFileSync(typesPath, 'utf8');
  if (!content.includes('export interface CMSChangeSummary')) {
    throw new Error('CMSChangeSummary interface not found');
  }
});

// ─────────────────────────────────────────────────────────────────
// PHASE 4.2 - CMSConnectionModal
// ─────────────────────────────────────────────────────────────────

console.log('\n🔧 PHASE 4.2 - CMSConnectionModal\n');

test('Phase 4.2.1: CMSConnectionModal.tsx exists', () => {
  const modalPath = path.join(__dirname, 'cockpit/src/components/modals/CMSConnectionModal.tsx');
  if (!fs.existsSync(modalPath)) {
    throw new Error('CMSConnectionModal.tsx not found');
  }
});

test('Phase 4.2.2: CMSConnectionModal has 3 tabs', () => {
  const modalPath = path.join(__dirname, 'cockpit/src/components/modals/CMSConnectionModal.tsx');
  const content = fs.readFileSync(modalPath, 'utf8');
  if (!content.includes('wordpress') || !content.includes('shopify') || !content.includes('webflow')) {
    throw new Error('Not all 3 CMS tabs found');
  }
});

test('Phase 4.2.3: testConnection function exists', () => {
  const modalPath = path.join(__dirname, 'cockpit/src/components/modals/CMSConnectionModal.tsx');
  const content = fs.readFileSync(modalPath, 'utf8');
  if (!content.includes('const testConnection = async')) {
    throw new Error('testConnection function not found');
  }
});

test('Phase 4.2.4: saveConnection function exists', () => {
  const modalPath = path.join(__dirname, 'cockpit/src/components/modals/CMSConnectionModal.tsx');
  const content = fs.readFileSync(modalPath, 'utf8');
  if (!content.includes('const saveConnection = async')) {
    throw new Error('saveConnection function not found');
  }
});

test('Phase 4.2.5: MCP Bridge call to validate_cms_credentials', () => {
  const modalPath = path.join(__dirname, 'cockpit/src/components/modals/CMSConnectionModal.tsx');
  const content = fs.readFileSync(modalPath, 'utf8');
  if (!content.includes('validate_cms_credentials')) {
    throw new Error('validate_cms_credentials tool not called');
  }
  if (!content.includes('http://localhost:3456/api/cms-connector/call')) {
    throw new Error('MCP Bridge call not found');
  }
});

test('Phase 4.2.6: Saves to user_integrations', () => {
  const modalPath = path.join(__dirname, 'cockpit/src/components/modals/CMSConnectionModal.tsx');
  const content = fs.readFileSync(modalPath, 'utf8');
  if (!content.includes("from('user_integrations')")) {
    throw new Error('user_integrations save not found');
  }
});

test('Phase 4.2.7: Updates state_flags', () => {
  const modalPath = path.join(__dirname, 'cockpit/src/components/modals/CMSConnectionModal.tsx');
  const content = fs.readFileSync(modalPath, 'utf8');
  if (!content.includes('state_flags')) {
    throw new Error('state_flags update not found');
  }
});

// ─────────────────────────────────────────────────────────────────
// PHASE 4.3 - IntegrationsView CMS Cards
// ─────────────────────────────────────────────────────────────────

console.log('\n🎨 PHASE 4.3 - IntegrationsView CMS Cards\n');

test('Phase 4.3.1: IntegrationsView imports CMSConnectionModal', () => {
  const viewPath = path.join(__dirname, 'cockpit/src/views/IntegrationsView.tsx');
  const content = fs.readFileSync(viewPath, 'utf8');
  if (!content.includes("import CMSConnectionModal from '../components/modals/CMSConnectionModal'")) {
    throw new Error('CMSConnectionModal not imported');
  }
});

test('Phase 4.3.2: IntegrationsView imports cms.types', () => {
  const viewPath = path.join(__dirname, 'cockpit/src/views/IntegrationsView.tsx');
  const content = fs.readFileSync(viewPath, 'utf8');
  if (!content.includes("import type { CMSType } from '../types/cms.types'")) {
    throw new Error('cms.types not imported');
  }
});

test('Phase 4.3.3: wordpress added to IntegrationType', () => {
  const viewPath = path.join(__dirname, 'cockpit/src/views/IntegrationsView.tsx');
  const content = fs.readFileSync(viewPath, 'utf8');
  if (!content.includes("| 'wordpress'")) {
    throw new Error('wordpress not in IntegrationType');
  }
});

test('Phase 4.3.4: shopify added to IntegrationType', () => {
  const viewPath = path.join(__dirname, 'cockpit/src/views/IntegrationsView.tsx');
  const content = fs.readFileSync(viewPath, 'utf8');
  if (!content.includes("| 'shopify'")) {
    throw new Error('shopify not in IntegrationType');
  }
});

test('Phase 4.3.5: WordPress config in INTEGRATIONS_CONFIG', () => {
  const viewPath = path.join(__dirname, 'cockpit/src/views/IntegrationsView.tsx');
  const content = fs.readFileSync(viewPath, 'utf8');
  if (!content.includes("type: 'wordpress'")) {
    throw new Error('WordPress config not found');
  }
  if (!content.includes('Application Password')) {
    throw new Error('WordPress setup guide not found');
  }
});

test('Phase 4.3.6: Shopify config in INTEGRATIONS_CONFIG', () => {
  const viewPath = path.join(__dirname, 'cockpit/src/views/IntegrationsView.tsx');
  const content = fs.readFileSync(viewPath, 'utf8');
  if (!content.includes("type: 'shopify'")) {
    throw new Error('Shopify config not found');
  }
});

test('Phase 4.3.7: Webflow config in INTEGRATIONS_CONFIG', () => {
  const viewPath = path.join(__dirname, 'cockpit/src/views/IntegrationsView.tsx');
  const content = fs.readFileSync(viewPath, 'utf8');
  if (!content.includes("type: 'webflow'")) {
    throw new Error('Webflow config not found');
  }
});

test('Phase 4.3.8: Globe, ShoppingBag, Layout icons imported', () => {
  const viewPath = path.join(__dirname, 'cockpit/src/views/IntegrationsView.tsx');
  const content = fs.readFileSync(viewPath, 'utf8');
  if (!content.includes('Globe') || !content.includes('ShoppingBag') || !content.includes('Layout')) {
    throw new Error('CMS icons not imported');
  }
});

test('Phase 4.3.9: handleConnect detects CMS integrations', () => {
  const viewPath = path.join(__dirname, 'cockpit/src/views/IntegrationsView.tsx');
  const content = fs.readFileSync(viewPath, 'utf8');
  if (!content.includes("['wordpress', 'shopify', 'webflow'].includes(type)")) {
    throw new Error('handleConnect does not detect CMS integrations');
  }
});

test('Phase 4.3.10: CMSConnectionModal rendered in component', () => {
  const viewPath = path.join(__dirname, 'cockpit/src/views/IntegrationsView.tsx');
  const content = fs.readFileSync(viewPath, 'utf8');
  if (!content.includes('<CMSConnectionModal')) {
    throw new Error('CMSConnectionModal not rendered');
  }
});

// ─────────────────────────────────────────────────────────────────
// PHASE 4.4 - CMSChangePreview
// ─────────────────────────────────────────────────────────────────

console.log('\n📋 PHASE 4.4 - CMSChangePreview\n');

test('Phase 4.4.1: CMSChangePreview.tsx exists', () => {
  const previewPath = path.join(__dirname, 'cockpit/src/components/cms/CMSChangePreview.tsx');
  if (!fs.existsSync(previewPath)) {
    throw new Error('CMSChangePreview.tsx not found');
  }
});

test('Phase 4.4.2: fetchPendingChanges function exists', () => {
  const previewPath = path.join(__dirname, 'cockpit/src/components/cms/CMSChangePreview.tsx');
  const content = fs.readFileSync(previewPath, 'utf8');
  if (!content.includes('const fetchPendingChanges = async')) {
    throw new Error('fetchPendingChanges function not found');
  }
});

test('Phase 4.4.3: Queries cms_change_log table', () => {
  const previewPath = path.join(__dirname, 'cockpit/src/components/cms/CMSChangePreview.tsx');
  const content = fs.readFileSync(previewPath, 'utf8');
  if (!content.includes("from('cms_change_log')")) {
    throw new Error('cms_change_log query not found');
  }
});

test('Phase 4.4.4: Filters requires_approval = true', () => {
  const previewPath = path.join(__dirname, 'cockpit/src/components/cms/CMSChangePreview.tsx');
  const content = fs.readFileSync(previewPath, 'utf8');
  if (!content.includes("eq('requires_approval', true)")) {
    throw new Error('requires_approval filter not found');
  }
});

test('Phase 4.4.5: handleApprove function exists', () => {
  const previewPath = path.join(__dirname, 'cockpit/src/components/cms/CMSChangePreview.tsx');
  const content = fs.readFileSync(previewPath, 'utf8');
  if (!content.includes('const handleApprove = async')) {
    throw new Error('handleApprove function not found');
  }
});

test('Phase 4.4.6: handleRollback function exists', () => {
  const previewPath = path.join(__dirname, 'cockpit/src/components/cms/CMSChangePreview.tsx');
  const content = fs.readFileSync(previewPath, 'utf8');
  if (!content.includes('const handleRollback = async')) {
    throw new Error('handleRollback function not found');
  }
});

test('Phase 4.4.7: Imports CMSChangeCard', () => {
  const previewPath = path.join(__dirname, 'cockpit/src/components/cms/CMSChangePreview.tsx');
  const content = fs.readFileSync(previewPath, 'utf8');
  if (!content.includes("import CMSChangeCard from './CMSChangeCard'")) {
    throw new Error('CMSChangeCard not imported');
  }
});

// ─────────────────────────────────────────────────────────────────
// PHASE 4.5 - CMSChangeCard
// ─────────────────────────────────────────────────────────────────

console.log('\n🎴 PHASE 4.5 - CMSChangeCard\n');

test('Phase 4.5.1: CMSChangeCard.tsx exists', () => {
  const cardPath = path.join(__dirname, 'cockpit/src/components/cms/CMSChangeCard.tsx');
  if (!fs.existsSync(cardPath)) {
    throw new Error('CMSChangeCard.tsx not found');
  }
});

test('Phase 4.5.2: CMSChangeCardProps interface exists', () => {
  const cardPath = path.join(__dirname, 'cockpit/src/components/cms/CMSChangeCard.tsx');
  const content = fs.readFileSync(cardPath, 'utf8');
  if (!content.includes('interface CMSChangeCardProps')) {
    throw new Error('CMSChangeCardProps interface not found');
  }
});

test('Phase 4.5.3: CMS_ICONS constant with 3 CMS types', () => {
  const cardPath = path.join(__dirname, 'cockpit/src/components/cms/CMSChangeCard.tsx');
  const content = fs.readFileSync(cardPath, 'utf8');
  if (!content.includes('const CMS_ICONS')) {
    throw new Error('CMS_ICONS constant not found');
  }
  const cmsIconsMatch = content.match(/const CMS_ICONS[\s\S]*?};/);
  if (!cmsIconsMatch) {
    throw new Error('CMS_ICONS not properly defined');
  }
  const cmsIconsContent = cmsIconsMatch[0];
  if (!cmsIconsContent.includes('wordpress') || !cmsIconsContent.includes('shopify') || !cmsIconsContent.includes('webflow')) {
    throw new Error('CMS_ICONS does not contain all 3 CMS types');
  }
});

test('Phase 4.5.4: ACTION_COLORS constant with create/update/delete', () => {
  const cardPath = path.join(__dirname, 'cockpit/src/components/cms/CMSChangeCard.tsx');
  const content = fs.readFileSync(cardPath, 'utf8');
  if (!content.includes('const ACTION_COLORS')) {
    throw new Error('ACTION_COLORS constant not found');
  }
  if (!content.includes('create:') || !content.includes('update:') || !content.includes('delete:')) {
    throw new Error('ACTION_COLORS does not contain all action types');
  }
});

test('Phase 4.5.5: Diff viewer shows before/after', () => {
  const cardPath = path.join(__dirname, 'cockpit/src/components/cms/CMSChangeCard.tsx');
  const content = fs.readFileSync(cardPath, 'utf8');
  if (!content.includes('diff.before') && !content.includes('diff.after')) {
    throw new Error('Diff viewer does not show before/after');
  }
});

test('Phase 4.5.6: Approve and Rollback buttons exist', () => {
  const cardPath = path.join(__dirname, 'cockpit/src/components/cms/CMSChangeCard.tsx');
  const content = fs.readFileSync(cardPath, 'utf8');
  if (!content.includes('onApprove') || !content.includes('onRollback')) {
    throw new Error('Approve or Rollback buttons not found');
  }
});

test('Phase 4.5.7: Displays agent metadata', () => {
  const cardPath = path.join(__dirname, 'cockpit/src/components/cms/CMSChangeCard.tsx');
  const content = fs.readFileSync(cardPath, 'utf8');
  if (!content.includes('executed_by_agent')) {
    throw new Error('Agent metadata not displayed');
  }
});

// ─────────────────────────────────────────────────────────────────
// PHASE 4.6 - TypeScript Compilation
// ─────────────────────────────────────────────────────────────────

console.log('\n🔍 PHASE 4.6 - TypeScript Compilation\n');

test('Phase 4.6.1: TypeScript compiles without errors', () => {
  const { execSync } = require('child_process');
  try {
    execSync('cd cockpit && npx tsc --noEmit', {
      cwd: __dirname,
      stdio: 'pipe',
      encoding: 'utf8'
    });
  } catch (error) {
    throw new Error(`TypeScript compilation failed: ${error.stdout || error.message}`);
  }
});

// ─────────────────────────────────────────────────────────────────
// Documentation
// ─────────────────────────────────────────────────────────────────

console.log('\n📚 Documentation\n');

test('Doc 1: CMS_PHASE_4_PLAN.md exists', () => {
  const docPath = path.join(__dirname, 'CMS_PHASE_4_PLAN.md');
  if (!fs.existsSync(docPath)) {
    throw new Error('CMS_PHASE_4_PLAN.md not found');
  }
});

test('Doc 2: CMS_PHASE_4_COMPLETE.md exists', () => {
  const docPath = path.join(__dirname, 'CMS_PHASE_4_COMPLETE.md');
  if (!fs.existsSync(docPath)) {
    throw new Error('CMS_PHASE_4_COMPLETE.md not found');
  }
});

test('Doc 3: CMS_PHASE_4_COMPLETE.md has workflow section', () => {
  const docPath = path.join(__dirname, 'CMS_PHASE_4_COMPLETE.md');
  const content = fs.readFileSync(docPath, 'utf8');
  if (!content.includes('Workflow Complet CMS')) {
    throw new Error('Workflow section not found in documentation');
  }
});

// ─────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(60));
console.log(`\n📊 RESULTS: ${passCount}/${passCount + failCount} tests passed\n`);

if (failCount === 0) {
  console.log('🎉 ALL TESTS PASSED - Phase 4 is COMPLETE!\n');
  console.log('✅ Frontend UI is ready for integration\n');
  console.log('Next steps:');
  console.log('  1. Start MCP Bridge: cd mcp-bridge && npm start');
  console.log('  2. Start backend (n8n workflows)');
  console.log('  3. Start frontend: cd cockpit && npm run dev');
  console.log('  4. Test WordPress connection in IntegrationsView');
  console.log('  5. Test CMS change approval workflow\n');
  process.exit(0);
} else {
  console.log(`❌ ${failCount} test(s) failed\n`);
  console.log('⚠️  Fix errors before proceeding\n');
  process.exit(1);
}
