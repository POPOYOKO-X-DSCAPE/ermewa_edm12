import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "bun";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "files");

serve({
	port: 4000,
	async fetch(req) {
		const url = new URL(req.url);
		const path = url.pathname === "/" ? "/index.html" : url.pathname;
		const file = Bun.file(`${ROOT}${path}`);

		if (await file.exists()) {
			return new Response(file, {
				headers: {
					"Access-Control-Allow-Origin": "*",
				},
			});
		}

		return new Response("File not found", {
			status: 404,
			headers: { "Access-Control-Allow-Origin": "*" },
		});
	},
});

console.log(
	`📂 File server running at ${ROOT} on http://localhost:4000`,
);
