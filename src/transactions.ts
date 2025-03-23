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
		
		// Fetch first page
		let page = await akahu.transactions.list(userToken, query);
		
		// If we have a latest transaction, find the date boundary and stop fetching at that point
		if (latestTransaction) {
			const latestDate = new Date(latestTransaction.date);
			console.log("[transactions] Latest transaction date:", latestDate.toISOString());
			
			// Keep fetching pages until we reach a page where all transactions are older
			// than or equal to our latest transaction date
			let continueFetching = true;
			
			while (continueFetching && page.items.length > 0) {
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
				
				// Filter to only include new transactions
				const newTransactions = formattedTransactions.filter(t => {
					const transDate = new Date(t.date);
					// Keep if date is newer or same date but different ID (not already in DB)
					return transDate > latestDate || 
						(transDate.getTime() === latestDate.getTime() && t._id !== latestTransaction._id);
				});
				
				fetchedTransactions.push(...newTransactions);
				
				// Check if this page has any transactions newer than our cutoff
				const hasNewerTransactions = page.items.some(t => {
					const transDate = new Date(t.date);
					return transDate > latestDate;
				});
				
				// Only continue if we have a next page and this page had newer transactions
				if (page.cursor.next && hasNewerTransactions) {
					query.cursor = page.cursor.next;
					page = await akahu.transactions.list(userToken, query);
				} else {
					continueFetching = false;
				}
			}
		} else {
			// No latest transaction, fetch all transactions across all pages
			while (page.items.length > 0) {
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
				
				// Get next page if available
				if (page.cursor.next) {
					query.cursor = page.cursor.next;
					page = await akahu.transactions.list(userToken, query);
				} else {
					break;
				}
			}
		}
		
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
