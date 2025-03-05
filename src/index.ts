import cron from "node-cron";
import { checkEnvVars } from "./env";
import { verifySupabaseSetup } from "./supabase";
import { syncTransactions } from "./transactions";
import { createServer } from "./server";
const main = async () => {
	console.log("[main] Starting transaction sync service...");
	checkEnvVars();
	await verifySupabaseSetup();
	console.log("[main] Transaction sync service started successfully.");
	console.log("[main] Starting Express server...");
	const { startServer } = createServer();
	await startServer();
	console.log("[main] Performing initial transaction sync...");
	await syncTransactions();
	cron.schedule("*/15 * * * *", async () => {
		console.log("[cron] Running scheduled transaction sync...");
		await syncTransactions();
	});
};

main().catch((error) => {
	console.error("[main] Application startup failed:", error);
	process.exit(1);
});
