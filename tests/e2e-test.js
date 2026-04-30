// ============================================
// THE HIVE OS V5 - End-to-End Tests
// Tests critiques avant production
// ============================================

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

// Load environment
dotenv.config({ path: '../backend/.env' });

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3457';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Test user credentials
const TEST_EMAIL = 'e2etest@thehive.com';
const TEST_PASSWORD = 'E2ETest2026!';

let authToken = null;
let userId = null;
let projectId = null;
let taskId = null;

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: [],
};

// ============================================
// Helper Functions
// ============================================

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (details) console.log(`   ${details}`);

  if (status === 'PASS') {
    results.passed++;
  } else {
    results.failed++;
    results.errors.push({ test: name, details });
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// Test 1: Auth Flow
// login → token → authenticated request → logout
// ============================================

async function test1_AuthFlow() {
  console.log('\n🔐 Test 1: Auth Flow');

  try {
    // Login
    const loginRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (loginRes.status === 200 && loginRes.data.token) {
      authToken = loginRes.data.token;
      userId = loginRes.data.user.id;
      logTest('Login successful', 'PASS', `Token received: ${authToken.slice(0, 20)}...`);
    } else {
      logTest('Login failed', 'FAIL', `Status: ${loginRes.status}`);
      return;
    }

    // Authenticated request
    const profileRes = await axios.get(`${BACKEND_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (profileRes.status === 200 && profileRes.data.email === TEST_EMAIL) {
      logTest('Authenticated request successful', 'PASS');
    } else {
      logTest('Authenticated request failed', 'FAIL');
    }

    // Logout
    const logoutRes = await axios.post(
      `${BACKEND_URL}/api/auth/logout`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (logoutRes.status === 200) {
      logTest('Logout successful', 'PASS');
    } else {
      logTest('Logout failed', 'FAIL');
    }
  } catch (error) {
    logTest('Auth flow error', 'FAIL', error.message);
  }
}

// ============================================
// Test 2: Genesis Flow
// Create project "Meta Ads" → verify tasks generated
// ============================================

async function test2_GenesisFlow() {
  console.log('\n🚀 Test 2: Genesis Flow');

  try {
    const genesisRes = await axios.post(
      `${BACKEND_URL}/api/genesis`,
      {
        projectName: `E2E Test Project ${Date.now()}`,
        brandName: 'Test Brand',
        objectives: ['awareness', 'conversion'],
        platforms: ['meta_ads'],
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (genesisRes.status === 200 && genesisRes.data.projectId) {
      projectId = genesisRes.data.projectId;
      logTest('Genesis project created', 'PASS', `Project ID: ${projectId}`);

      // Wait for tasks to be generated
      await sleep(2000);

      // Verify tasks exist
      const tasksRes = await axios.get(`${BACKEND_URL}/api/projects/${projectId}/board`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (tasksRes.data.tasks && tasksRes.data.tasks.length > 0) {
        taskId = tasksRes.data.tasks[0].id;
        logTest('Tasks generated successfully', 'PASS', `${tasksRes.data.tasks.length} tasks created`);
      } else {
        logTest('No tasks generated', 'FAIL');
      }
    } else {
      logTest('Genesis project creation failed', 'FAIL');
    }
  } catch (error) {
    logTest('Genesis flow error', 'FAIL', error.message);
  }
}

// ============================================
// Test 3: Chat Flow
// Send message to Luna → verify response with tools
// ============================================

async function test3_ChatFlow() {
  console.log('\n💬 Test 3: Chat Flow');

  try {
    const chatRes = await axios.post(
      `${BACKEND_URL}/api/chat`,
      {
        projectId,
        message: 'Analyse mon SEO',
        agentId: 'luna',
        sessionId: randomUUID(),
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 30000, // 30s timeout for AI response
      }
    );

    if (chatRes.status === 200 && chatRes.data.response) {
      logTest('Chat response received', 'PASS', `Response length: ${chatRes.data.response.length} chars`);

      // Check if tools were used
      if (chatRes.data.toolsUsed && chatRes.data.toolsUsed.length > 0) {
        logTest('AI tools used successfully', 'PASS', `Tools: ${chatRes.data.toolsUsed.join(', ')}`);
      } else {
        logTest('No tools used (unexpected)', 'FAIL');
      }
    } else {
      logTest('Chat response failed', 'FAIL');
    }
  } catch (error) {
    logTest('Chat flow error', 'FAIL', error.message);
  }
}

// ============================================
// Test 4: Board Flow
// Change task status → verify write-back
// ============================================

async function test4_BoardFlow() {
  console.log('\n📋 Test 4: Board Flow');

  try {
    if (!taskId) {
      logTest('No task ID available', 'FAIL', 'Skipping board test');
      return;
    }

    const updateRes = await axios.patch(
      `${BACKEND_URL}/api/tasks/${taskId}`,
      {
        status: 'in_progress',
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (updateRes.status === 200) {
      logTest('Task status updated', 'PASS');

      // Verify the update
      const boardRes = await axios.get(`${BACKEND_URL}/api/projects/${projectId}/board`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const updatedTask = boardRes.data.tasks.find((t) => t.id === taskId);
      if (updatedTask && updatedTask.status === 'in_progress') {
        logTest('Write-back verified', 'PASS');
      } else {
        logTest('Write-back verification failed', 'FAIL');
      }
    } else {
      logTest('Task status update failed', 'FAIL');
    }
  } catch (error) {
    logTest('Board flow error', 'FAIL', error.message);
  }
}

// ============================================
// Test 5: Files Flow
// List files → verify response format
// ============================================

async function test5_FilesFlow() {
  console.log('\n📁 Test 5: Files Flow');

  try {
    const filesRes = await axios.get(`${BACKEND_URL}/api/projects/${projectId}/files`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (filesRes.status === 200 && Array.isArray(filesRes.data.files)) {
      logTest('Files list retrieved', 'PASS', `${filesRes.data.files.length} files found`);
    } else {
      logTest('Files list failed', 'FAIL');
    }
  } catch (error) {
    logTest('Files flow error', 'FAIL', error.message);
  }
}

// ============================================
// Test 6: Analytics Flow
// Fetch analytics → verify format
// ============================================

async function test6_AnalyticsFlow() {
  console.log('\n📊 Test 6: Analytics Flow');

  try {
    const analyticsRes = await axios.post(
      `${BACKEND_URL}/api/analytics/fetch`,
      {
        projectId,
        source: 'ga4',
        dateRange: {
          start: '2026-04-01',
          end: '2026-04-28',
          preset: '30d',
        },
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (analyticsRes.status === 200 && analyticsRes.data.data) {
      logTest('Analytics data fetched', 'PASS');

      const { kpis, charts, insights } = analyticsRes.data.data;
      if (Array.isArray(kpis) && Array.isArray(charts) && Array.isArray(insights)) {
        logTest('Analytics format valid', 'PASS');
      } else {
        logTest('Analytics format invalid', 'FAIL');
      }
    } else {
      logTest('Analytics fetch failed', 'FAIL');
    }
  } catch (error) {
    logTest('Analytics flow error', 'FAIL', error.message);
  }
}

// ============================================
// Test 7: Admin Flow
// Access admin dashboard → verify 6 tabs
// ============================================

async function test7_AdminFlow() {
  console.log('\n👑 Test 7: Admin Flow');

  try {
    const adminRes = await axios.get(`${BACKEND_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (adminRes.status === 200) {
      const tabs = ['overview', 'users', 'projects', 'billing', 'support', 'system'];
      const hasAllTabs = tabs.every((tab) => adminRes.data[tab]);

      if (hasAllTabs) {
        logTest('Admin dashboard accessible', 'PASS', '6 tabs present');
      } else {
        logTest('Admin dashboard incomplete', 'FAIL', 'Missing tabs');
      }
    } else {
      logTest('Admin dashboard access failed', 'FAIL');
    }
  } catch (error) {
    if (error.response?.status === 403) {
      logTest('Admin access forbidden (expected for non-admin)', 'PASS');
    } else {
      logTest('Admin flow error', 'FAIL', error.message);
    }
  }
}

// ============================================
// Test 8: Security Flow
// Send request without token → verify 401
// ============================================

async function test8_SecurityFlow() {
  console.log('\n🔒 Test 8: Security Flow');

  try {
    await axios.get(`${BACKEND_URL}/api/projects/${projectId}/board`);
    logTest('Security FAILED - unauthorized request succeeded', 'FAIL');
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Unauthorized access blocked', 'PASS', '401 returned');
    } else {
      logTest('Security check error', 'FAIL', `Unexpected status: ${error.response?.status}`);
    }
  }
}

// ============================================
// Test 9: Rate Limit Flow
// Send 10 rapid requests → verify rate limit
// ============================================

async function test9_RateLimitFlow() {
  console.log('\n🚦 Test 9: Rate Limit Flow');

  try {
    const requests = Array(10).fill(null).map(() =>
      axios.get(`${BACKEND_URL}/api/projects/${projectId}/board`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
    );

    const responses = await Promise.allSettled(requests);
    const rateLimited = responses.some((r) => r.status === 'rejected' && r.reason.response?.status === 429);

    if (rateLimited) {
      logTest('Rate limiting active', 'PASS');
    } else {
      logTest('Rate limiting not detected', 'FAIL', 'May need more requests or different endpoint');
    }
  } catch (error) {
    logTest('Rate limit test error', 'FAIL', error.message);
  }
}

// ============================================
// Test 10: Billing Flow
// Verify usage limits respected
// ============================================

async function test10_BillingFlow() {
  console.log('\n💳 Test 10: Billing Flow');

  try {
    const billingRes = await axios.get(`${BACKEND_URL}/api/billing/usage`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (billingRes.status === 200 && billingRes.data.usage) {
      const { current, limit } = billingRes.data.usage;

      if (typeof current === 'number' && typeof limit === 'number') {
        logTest('Usage tracking active', 'PASS', `${current}/${limit}`);

        if (current <= limit) {
          logTest('Usage within limits', 'PASS');
        } else {
          logTest('Usage exceeded limits', 'FAIL');
        }
      } else {
        logTest('Usage format invalid', 'FAIL');
      }
    } else {
      logTest('Billing usage fetch failed', 'FAIL');
    }
  } catch (error) {
    logTest('Billing flow error', 'FAIL', error.message);
  }
}

// ============================================
// Run All Tests
// ============================================

async function runAllTests() {
  console.log('🧪 THE HIVE OS V5 - End-to-End Tests');
  console.log('='.repeat(50));

  await test1_AuthFlow();
  await test2_GenesisFlow();
  await test3_ChatFlow();
  await test4_BoardFlow();
  await test5_FilesFlow();
  await test6_AnalyticsFlow();
  await test7_AdminFlow();
  await test8_SecurityFlow();
  await test9_RateLimitFlow();
  await test10_BillingFlow();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.passed + results.failed}`);

  if (results.failed > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(({ test, details }) => {
      console.log(`  - ${test}: ${details}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
