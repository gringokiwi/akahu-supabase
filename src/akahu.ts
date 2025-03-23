import "dotenv/config";
import { type Account, type Connection, AkahuClient } from "akahu";
import { syncTransactions } from "./transactions";

export const akahu = new AkahuClient({
	appToken: process.env.AKAHU_APP_TOKEN as string,
});

export const userToken = process.env.AKAHU_USER_TOKEN as string;

type FormattedAccount = {
	_account: Account["_id"];
	_connection: Connection["_id"];
	connection_name: Connection["name"];
	connection_logo: Connection["logo"];
	status: Account["status"];
	balance?: NonNullable<Account["balance"]>["current"];
	last_refreshed?: NonNullable<Account["refreshed"]>["transactions"];
	internal_name: Account["name"];
	formatted_number: Account["formatted_account"];
	holder_name: NonNullable<Account["meta"]>["holder"];
};

export const fetchAccounts = async (): Promise<FormattedAccount[]> => {
	const accounts = await akahu.accounts.list(userToken);
	return accounts.map(
		({
			_id: _account,
			connection: {
				_id: _connection,
				name: connection_name,
				logo: connection_logo,
			},
			name: internal_name,
			formatted_account: formatted_number,
			status,
			balance: { current: balance } = {},
			meta: { holder: holder_name } = {},
			refreshed: { transactions: last_refreshed } = {},
		}) => ({
			_account,
			_connection,
			connection_name,
			connection_logo,
			status,
			balance,
			last_refreshed,
			internal_name,
			formatted_number,
			holder_name,
		}),
	);
};

export const getAccountById = async (accountId: string) => {
	const accounts = await fetchAccounts();
	return accounts.find(({ _account }) => _account === accountId);
};

export const refreshTransactionsForAccount = async (_account: string) => {
	console.log(`[akahu] Refreshing transactions for account '${_account}'`);
	await akahu.accounts.refresh(userToken, _account);
	console.log(
		`[akahu] Waiting 10 seconds for refresh on account '${_account}' to complete...`,
	);
	await new Promise((resolve) => setTimeout(resolve, 10000));
	console.log(`[akahu] Syncing transactions for account '${_account}'...`);
	await syncTransactions();
};
