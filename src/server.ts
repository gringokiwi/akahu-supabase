import express from "express";
import cors from "cors";
import { fetchAccounts, refreshTransactionsForAccount } from "./akahu";
import { getTransactionsForAccount } from "./transactions";

const PORT = Number(process.env.PORT as string);

export const createServer = () => {
	const app = express();
	app.use(cors());
	app.use(express.json());

	app.get("/accounts", async (req, res) => {
		try {
			const accounts = await fetchAccounts();
			if (req.query.apiKey === process.env.API_KEY) {
				res.json(accounts);
			} else {
				res.json(
					accounts.map(
						({
							internal_name,
							formatted_number,
							holder_name,
							...publicFields
						}) => publicFields,
					),
				);
			}
		} catch (error) {
			console.error("[server] Error fetching accounts:", error);
			res.status(500).json({ error: "Failed to fetch accounts" });
		}
	});

	app.get("/accounts/:accountId", async (req, res) => {
		try {
			const transactions = await getTransactionsForAccount(
				req.params.accountId,
			);
			if (req.query.apiKey === process.env.API_KEY) {
				res.json(transactions);
			} else {
				res.json(
					transactions.map(({ description, ...publicFields }) => publicFields),
				);
			}
		} catch (error) {
			console.error("[server] Error fetching transactions:", error);
			res.status(500).json({ error: "Failed to fetch transactions" });
		}
	});

	app.get("/accounts/:accountId/refresh", async (req, res) => {
		try {
			if (req.query.apiKey !== process.env.API_KEY) {
				res.status(401).json({ error: "Unauthorized" });
			} else {
				res.json({ message: "Refresh requested" });
				(async () => {
					try {
						await refreshTransactionsForAccount(req.params.accountId);
						console.log(
							`[server] Refresh completed for account '${req.params.accountId}'`,
						);
					} catch (error) {
						console.error(
							`[server] Error during refresh for account '${req.params.accountId}':`,
							error,
						);
					}
				})();
			}
		} catch (error) {
			console.error("[server] Error refreshing transactions:", error);
			res.status(500).json({ error: "Failed to refresh transactions" });
		}
	});

	app.post("/webhook", async (req, res) => {
		console.log("[server] Webhook received:", req.body);
		res.json({ message: "Webhook received" });
	});

	const startServer = () => {
		return new Promise((resolve) => {
			const server = app.listen(PORT, () => {
				console.log(
					`[server] Express server running at http://localhost:${PORT}`,
				);
				resolve(server);
			});
		});
	};

	return { app, startServer };
};
