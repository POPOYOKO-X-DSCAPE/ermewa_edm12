import { serve } from "bun";

const port = import.meta.env.VITE_OFFLINE_API_PORT;

// === Change this constant to globally switch the default file ===
const DEFAULT_FILE_KEY = "pdf";
// =================================================================

const FILE_MAP: Record<string, string> = {
	jpg: "example.jpg",
	json: "example.json",
	mp4: "example.mp4",
	msg: "example.msg",
	pdf: "example.pdf",
	png: "example.png",
	txt: "example.txt",
	xml: "example.xml",
};

const CONTENT_TYPE_MAP: Record<string, string> = {
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	json: "application/json",
	mp4: "video/mp4",
	msg: "application/octet-stream",
	pdf: "application/pdf",
	txt: "text/plain; charset=utf-8",
	xml: "application/xml; charset=utf-8",
};

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const fileServerBase = "http://localhost:4000";

serve({
	port,
	async fetch(req) {
		const url = new URL(req.url);

		if (req.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		// Service: App Profile
		if (url.searchParams.get("request") === "XPRM") {
			const data = await import("../seeds/app-profile.json").then(
				(m) => m.default,
			);
			return new Response(JSON.stringify(data), {
				headers: { "Content-Type": "application/json", ...corsHeaders },
			});
		}

		// Service: Folder Tree
		if (url.searchParams.get("request") === "XTREE") {
			const data = await import("../seeds/folder-tree.json").then(
				(m) => m.default,
			);
			return new Response(JSON.stringify(data), {
				headers: { "Content-Type": "application/json", ...corsHeaders },
			});
		}

		// Service: Display Select
		if (url.searchParams.get("request") === "XSEL") {
			return new Response(JSON.stringify({}), {
				headers: { "Content-Type": "application/json", ...corsHeaders },
			});
		}

		// Service: Natures
		if (url.searchParams.get("request") === "XNAT") {
			const data = await import("../seeds/natures.json").then(
				(m) => m.default,
			);
			return new Response(JSON.stringify(data), {
				headers: { "Content-Type": "application/json", ...corsHeaders },
			});
		}

		// Service: Nature Masks
		if (url.searchParams.get("request") === "XOHN") {
			const data = await import("../seeds/nature-mask.json").then(
				(m) => m.default,
			);
			return new Response(JSON.stringify(data), {
				headers: { "Content-Type": "application/json", ...corsHeaders },
			});
		}

		// Service: File Proxy
		if (url.searchParams.get("request") === "XFILE") {
			const requestedKey =
				url.searchParams.get("EXT")?.toLowerCase() ?? DEFAULT_FILE_KEY;
			const filename = FILE_MAP[requestedKey];

			if (!filename) {
				return new Response(
					JSON.stringify({ error: "Unknown file key", requestedKey }),
					{
						status: 400,
						headers: {
							"Content-Type": "application/json",
							...corsHeaders,
						},
					},
				);
			}

			const extMatch = filename.match(/\.([^.]+)$/);
			const ext = extMatch ? extMatch[1].toLowerCase() : "";
			const contentType =
				CONTENT_TYPE_MAP[ext] ?? "application/octet-stream";

			try {
				const fileUrl = `${fileServerBase}/${encodeURIComponent(filename)}`;
				const fileResponse = await fetch(fileUrl);

				if (!fileResponse.ok) {
					return new Response("File not found on file-server", {
						status: 404,
						headers: corsHeaders,
					});
				}

				const blob = await fileResponse.blob();

				return new Response(blob, {
					headers: {
						"Content-Type": contentType,
						"Content-Disposition": `inline; filename="${filename}"`,
						...corsHeaders,
					},
				});
			} catch (e) {
				return new Response(
					JSON.stringify({
						error: "Failed to fetch file",
						detail: String(e),
					}),
					{
						status: 500,
						headers: {
							"Content-Type": "application/json",
							...corsHeaders,
						},
					},
				);
			}
		}

		return new Response("Not Found", {
			status: 404,
			headers: corsHeaders,
		});
	},
});

console.log(`✅ Mock server running at http://localhost:${port}`);
console.log(`🔀 Default file key = "${DEFAULT_FILE_KEY}"`);
