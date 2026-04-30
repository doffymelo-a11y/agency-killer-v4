// ============================================
// THE HIVE OS V5 - Setup Test Environment
// Creates test user and project if they don't exist
// ============================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment
dotenv.config({ path: '../backend/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TEST_EMAIL = 'e2etest@thehive.com';
const TEST_PASSWORD = 'E2ETest2026!';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment...\n');

  try {
    // Step 1: Check if test user exists
    console.log(`📧 Checking if test user exists: ${TEST_EMAIL}`);

    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      process.exit(1);
    }

    let testUser = existingUsers.users.find(u => u.email === TEST_EMAIL);

    if (testUser) {
      console.log(`✅ Test user already exists (ID: ${testUser.id})`);
    } else {
      // Create test user
      console.log('📝 Creating test user...');

      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: {
          role: 'user',
          created_for_testing: true
        }
      });

      if (createError) {
        console.error('❌ Error creating test user:', createError.message);
        process.exit(1);
      }

      testUser = newUser.user;
      console.log(`✅ Test user created successfully (ID: ${testUser.id})`);
    }

    // Step 2: Check if test user has a project
    console.log('\n📁 Checking if test project exists...');

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('user_id', testUser.id)
      .limit(1);

    if (projectsError) {
      console.error('❌ Error fetching projects:', projectsError.message);
      process.exit(1);
    }

    let testProject;

    if (projects && projects.length > 0) {
      testProject = projects[0];
      console.log(`✅ Test project already exists (ID: ${testProject.id})`);
      console.log(`   Name: ${testProject.name}`);
      console.log(`   Status: ${testProject.status}`);
    } else {
      // Create test project
      console.log('📝 Creating test project...');

      const { data: newProject, error: createProjectError } = await supabase
        .from('projects')
        .insert({
          user_id: testUser.id,
          name: 'E2E Test Project',
          scope: 'full_scale',
          status: 'in_progress',
          current_phase: 'execution',
          metadata: {
            brand_name: 'Test Brand',
            description: 'Automated testing project - do not delete',
            website: 'https://testbrand.com'
          }
        })
        .select()
        .single();

      if (createProjectError) {
        console.error('❌ Error creating test project:', createProjectError.message);
        process.exit(1);
      }

      testProject = newProject;
      console.log(`✅ Test project created successfully (ID: ${testProject.id})`);
    }

    // Step 3: Create a test task for board testing
    console.log('\n📋 Checking if test tasks exist...');

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, status')
      .eq('project_id', testProject.id)
      .limit(1);

    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError.message);
      process.exit(1);
    }

    if (tasks && tasks.length > 0) {
      console.log(`✅ Test tasks already exist (${tasks.length} task(s))`);
    } else {
      // Create a test task
      console.log('📝 Creating test task...');

      const { data: newTask, error: createTaskError } = await supabase
        .from('tasks')
        .insert({
          project_id: testProject.id,
          title: 'E2E Test Task',
          description: 'Automated testing task',
          status: 'todo',
          assignee: 'luna',
          phase: 'Setup',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
        })
        .select()
        .single();

      if (createTaskError) {
        console.error('❌ Error creating test task:', createTaskError.message);
        process.exit(1);
      }

      console.log(`✅ Test task created successfully (ID: ${newTask.id})`);
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Test environment ready!');
    console.log('='.repeat(50));
    console.log(`\n📧 Test User: ${TEST_EMAIL}`);
    console.log(`🔑 Password: ${TEST_PASSWORD}`);
    console.log(`👤 User ID: ${testUser.id}`);
    console.log(`📁 Project ID: ${testProject.id}`);
    console.log(`\n🚀 You can now run: npm run test:e2e\n`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run setup
setupTestEnvironment();
