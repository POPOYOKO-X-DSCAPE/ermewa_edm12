import path from "node:path";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

import { defineConfig } from "vite";

export default defineConfig({
	server: {
		port: 3000,
	},
	plugins: [react(), svgr()],
	resolve: {
		alias: [
			{ find: "@packages", replacement: path.resolve(__dirname, "packages") },
			{ find: "@src", replacement: path.resolve(__dirname, "src") },
			{ find: "@styled", replacement: path.resolve(__dirname, "styled-system/jsx") },
			{ find: "@styles", replacement: path.resolve(__dirname, "styled-system/css/css") },
		],
	},
});
