import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('[Test] Creating Supabase client...');
console.log('[Test] URL:', SUPABASE_URL);
console.log('[Test] Service Role Key:', SERVICE_ROLE_KEY ? 'EXISTS' : 'MISSING');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

console.log('[Test] Setting up Realtime channel...');

const channel = supabase
  .channel('test-support-tickets')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'support_tickets',
    },
    (payload) => {
      console.log('[Test] 🔥 RECEIVED INSERT EVENT!', payload);
    }
  )
  .subscribe((status, err) => {
    console.log(`[Test] Status: ${status}`, err || '');
  });

console.log('[Test] Waiting for events... (Press Ctrl+C to exit)');

// Keep process alive
setInterval(() => {
  console.log('[Test] Still listening...');
}, 30000);
