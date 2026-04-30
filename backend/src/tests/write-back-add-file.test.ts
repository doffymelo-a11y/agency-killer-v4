/**
 * Test: Write-Back ADD_FILE Fix
 * Validates that ADD_FILE commands are correctly saved to project_files table
 */

import { executeWriteBackCommands } from '../shared/write-back.processor.js';
import { supabaseAdmin } from '../services/supabase.service.js';
import type { WriteBackCommand } from '../types/api.types.js';

// Test project ID (from setup-test-env.js)
const TEST_PROJECT_ID = '0eac446e-8fab-4725-b691-48e51c2130d1';
const TEST_USER_ID = '5ac7de9b-6355-4dc5-90c8-2440f83a29ba';

/**
 * Test 1: ADD_FILE with complete fields
 */
async function test1_CompleteFields() {
  console.log('\n🧪 Test 1: ADD_FILE with complete fields');

  const command: WriteBackCommand = {
    type: 'ADD_FILE',
    agent_id: 'milo',
    task_id: '3e083136-6f5a-4528-83b6-c4d0140312b7',
    file: {
      filename: 'ad-creative-001.png',
      url: 'https://res.cloudinary.com/hive-os/image/upload/v1234567890/test-image.png',
      file_type: 'image',
      mime_type: 'image/png',
      size_bytes: 245678,
      tags: ['milo', 'ad_creative', 'meta_ads'],
      metadata: {
        width: 1080,
        height: 1080,
        format: 'square',
      },
    },
  };

  const successCount = await executeWriteBackCommands([command], TEST_PROJECT_ID, TEST_USER_ID);

  if (successCount === 1) {
    console.log('✅ File command executed successfully');

    // Verify file was inserted
    const { data, error } = await supabaseAdmin
      .from('project_files')
      .select('*')
      .eq('filename', 'ad-creative-001.png')
      .eq('project_id', TEST_PROJECT_ID)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      console.log('✅ File verified in database');
      console.log(`   - Filename: ${data.filename}`);
      console.log(`   - Agent: ${data.agent_id}`);
      console.log(`   - Type: ${data.file_type}`);
      console.log(`   - MIME: ${data.mime_type}`);
      console.log(`   - Size: ${data.size_bytes} bytes`);
      console.log(`   - Tags: ${data.tags?.join(', ')}`);
      return true;
    } else {
      console.error('❌ File not found in database:', error);
      return false;
    }
  } else {
    console.error('❌ File command failed');
    return false;
  }
}

/**
 * Test 2: ADD_FILE with legacy fields (backward compatibility)
 */
async function test2_LegacyFields() {
  console.log('\n🧪 Test 2: ADD_FILE with legacy fields (backward compatibility)');

  const command: WriteBackCommand = {
    type: 'ADD_FILE',
    agent_id: 'luna',
    file: {
      name: 'seo-report.pdf', // Legacy field
      url: 'https://res.cloudinary.com/hive-os/raw/upload/v1234567890/test-report.pdf',
      type: 'document', // Legacy field
      size: 512000, // Legacy field (should be size_bytes)
    },
  };

  const successCount = await executeWriteBackCommands([command], TEST_PROJECT_ID, TEST_USER_ID);

  if (successCount === 1) {
    console.log('✅ File command executed (legacy fields)');

    // Verify file was inserted with mapped fields
    const { data, error } = await supabaseAdmin
      .from('project_files')
      .select('*')
      .eq('filename', 'seo-report.pdf')
      .eq('project_id', TEST_PROJECT_ID)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      console.log('✅ File verified with field mapping');
      console.log(`   - Filename: ${data.filename} (from name)`);
      console.log(`   - Type: ${data.file_type} (from type)`);
      console.log(`   - Size: ${data.size_bytes} (from size)`);
      console.log(`   - MIME: ${data.mime_type} (inferred: ${data.mime_type})`);
      console.log(`   - Agent: ${data.agent_id} (from command.agent_id)`);
      return true;
    } else {
      console.error('❌ File not found in database:', error);
      return false;
    }
  } else {
    console.error('❌ File command failed');
    return false;
  }
}

/**
 * Test 3: ADD_FILE without agent_id (uses orchestrator)
 */
async function test3_NoAgentId() {
  console.log('\n🧪 Test 3: ADD_FILE without agent_id (fallback to orchestrator)');

  const command: WriteBackCommand = {
    type: 'ADD_FILE',
    file: {
      filename: 'generated-report.json',
      url: 'https://res.cloudinary.com/hive-os/raw/upload/v1234567890/test-data.json',
      file_type: 'data',
      size_bytes: 12345,
    },
  };

  const successCount = await executeWriteBackCommands([command], TEST_PROJECT_ID, TEST_USER_ID);

  if (successCount === 1) {
    console.log('✅ File command executed without agent_id');

    // Verify file has orchestrator as agent_id
    const { data, error } = await supabaseAdmin
      .from('project_files')
      .select('*')
      .eq('filename', 'generated-report.json')
      .eq('project_id', TEST_PROJECT_ID)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      console.log('✅ File verified with default agent_id');
      console.log(`   - Agent: ${data.agent_id} (should be "orchestrator")`);

      if (data.agent_id === 'orchestrator') {
        console.log('✅ Fallback to orchestrator works correctly');
        return true;
      } else {
        console.error('❌ agent_id not set to orchestrator');
        return false;
      }
    } else {
      console.error('❌ File not found in database:', error);
      return false;
    }
  } else {
    console.error('❌ File command failed');
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 WRITE-BACK ADD_FILE FIX - VALIDATION TESTS');
  console.log('='.repeat(70));

  const results = {
    passed: 0,
    failed: 0,
  };

  // Test 1
  if (await test1_CompleteFields()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 2
  if (await test2_LegacyFields()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 3
  if (await test3_NoAgentId()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.passed + results.failed}`);

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Write-back ADD_FILE fix is working correctly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch((err) => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
