import "dotenv/config";
import fetch from "node-fetch";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
	console.error("Error: TELEGRAM_BOT_TOKEN is not set in your .env file");
	console.log(
		"Please get a token from @BotFather and add it to your .env file",
	);
	process.exit(1);
}

const getUpdates = async () => {
	try {
		const response = await fetch(
			`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`,
		);

		if (!response.ok) {
			throw new Error(`Error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();

		if (!data.ok) {
			throw new Error(`Telegram API error: ${data.description}`);
		}

		if (data.result.length === 0) {
			console.log("\n❌ No messages found.");
			console.log(
				"Please send a message to your bot first and run this script again.",
			);
			console.log(
				"If you haven't started a chat with your bot, find it on Telegram and send /start",
			);
			return;
		}

		console.log("\n✅ Chat IDs found:");

		// Extract unique chat IDs from updates
		const chatIds = new Set();

		for (const update of data.result) {
			if (update.message?.chat) {
				const chat = update.message.chat;
				const chatId = chat.id;

				if (!chatIds.has(chatId)) {
					chatIds.add(chatId);

					let chatType = "Unknown";
					let chatName = "Unknown";

					if (chat.type === "private") {
						chatType = "Private chat with";
						chatName = `${chat.first_name} ${chat.last_name || ""}`.trim();
					} else if (chat.type === "group" || chat.type === "supergroup") {
						chatType = chat.type === "supergroup" ? "Supergroup" : "Group";
						chatName = chat.title;
					} else if (chat.type === "channel") {
						chatType = "Channel";
						chatName = chat.title;
					}

					console.log(`${chatType}: ${chatName}`);
					console.log(`Chat ID: ${chatId}`);
					console.log(
						`Use this in your .env file as: TELEGRAM_CHAT_ID=${chatId}`,
					);
					console.log("---");
				}
			}
		}

		console.log("\nTo receive notifications in a group chat:");
		console.log("1. Add your bot to the group");
		console.log("2. Send a message in the group mentioning the bot");
		console.log("3. Run this script again to get the group chat ID");
	} catch (error) {
		console.error("Failed to get updates:", error);
	}
};

console.log("\n🔍 Looking for Telegram chats with your bot...");
getUpdates();
