import "dotenv/config";
import fetch from "node-fetch";
import { getAccountById } from "./akahu";
import type { TransactionType } from "akahu";

// Check if Telegram bot token and chat ID are provided
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Format currency amount nicely
const formatAmount = (amount: number): string => {
	const absAmount = Math.abs(amount);
	const prefix = amount < 0 ? "-$" : "$";
	return `${prefix}${absAmount.toFixed(2)}`;
};

// Helper function to calculate relative time
const getRelativeTimeFromNow = (date: Date): string => {
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();

	// If in the future
	if (diffMs < 0) {
		const diffSecs = Math.abs(diffMs) / 1000;

		if (diffSecs < 60)
			return `in ${Math.round(diffSecs)} second${Math.round(diffSecs) === 1 ? "" : "s"}`;
		if (diffSecs < 3600)
			return `in ${Math.round(diffSecs / 60)} minute${Math.round(diffSecs / 60) === 1 ? "" : "s"}`;
		if (diffSecs < 86400)
			return `in ${Math.round(diffSecs / 3600)} hour${Math.round(diffSecs / 3600) === 1 ? "" : "s"}`;
		if (diffSecs < 604800)
			return `in ${Math.round(diffSecs / 86400)} day${Math.round(diffSecs / 86400) === 1 ? "" : "s"}`;
		if (diffSecs < 2592000)
			return `in ${Math.round(diffSecs / 604800)} week${Math.round(diffSecs / 604800) === 1 ? "" : "s"}`;
		if (diffSecs < 3600) return `in ${Math.round(diffSecs / 60)} minutes`;
		if (diffSecs < 86400) return `in ${Math.round(diffSecs / 3600)} hours`;
		if (diffSecs < 604800) return `in ${Math.round(diffSecs / 86400)} days`;
		if (diffSecs < 2592000) return `in ${Math.round(diffSecs / 604800)} weeks`;
		if (diffSecs < 31536000)
			return `in ${Math.round(diffSecs / 2592000)} months`;
		return `in ${Math.round(diffSecs / 31536000)} years`;
	}

	// If in the past
	const diffSecs = diffMs / 1000;

	if (diffSecs < 60) return `${Math.round(diffSecs)} seconds ago`;
	if (diffSecs < 3600) return `${Math.round(diffSecs / 60)} minutes ago`;
	if (diffSecs < 86400) return `${Math.round(diffSecs / 3600)} hours ago`;
	if (diffSecs < 604800) return `${Math.round(diffSecs / 86400)} days ago`;
	if (diffSecs < 2592000) return `${Math.round(diffSecs / 604800)} weeks ago`;
	if (diffSecs < 31536000)
		return `${Math.round(diffSecs / 2592000)} months ago`;
	return `${Math.round(diffSecs / 31536000)} years ago`;
};

export const sendTelegramNotification = async (
	message: string,
): Promise<boolean> => {
	try {
		// Skip if Telegram credentials are not set
		if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
			console.log(
				"[telegram] Notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set",
			);
			return false;
		}

		// Send the message to Telegram
		const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				chat_id: TELEGRAM_CHAT_ID,
				text: message,
				parse_mode: "Markdown",
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error("[telegram] Failed to send notification:", errorData);
			return false;
		}

		console.log("[telegram] Notification sent successfully");
		return true;
	} catch (error) {
		console.error("[telegram] Error sending notification:", error);
		return false;
	}
};

// Prepare transaction notification message
export const createTransactionNotification = async ({
	_account,
	description,
	amount: rawAmount,
	date,
	balance: rawBalance,
	type,
}: {
	_account: string;
	description: string;
	amount: string;
	date: string;
	balance: string;
	type: TransactionType;
}): Promise<string> => {
	const account = await getAccountById(_account);

	// Parse the date (assuming UTC) and convert to NZ timezone
	const transactionDateUTC = new Date(date);
	const nzOptions = { timeZone: "Pacific/Auckland" };

	// Format date
	const formattedDate = transactionDateUTC.toLocaleDateString("en-NZ", {
		year: "numeric",
		month: "short",
		day: "numeric",
		...nzOptions,
	});

	// Get 24-hour time without leading zeros by formatting then modifying
	const nzDate = new Date(
		transactionDateUTC.toLocaleString("en-US", nzOptions),
	);
	const hours = nzDate.getHours(); // This will be 0-23 without leading zeros
	const minutes = nzDate.getMinutes().toString().padStart(2, "0"); // Minutes should have leading zero
	const formattedTime = `${hours}:${minutes}`;

	// Calculate relative time from now
	const relativeTime = getRelativeTimeFromNow(transactionDateUTC);

	const amount = Number.isNaN(Number(rawAmount)) ? 0 : Number(rawAmount);
	const balance = Number.isNaN(Number(rawBalance)) ? 0 : Number(rawBalance);
	const amountText = formatAmount(amount);
	const balanceText = formatAmount(balance);
	const timezone = "NZST"; // New Zealand Standard Time

	// Different message format based on transaction type (expense vs income)
	if (amount > 0) {
		return `💸 *Income: ${amountText}*
📝 ${description} (${type})
🏦 ${account?.connection_name}
🪪 ${account?.holder_name}
🗓️ ${formattedDate} at ${formattedTime} ${timezone}
⏱️ ${relativeTime}
⚖️ New balance: ${balanceText}`;
	}
	return `💰 *Expense: ${amountText}*
📝 ${description} (${type})
🏦 ${account?.connection_name} (${account?.holder_name})
🗓️ ${formattedDate} at ${formattedTime} (${timezone})
⏱️ ${relativeTime}
⚖️ New balance: ${balanceText}`;
};
