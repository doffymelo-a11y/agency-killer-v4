import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data, error } = await supabase
  .from('super_admin_telegram_chat_ids')
  .select('*')
  .eq('is_active', true);

if (error) {
  console.log('[DB Test] ❌ Error:', error);
} else if (!data || data.length === 0) {
  console.log('[DB Test] ⚠️ NO ACTIVE TELEGRAM CHAT IDS FOUND!');
  console.log('[DB Test] This is why notifications are not sent!');
} else {
  console.log('[DB Test] ✅ Found', data.length, 'active chat IDs:');
  data.forEach(chat => {
    console.log('  - Chat ID:', chat.chat_id);
    console.log('    Username:', chat.username);
    console.log('    Preferences:', JSON.stringify(chat.notif_preferences));
  });
}
