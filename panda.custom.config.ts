import { defineConfig } from "@pandacss/dev";

import { theme } from "./theme";

export default defineConfig({
	jsxFramework: "react",
	globalCss: {
		"#root": {
			height: "100vh",
		},
		html: {
			height: "100vh",
		},
		body: {
			height: "100vh",
			margin: 0,
			padding: 0,
			backgroundColor: "s.bg.default.initial",
			color: "s.fg.default.initial",
			fontFamily: "s.fonts.body",
		},
		"h1, h2, h3, h4, h5, h6": {
			fontFamily: "s.fonts.heading",
			margin: 0,
		},
		"#app": {
			display: "flex",
			flexDirection: "column",
			height: "100vh",
			overflow: "hidden",
		},
		main: {
			display: "flex",
			flexGrow: 1,
			position: "relative",
			height: "90%",
			backgroundColor: "s.bg.elevated.initial",
			overflow: "hidden",
		},
		"@keyframes ed12-rotation": {
			"0%": {
				transform: "rotate(180deg)",
				opacity: 1,
				borderWidth: "1px",
				scale: "0",
			},
			"50%": {
				scale: "0.55",
				opacity: 1,
				transform: "rotate(-180deg)",
			},
			"100%": {
				transform: "rotate(180deg)",
				opacity: 0,
				borderWidth: "4px",
				scale: "1",
			},
		},
	},
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
