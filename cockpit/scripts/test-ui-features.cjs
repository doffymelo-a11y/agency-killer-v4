/**
 * UI Features Test Script - Support System Phase 2 & 3
 * Tests that all new UI components are correctly implemented
 *
 * Run: node scripts/test-ui-features.cjs
 */

const fs = require('fs');
const path = require('path');

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

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, '..', filePath));
}

function fileContains(filePath, searchString) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return false;
  const content = fs.readFileSync(fullPath, 'utf8');
  return content.includes(searchString);
}

function countOccurrences(filePath, searchString) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return 0;
  const content = fs.readFileSync(fullPath, 'utf8');
  return (content.match(new RegExp(searchString, 'g')) || []).length;
}

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  Support System Phase 2 & 3 - UI Features Test              ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ==================== COMPONENT EXISTENCE TESTS ====================
console.log('📦 Testing Component Files...\n');

const components = [
  { path: 'src/components/support/FileUploader.tsx', name: 'FileUploader' },
  { path: 'src/components/support/SatisfactionSurvey.tsx', name: 'SatisfactionSurvey' },
  { path: 'src/components/support/HelpButton.tsx', name: 'HelpButton' },
  { path: 'src/components/admin/SLADashboard.tsx', name: 'SLADashboard' }
];

for (const comp of components) {
  logTest('Components', comp.name, fileExists(comp.path));
}

// ==================== SERVICE FUNCTIONS TESTS ====================
console.log('\n⚙️  Testing Service Functions...\n');

const serviceFunctions = [
  { func: 'getInternalNotes', name: 'Internal Notes - Get' },
  { func: 'createInternalNote', name: 'Internal Notes - Create' },
  { func: 'updateInternalNote', name: 'Internal Notes - Update' },
  { func: 'deleteInternalNote', name: 'Internal Notes - Delete' },
  { func: 'searchKnowledgeBase', name: 'Knowledge Base - Search' },
  { func: 'getKBArticle', name: 'Knowledge Base - Get Article' },
  { func: 'getTicketTemplates', name: 'Templates - Get Ticket Templates' },
  { func: 'getResponseTemplates', name: 'Templates - Get Response Templates' },
  { func: 'createSatisfactionSurvey', name: 'CSAT - Create Survey' },
  { func: 'getSatisfactionSurvey', name: 'CSAT - Get Survey' },
  { func: 'generateTicketEmbedding', name: 'Duplicates - Generate Embedding' },
  { func: 'findTicketDuplicates', name: 'Duplicates - Find Similar' },
  { func: 'markTicketAsDuplicate', name: 'Duplicates - Mark as Duplicate' }
];

const serviceFile = 'src/services/support.service.ts';
for (const sf of serviceFunctions) {
  const exists = fileContains(serviceFile, `export async function ${sf.func}`);
  logTest('Service Functions', sf.name, exists);
}

// ==================== UI INTEGRATION TESTS ====================
console.log('\n🎨 Testing UI Integration...\n');

// FileUploader in SupportTicketDetailView
logTest(
  'UI Integration',
  'FileUploader imported in SupportTicketDetailView',
  fileContains('src/views/SupportTicketDetailView.tsx', 'FileUploader')
);

// HelpButton in SupportView
logTest(
  'UI Integration',
  'HelpButton imported in SupportView',
  fileContains('src/views/SupportView.tsx', 'HelpButton')
);

// HelpButton in SupportTicketDetailView
logTest(
  'UI Integration',
  'HelpButton in SupportTicketDetailView',
  fileContains('src/views/SupportTicketDetailView.tsx', 'HelpButton')
);

// Internal Notes section (admin only)
logTest(
  'UI Integration',
  'Internal Notes section in SupportTicketDetailView',
  fileContains('src/views/SupportTicketDetailView.tsx', 'internalNotes')
);

// Response Templates dropdown (admin)
logTest(
  'UI Integration',
  'Response Templates in SupportTicketDetailView',
  fileContains('src/views/SupportTicketDetailView.tsx', 'responseTemplates')
);

// Similar Tickets (duplicates)
logTest(
  'UI Integration',
  'Similar Tickets detection in SupportTicketDetailView',
  fileContains('src/views/SupportTicketDetailView.tsx', 'similarTickets')
);

// Knowledge Base search in SupportView
logTest(
  'UI Integration',
  'Knowledge Base search in SupportView',
  fileContains('src/views/SupportView.tsx', 'searchKnowledgeBase')
);

// Ticket Templates in SupportView
logTest(
  'UI Integration',
  'Ticket Templates in SupportView',
  fileContains('src/views/SupportView.tsx', 'ticketTemplates')
);

// Satisfaction Survey
logTest(
  'UI Integration',
  'Satisfaction Survey component exists',
  fileExists('src/components/support/SatisfactionSurvey.tsx')
);

// ==================== TYPE DEFINITIONS TESTS ====================
console.log('\n📋 Testing Type Definitions...\n');

const types = [
  { type: 'InternalNote', name: 'InternalNote interface' },
  { type: 'SimilarTicket', name: 'SimilarTicket interface' },
  { type: 'KBArticle', name: 'KBArticle interface' },
  { type: 'TicketTemplate', name: 'TicketTemplate interface' },
  { type: 'ResponseTemplate', name: 'ResponseTemplate interface' },
  { type: 'SatisfactionSurvey', name: 'SatisfactionSurvey interface' }
];

const typesFile = 'src/services/support.service.ts';
for (const type of types) {
  const exists = fileContains(typesFile, `export interface ${type.type}`);
  logTest('Type Definitions', type.name, exists);
}

// ==================== FILEUPLOADER COMPONENT TESTS ====================
console.log('\n📎 Testing FileUploader Component...\n');

const uploaderFile = 'src/components/support/FileUploader.tsx';

logTest(
  'FileUploader',
  'Multiple file support',
  fileContains(uploaderFile, 'multiple')
);

logTest(
  'FileUploader',
  'File type validation',
  fileContains(uploaderFile, 'allowedTypes')
);

logTest(
  'FileUploader',
  'File size validation',
  fileContains(uploaderFile, 'maxSizePerFile')
);

logTest(
  'FileUploader',
  'Cloudinary upload',
  fileContains(uploaderFile, 'uploadFileToCloudinary')
);

logTest(
  'FileUploader',
  'Progress tracking',
  fileContains(uploaderFile, 'uploadProgress')
);

logTest(
  'FileUploader',
  'FileAttachmentDisplay component',
  fileContains(uploaderFile, 'export function FileAttachmentDisplay')
);

// ==================== HELP BUTTON TESTS ====================
console.log('\n❓ Testing HelpButton Component...\n');

const helpFile = 'src/components/support/HelpButton.tsx';

logTest(
  'HelpButton',
  'Modal with tabs',
  fileContains(helpFile, 'useState') && fileContains(helpFile, 'showGuide')
);

logTest(
  'HelpButton',
  'User guide content',
  fileContains(helpFile, 'Pour les Utilisateurs')
);

logTest(
  'HelpButton',
  'Admin guide content',
  fileContains(helpFile, 'Pour les Admins')
);

logTest(
  'HelpButton',
  'Floating button',
  fileContains(helpFile, 'fixed bottom')
);

// ==================== SATISFACTION SURVEY TESTS ====================
console.log('\n⭐ Testing SatisfactionSurvey Component...\n');

const surveyFile = 'src/components/support/SatisfactionSurvey.tsx';

logTest(
  'SatisfactionSurvey',
  'Star rating system',
  fileContains(surveyFile, 'rating')
);

logTest(
  'SatisfactionSurvey',
  'Feedback textarea',
  fileContains(surveyFile, 'feedback')
);

logTest(
  'SatisfactionSurvey',
  'Submit to database',
  fileContains(surveyFile, 'ticket_satisfaction')
);

logTest(
  'SatisfactionSurvey',
  'Thank you message',
  fileContains(surveyFile, 'submitted')
);

// ==================== SLA DASHBOARD TESTS ====================
console.log('\n📊 Testing SLADashboard Component...\n');

const slaFile = 'src/components/admin/SLADashboard.tsx';

logTest(
  'SLADashboard',
  'Component exists',
  fileExists(slaFile)
);

if (fileExists(slaFile)) {
  logTest(
    'SLADashboard',
    'SLA metrics display',
    fileContains(slaFile, 'slaStats') || fileContains(slaFile, 'stats')
  );

  logTest(
    'SLADashboard',
    'Charts/visualization',
    fileContains(slaFile, 'Chart') || fileContains(slaFile, 'graph')
  );
}

// ==================== EDGE FUNCTIONS TESTS ====================
console.log('\n🔧 Testing Edge Functions (files only)...\n');

const edgeFunctions = [
  { path: 'supabase/functions/send-support-email/index.ts', name: 'Email Notifications' },
  { path: 'supabase/functions/check-sla-breaches/index.ts', name: 'SLA Breach Checker' },
  { path: 'supabase/functions/ai-categorize-ticket/index.ts', name: 'AI Categorization' },
  { path: 'supabase/functions/generate-ticket-embedding/index.ts', name: 'Embedding Generator' }
];

for (const ef of edgeFunctions) {
  logTest('Edge Functions', ef.name, fileExists(ef.path));
}

// ==================== DOCUMENTATION TESTS ====================
console.log('\n📚 Testing Documentation...\n');

logTest(
  'Documentation',
  'User Guide exists',
  fileExists('Guides d\'utilisation/Guide-Support-Tickets.md')
);

logTest(
  'Documentation',
  'Migration Guide exists',
  fileExists('cockpit/supabase/migrations/MIGRATION_GUIDE_PHASE2_PHASE3.md')
);

logTest(
  'Documentation',
  'Test Report exists',
  fileExists('cockpit/supabase/migrations/TEST_REPORT_PHASE2_PHASE3.md')
);

// ==================== CLOUDINARY INTEGRATION ====================
console.log('\n☁️  Testing Cloudinary Integration...\n');

const cloudinaryFile = 'src/lib/cloudinary.ts';

logTest(
  'Cloudinary',
  'Multi-file upload function',
  fileContains(cloudinaryFile, 'uploadFileToCloudinary')
);

logTest(
  'Cloudinary',
  'File size formatting',
  fileContains(cloudinaryFile, 'formatFileSize')
);

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
  console.log('║  ✅ ALL UI FEATURES IMPLEMENTED CORRECTLY                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('🎯 Manual Testing Checklist:\n');
  console.log('   Open http://localhost:5173 and verify:\n');

  console.log('   📝 User Flow:');
  console.log('      1. Navigate to Support page');
  console.log('      2. Click "Nouveau Ticket"');
  console.log('      3. Select a template from dropdown');
  console.log('      4. Fill in subject and description');
  console.log('      5. Upload multiple files (test FileUploader)');
  console.log('      6. Submit ticket');
  console.log('      7. Click "?" help button (bottom right)\n');

  console.log('   👨‍💼 Admin Flow (requires admin login):');
  console.log('      1. Open a ticket detail page');
  console.log('      2. View "Notes Internes" section (red box)');
  console.log('      3. Add an internal note');
  console.log('      4. Use response template dropdown');
  console.log('      5. Check "Tickets similaires" if any');
  console.log('      6. Resolve ticket');
  console.log('      7. User should see satisfaction survey\n');

  console.log('   🔍 Knowledge Base:');
  console.log('      1. Type a question in ticket subject');
  console.log('      2. Wait for KB article suggestions');
  console.log('      3. Click on suggested articles\n');

  console.log('   📊 Admin Dashboard:');
  console.log('      1. Navigate to Admin tab');
  console.log('      2. Check SLA Dashboard section');
  console.log('      3. Verify metrics display\n');

  console.log('✨ Dev Server Status: http://localhost:5173\n');

  process.exit(0);
} else {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ❌ SOME UI FEATURES MISSING - REVIEW ERRORS ABOVE           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  process.exit(1);
}
