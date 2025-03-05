import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
	process.env.SUPABASE_URL as string,
	process.env.SUPABASE_ANON_KEY as string,
);

export const verifySupabaseSetup = async () => {
	console.log("[supabase] Starting table verification...");
	try {
		const { error: tableError } = await supabase
			.from("akahu_transactions")
			.select("_id")
			.limit(1);
		if (tableError && tableError.code === "42P01") {
			console.error(
				"[supabase] Missing table 'akahu_transactions'. Create it with:",
			);
			console.log(`
CREATE TABLE akahu_transactions (
	_id TEXT CHECK (_id LIKE 'trans_%') NOT NULL PRIMARY KEY,
	_account TEXT CHECK (_account LIKE 'acc_%') NOT NULL,
	_connection TEXT CHECK (_connection LIKE 'conn_%') NOT NULL,
	created_at TEXT NOT NULL,
	date TEXT NOT NULL,
	description TEXT NOT NULL,
	amount DECIMAL(10,2) NOT NULL,
	balance DECIMAL(10,2) NOT NULL,
	type TEXT NOT NULL
);`);
			process.exit(1);
		}
		const dummyData = {
			_id: "trans_dummy",
			_account: "acc_dummy",
			_connection: "conn_dummy",
			created_at: new Date().toISOString(),
			date: new Date().toISOString().split("T")[0],
			description: "Dummy transaction for verification",
			amount: 0.0,
			balance: 0.0,
			type: "TEST",
		};
		const { error: insertError } = await supabase
			.from("akahu_transactions")
			.insert(dummyData);
		if (insertError) {
			console.error(
				"[supabase] Failed to insert dummy data into 'akahu_transactions':",
				insertError,
			);
			process.exit(1);
		}
		await supabase.from("akahu_transactions").delete().eq("_id", "trans_dummy");
		console.log("[supabase] Table verification successful!");
	} catch (error) {
		console.error("[supabase] Table verification failed:", error);
		process.exit(1);
	}
};
