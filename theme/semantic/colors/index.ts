import { defineSemanticTokens } from "@pandacss/dev";
import { colors as brandColorTokens } from "../../brand/colors";

const brand = brandColorTokens;

export const colors = defineSemanticTokens.colors({
	b: {
		black: { value: "#0E0204" },
		white: { value: "#FAFAFA" },
		primary: {
			s00: brand.primary.s00,
			s01: brand.primary.s01,
			s02: brand.primary.s02,
			s03: brand.primary.s03,
			s04: brand.primary.s04,
			s05: brand.primary.s05,
			s06: brand.primary.s06,
			s07: brand.primary.s07,
			s08: brand.primary.s08,
			s09: brand.primary.s09,
			s010: brand.primary.s010,
		},
		info: { value: brand.info.value },
		yellow: { value: brand.yellow.value },
	},
	s: {
		// Error / destructive text. Kept as literal `red` to match the kit's
		// pre-tokenization output (the kit theme defines its own `danger` hue).
		danger: { value: "red" },
		bg: {
			default: {
				initial: { value: "#f0eef2" },
				hover: { value: "#0b0b0b" },
			},
			elevated: {
				initial: { value: "#ffffff" },
				hover: { value: "rgba(136 136 136 / 0.2)" },
				active: { value: "rgba(136 136 136 / 0.1)" },
			},
			actionLow: {
				initial: { value: "#f0eef2" },
				hover: { value: "#d6d6d6" },
			},
			actionHigh: {
				initial: { value: brand.primary.s05.value },
				hover: { value: brand.primary.s04.value },
			},
		},
		fg: {
			default: {
				initial: { value: "#120310" },
				hover: { value: "#181818" },
			},
			elevated: {
				initial: { value: "#1a0317" },
				hover: { value: "#220a20" },
				active: { value: brand.primary.s05.value },
			},
			actionLow: {
				initial: { value: brand.primary.s05.value },
				hover: { value: brand.primary.s04.value },
			},
			actionHigh: {
				initial: { value: "#fafafa" },
				hover: { value: "#eeeeee" },
			},
		},
	},
});

export const { s } = colors;
export const bg = s.bg;
export const fg = s.fg;
