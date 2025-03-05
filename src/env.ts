import "dotenv/config";

const requiredEnvVars = [
	"SUPABASE_URL",
	"SUPABASE_ANON_KEY",
	"AKAHU_APP_TOKEN",
	"AKAHU_USER_TOKEN",
	"PORT",
	"API_KEY",
];

export const checkEnvVars = () => {
	for (const envVar of requiredEnvVars) {
		if (!process.env[envVar]) {
			console.error(`[env]: Missing environment variable '${envVar}'.`);
			process.exit(1);
		}
	}
};
