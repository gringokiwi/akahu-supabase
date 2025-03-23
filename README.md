# Akahu-Supabase Integration

A service that syncs Akahu bank transactions to a Supabase database and provides notifications for new transactions.

## Features

- Syncs bank transactions from Akahu to Supabase
- Detects and processes only new transactions
- Sends Telegram notifications for new transactions
- REST API for accessing account and transaction data
- Automatically refreshes data every 15 minutes

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   AKAHU_APP_TOKEN=your_akahu_app_token
   AKAHU_USER_TOKEN=your_akahu_user_token
   PORT=3000
   API_KEY=your_api_key_for_accessing_private_endpoints
   
   # Optional: For Telegram notifications
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   TELEGRAM_CHAT_ID=your_telegram_chat_id
   ```

## Getting Your Telegram Chat ID

After creating a bot with @BotFather and getting a bot token:

1. Add the token to your `.env` file
2. Run:
   ```
   npm run get-chat-id
   ```
3. Follow the instructions to send a message to your bot
4. Run the command again to see your chat ID
5. Add the chat ID to your `.env` file

For more detailed instructions, see [GET_CHAT_ID.md](GET_CHAT_ID.md).

## Running the Service

Start in development mode:
```
npm run dev
```

Start in production mode:
```
npm start
```

## Setting Up Supabase Webhooks

To receive Telegram notifications when new transactions are detected:

1. Set up a webhook in your Supabase dashboard
2. Configure it to send new transaction data to your server
3. Make sure to include the webhook secret if you set one

For detailed setup instructions, see [WEBHOOK_SETUP.md](WEBHOOK_SETUP.md).

## API Endpoints

- `GET /accounts` - List all accounts
- `GET /accounts/:accountId` - Get transactions for a specific account
- `GET /accounts/:accountId/refresh` - Trigger a refresh for a specific account
- `POST /webhook` - Endpoint for Supabase webhooks

Private data is only accessible with the API key:
```
GET /accounts?apiKey=your_api_key
```