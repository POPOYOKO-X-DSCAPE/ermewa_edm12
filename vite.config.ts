import * as path from "node:path";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	server: {
		port: 3000,
	},
	resolve: {
		alias: [{ find: "@", replacement: path.resolve(__dirname, "src") }, { find: "@styles", replacement: path.resolve(__dirname, "../../styled-system/css/css/")}],
	},
	plugins: [react(), svgr()],
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: '', // Si tu as des variables globales
			},
		},
	}
});
