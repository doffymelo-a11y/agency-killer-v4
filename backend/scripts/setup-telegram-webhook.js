/**
 * Setup Telegram Webhook
 * Run with: node scripts/setup-telegram-webhook.js
 */

import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;
const SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not set in .env');
  process.exit(1);
}

if (!WEBHOOK_URL) {
  console.error('❌ TELEGRAM_WEBHOOK_URL not set in .env');
  process.exit(1);
}

async function setupWebhook() {
  try {
    console.log('🔧 Setting up Telegram webhook...\n');
    console.log(`Bot Token: ${BOT_TOKEN.substring(0, 15)}...`);
    console.log(`Webhook URL: ${WEBHOOK_URL}`);
    console.log(`Secret Token: ${SECRET_TOKEN}\n`);

    // Set webhook
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        secret_token: SECRET_TOKEN,
        allowed_updates: ['message', 'callback_query'],
      }),
    });

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Webhook configured successfully!\n');
      console.log('Webhook info:');
      console.log(JSON.stringify(data.result, null, 2));
    } else {
      console.error('❌ Failed to set webhook:');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    // Get webhook info to verify
    console.log('\n📋 Verifying webhook...\n');
    const infoUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;
    const infoResponse = await fetch(infoUrl);
    const infoData = await infoResponse.json();

    if (infoData.ok) {
      console.log('Current webhook configuration:');
      console.log(JSON.stringify(infoData.result, null, 2));
    }

    console.log('\n✅ Setup complete! Test by creating a ticket in the cockpit.');
  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);
    process.exit(1);
  }
}

setupWebhook();
