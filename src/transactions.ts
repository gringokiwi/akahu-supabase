import type { Transaction, TransactionQueryParams } from "akahu";
import { supabase } from "./supabase";
import { akahu, userToken } from "./akahu";

const getLatestTransaction = async () => {
	const { data, error } = await supabase
		.from("akahu_transactions")
		.select("_id, date")
		.order("date", { ascending: false })
		.limit(1);
	if (error) {
		console.error("[transactions] Error fetching latest transaction:", error);
		return null;
	}
	return data && data.length > 0 ? data[0] : null;
};

const query: TransactionQueryParams = {
	start: new Date(
		new Date().setFullYear(new Date().getFullYear() - 1),
	).toISOString(),
	end: new Date().toISOString(),
};

type FormattedTransaction = Pick<
	Transaction,
	| "_id"
	| "_account"
	| "_connection"
	| "created_at"
	| "date"
	| "description"
	| "amount"
	| "balance"
	| "type"
>;

export const syncTransactions = async () => {
	try {
		console.log("[transactions] Starting transaction sync...");
		const latestTransaction = await getLatestTransaction();
		console.log(
			"[transactions] Latest transaction in DB:",
			latestTransaction?._id || "None",
		);
		const fetchedTransactions: FormattedTransaction[] = [];
		let foundLatest = false;
		do {
			const page = await akahu.transactions.list(userToken, query);
			if (page.items.length === 0) break;
			const formattedTransactions = page.items.map(
				({
					_id,
					_account,
					_connection,
					created_at,
					date,
					description,
					amount,
					balance,
					type,
				}) => ({
					_id,
					_account,
					_connection,
					created_at,
					date,
					description,
					amount,
					balance,
					type,
				}),
			);
			fetchedTransactions.push(...formattedTransactions);
			if (
				latestTransaction &&
				page.items.some((t) => t._id === latestTransaction._id)
			) {
				foundLatest = true;
				break;
			}
			query.cursor = page.cursor.next;
		} while (query.cursor !== null || foundLatest);
		if (fetchedTransactions.length === 0) {
			console.log("[transactions] No new transactions to upsert.");
			return;
		}
		console.log(
			"[transactions] Found",
			fetchedTransactions.length,
			"transactions to upsert.",
		);
		const { error } = await supabase
			.from("akahu_transactions")
			.upsert(fetchedTransactions, { onConflict: "_id" });
		if (error) {
			console.error("[transactions] Error upserting transactions:", error);
		} else {
			console.log(
				"[transactions] Successfully upserted",
				fetchedTransactions.length,
				"transactions.",
			);
		}
	} catch (error) {
		console.error("[transactions] Error syncing transactions:", error);
	}
};

export const getTransactionsForAccount = async (_account: string) => {
	const { data, error } = await supabase
		.from("akahu_transactions")
		.select("*")
		.eq("_account", _account);
	if (error) {
		console.error("[transactions] Error fetching transactions:", error);
		return [];
	}
	return data;
};
