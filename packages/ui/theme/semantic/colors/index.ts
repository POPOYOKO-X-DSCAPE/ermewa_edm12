import { defineSemanticTokens } from "@pandacss/dev";
import { brand } from "../../brand";

export const colors = defineSemanticTokens.colors({
	danger: brand.colors.danger,
	success: brand.colors.success,
	bg: {
		default: {
			initial: brand.colors.grey.scales.s09,
			hover: brand.colors.grey.scales.s00,
		},
		elevated: {
			initial: brand.colors.grey.scales.s10,
			hover: brand.colors.grey.shades.s02,
			active: brand.colors.grey.shades.s01,
		},
		actionLow: {
			initial: brand.colors.grey.scales.s09,
			hover: brand.colors.grey.scales.s08,
		},
		actionHigh: {
			initial: brand.colors.primary.scales.s05,
			hover: brand.colors.primary.scales.s04,
		},
		accent: {
			initial: brand.colors.primary.shades.s01,
		},
		// Persistent emphasis segments beyond the actionable primary tint
		// (bg.accent, level 1): "near" is the mid-distance segment, "far"
		// the deepest one. Soft 10% tints of each hue, on the elevated bg.
		emphasis: {
			near: {
				initial: brand.colors.ember.shades.s01,
			},
			far: {
				initial: brand.colors.steel.shades.s01,
			},
		},
	},
	fg: {
		default: {
			initial: brand.colors.grey.scales.s00,
			hover: brand.colors.grey.scales.s01,
		},
		elevated: {
			initial: brand.colors.grey.scales.s00,
			hover: brand.colors.grey.scales.s01,
			active: brand.colors.primary.scales.s05,
		},
		actionLow: {
			initial: brand.colors.primary.scales.s05,
			hover: brand.colors.primary.scales.s04,
		},
		actionHigh: {
			initial: brand.colors.grey.scales.s10,
			hover: brand.colors.grey.scales.s09,
		},
		// Solid edge-stroke hues for the persistent emphasis segments
		// (mirror of the bg.emphasis tints); level 1 is actionLow (primary).
		emphasis: {
			near: {
				initial: brand.colors.ember.scales.s05,
			},
			far: {
				initial: brand.colors.steel.scales.s05,
			},
		},
	},
});

export const { bg, fg } = colors;
