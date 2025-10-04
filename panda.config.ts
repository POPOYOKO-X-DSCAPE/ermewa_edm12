import { defaultTheme as theme } from "@packages/ui/theme/defaultTheme";
import { defineConfig } from "@pandacss/dev";

export default defineConfig({
	globalCss: {
		"#root": {
			height: "100vh",
		},
		"html, body": {
			height: "100vh",
			margin: 0,
			padding: 0,
		},
	},
	// emitTokensOnly: true,
	conditions: {
		light: "[data-color-mode=light] &",
		dark: "[data-color-mode=dark] &",
		pinkTheme: "[data-theme=pink] &",
		blueTheme: "[data-theme=blue] &",
	},

	// Whether to use css reset
	preflight: true,
	outExtension: "js",
	// watch: true,

	// Where to look for your css declarations
	include: [
		"./packages/**/*.{js,jsx,ts,tsx}",
		"./projects/**/*.{js,jsx,ts,tsx}",
	],

	presets: [],

	// Useful for theme customization
	theme,
	// The output directory for your css system
	outdir: "styled-system",
});
