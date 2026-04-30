-- Migration 036: Enable Realtime for support_tickets table
-- Fixes Telegram notification issues by enabling Supabase Realtime

-- Enable Realtime for support_tickets table
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;

-- Add comment
COMMENT ON TABLE support_tickets IS 'Support tickets table with Realtime enabled for Telegram notifications';
