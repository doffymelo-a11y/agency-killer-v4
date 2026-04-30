// ============================================
// THE HIVE OS V5 - Artillery Load Test Helpers
// Functions for authentication and test data generation
// ============================================

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in backend/.env');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test user credentials (should exist in your Supabase Auth)
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'loadtest@thehive.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'LoadTest2026!';
const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || null;

/**
 * Generate authentication token for test user
 */
export async function generateAuthToken(context, events, done) {
  try {
    // Sign in test user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    if (error) {
      console.error('Auth error:', error.message);
      return done(error);
    }

    if (!data.session) {
      return done(new Error('No session returned from auth'));
    }

    // Set token and user ID in context
    context.vars.authToken = data.session.access_token;
    context.vars.userId = data.user.id;

    // Set or generate project ID
    if (TEST_PROJECT_ID) {
      context.vars.projectId = TEST_PROJECT_ID;
    } else {
      // Fetch user's first project
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', data.user.id)
        .limit(1)
        .single();

      if (projects) {
        context.vars.projectId = projects.id;
      } else {
        // Create a test project if none exists
        const { data: newProject } = await supabase
          .from('projects')
          .insert({
            user_id: data.user.id,
            name: 'Load Test Project',
            brand_name: 'Test Brand',
            status: 'active',
          })
          .select('id')
          .single();

        context.vars.projectId = newProject?.id || randomUUID();
      }
    }

    // Generate unique session ID for chat
    context.vars.sessionId = randomUUID();

    return done();
  } catch (err) {
    console.error('generateAuthToken error:', err);
    return done(err);
  }
}

/**
 * Generate random number for unique resource names
 */
export function randomNumber() {
  return Math.floor(Math.random() * 1000000);
}
