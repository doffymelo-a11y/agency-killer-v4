#!/usr/bin/env node

/**
 * Test Admin Routes
 * Tests all admin dashboard endpoints
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL = 'https://hwiyvpfaolmasqchqwsa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3aXl2cGZhb2xtYXNxY2hxd3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTYyOTUsImV4cCI6MjA4NTY3MjI5NX0.oklqiW5gkMQqzTDK4vQPDyLN479qWylwIomitoqalsQ';
const BACKEND_URL = 'http://localhost:3457';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function authenticate() {
  console.log('🔐 Authenticating as doffymelo@gmail.com...');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'doffymelo@gmail.com',
    password: 'Nejisasuke#7'
  });

  if (error) {
    console.error('❌ Auth failed:', error.message);
    process.exit(1);
  }

  console.log('✅ Authenticated successfully');
  return data.session.access_token;
}

function fetchJson(url, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const protocol = urlObj.protocol === 'https:' ? https : require('http');

    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ status: res.statusCode, data });
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${body.substring(0, 100)}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testEndpoint(name, path, token) {
  console.log(`\n📍 Testing ${name}: ${path}`);

  try {
    const { status, data } = await fetchJson(`${BACKEND_URL}${path}`, token);

    if (status === 200 && data.success !== false) {
      console.log(`✅ ${name}: OK (${status})`);
      console.log(`   Response keys: ${Object.keys(data).join(', ')}`);

      if (data.data) {
        if (Array.isArray(data.data)) {
          console.log(`   Data: Array with ${data.data.length} items`);
        } else {
          console.log(`   Data keys: ${Object.keys(data.data).join(', ')}`);
        }
      }

      return { success: true, data };
    } else {
      console.log(`❌ ${name}: FAILED (${status})`);
      console.log(`   Error: ${JSON.stringify(data, null, 2)}`);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`❌ ${name}: EXCEPTION`);
    console.log(`   ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Starting Admin Routes Test Suite\n');
  console.log('═'.repeat(60));

  const token = await authenticate();

  const tests = [
    { name: 'Health Check', path: '/api/admin/health' },
    { name: 'Agent Stats', path: '/api/admin/stats/agents?days_back=30' },
    { name: 'Business Stats', path: '/api/admin/stats/business?days_back=30' },
    { name: 'Recent Logs', path: '/api/admin/logs/recent?limit=20' },
    { name: 'Error Count', path: '/api/admin/logs/error-count?hours_back=1' },
  ];

  const results = [];

  for (const test of tests) {
    const result = await testEndpoint(test.name, test.path, token);
    results.push({ name: test.name, ...result });
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST SUMMARY\n');

  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;

  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}`);
    });
    process.exit(1);
  }

  console.log('\n🎉 All tests passed!');
}

runTests().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});
