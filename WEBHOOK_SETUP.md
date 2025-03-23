# Setting Up Supabase Webhooks for Transaction Notifications

This guide explains how to set up Supabase webhooks to send Telegram notifications when new transactions are detected.

## Prerequisites

1. A Telegram bot token (get one from [@BotFather](https://t.me/botfather))
2. A Telegram chat ID - get via `npm run getTelegramChatId`
3. Access to your Supabase dashboard

## Environment Variables

Add these to your `.env` file:

```
# Required for Telegram notifications
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

## Setting Up Supabase Database Webhooks

1. Log in to your Supabase dashboard
2. Go to Database → Webhooks
3. Click "Create a new webhook"
4. Configure the webhook:

   - **Name**: `transaction_notifications`
   - **Table**: `akahu_transactions`
   - **Events**: Select only `INSERT`
   - **Method**: `POST`
   - **URL**: Your server URL + `/webhook` (e.g., `https://your-server.com/webhook`)
   ```

5. Click "Save"

## Testing the Webhook

1. In Supabase, go to the SQL Editor
2. Run an INSERT statement:

```sql
INSERT INTO akahu_transactions 
(_id, _account, _connection, created_at, date, description, amount, balance, type)
VALUES 
('trans_test1', 'acc_123', 'conn_456', '2023-03-22T12:00:00Z', '2023-03-22', 'Test Transaction', -25.50, 1000.00, 'EFTPOS');
```

3. You should receive a notification in Telegram with the transaction details

## Troubleshooting

- Check your server logs for any webhook processing errors
- Verify that both `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set correctly
- Make sure your bot has permission to send messages in the chat
- Check that the webhook URL is accessible from the internet