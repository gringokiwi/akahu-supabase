import "dotenv/config";

const requiredEnvVars = [
	"SUPABASE_URL",
	"SUPABASE_ANON_KEY",
	"AKAHU_APP_TOKEN",
	"AKAHU_USER_TOKEN",
	"PORT",
	"API_KEY",
];

const optionalEnvVars = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"];

export const checkEnvVars = () => {
	// Check required environment variables
	for (const envVar of requiredEnvVars) {
		if (!process.env[envVar]) {
			console.error(
				`[env]: Missing required environment variable '${envVar}'.`,
			);
			process.exit(1);
		}
	}

	// Warn about missing optional environment variables
	for (const envVar of optionalEnvVars) {
		if (!process.env[envVar]) {
			console.warn(`[env]: Missing optional environment variable '${envVar}'.`);
		}
	}

	// Check Telegram configuration
	if (
		(process.env.TELEGRAM_BOT_TOKEN && !process.env.TELEGRAM_CHAT_ID) ||
		(!process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
	) {
		console.warn(
			"[env]: Both TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set for Telegram notifications to work.",
		);
	} else if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
		console.log("[env]: Telegram notifications are enabled.");
	} else {
		console.log("[env]: Telegram notifications are disabled.");
	}
};
