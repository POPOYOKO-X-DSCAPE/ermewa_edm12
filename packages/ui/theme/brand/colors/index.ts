import { defineSemanticTokens, defineTokens } from "@pandacss/dev";
import type { Token } from "@pandacss/types";
import chroma from "chroma-js";

type ColorScale = {
	s00: Token<string>;
	s01: Token<string>;
	s02: Token<string>;
	s03: Token<string>;
	s04: Token<string>;
	s05: Token<string>;
	s06: Token<string>;
	s07: Token<string>;
	s08: Token<string>;
	s09: Token<string>;
	s10: Token<string>;
};

type ColorShade = ColorScale;

const factor = (
	factor: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
	multiplier = 1,
) => {
	return (1 / 10) * factor * multiplier;
};

const generateColorScale = (baseColor: string): ColorScale => {
	const multiplier = 2.3;
	const darkenMultiplier = multiplier * 1.3;
	const scale: ColorScale = {
		s00: {
			value: chroma(baseColor)
				.darken(factor(10, darkenMultiplier))
				.hex(),
		},
		s01: {
			value: chroma(baseColor)
				.darken(factor(9, darkenMultiplier))
				.hex(),
		},
		s02: {
			value: chroma(baseColor)
				.darken(factor(6, darkenMultiplier))
				.hex(),
		},
		s03: {
			value: chroma(baseColor)
				.darken(factor(4, darkenMultiplier))
				.hex(),
		},
		s04: {
			value: chroma(baseColor)
				.darken(factor(2, darkenMultiplier))
				.hex(),
		},
		s05: { value: baseColor },
		s06: {
			value: chroma(baseColor).brighten(factor(2, multiplier)).hex(),
		},
		s07: {
			value: chroma(baseColor).brighten(factor(4, multiplier)).hex(),
		},
		s08: {
			value: chroma(baseColor).brighten(factor(7, multiplier)).hex(),
		},
		s09: {
			value: chroma(baseColor).brighten(factor(9, multiplier)).hex(),
		},
		s10: {
			value: chroma(baseColor).brighten(factor(10, multiplier)).hex(),
		},
	};
	return scale;
};

const generateColorShade = (baseColor: string): ColorShade => {
	const shade: ColorShade = {
		s00: {
			value: chroma(baseColor).alpha(factor(0)).hex(),
		},
		s01: {
			value: chroma(baseColor).alpha(factor(1)).hex(),
		},
		s02: {
			value: chroma(baseColor).alpha(factor(2)).hex(),
		},
		s03: {
			value: chroma(baseColor).alpha(factor(3)).hex(),
		},
		s04: {
			value: chroma(baseColor).alpha(factor(4)).hex(),
		},
		s05: {
			value: chroma(baseColor).alpha(factor(5)).hex(),
		},
		s06: {
			value: chroma(baseColor).alpha(factor(6)).hex(),
		},
		s07: {
			value: chroma(baseColor).alpha(factor(7)).hex(),
		},
		s08: {
			value: chroma(baseColor).alpha(factor(8)).hex(),
		},
		s09: {
			value: chroma(baseColor).alpha(factor(9)).hex(),
		},
		s10: {
			value: chroma(baseColor).alpha(factor(10)).hex(),
		},
	};
	return shade;
};

const generateColorDeclination = (baseColor: string) => {
	return {
		shades: generateColorShade(baseColor),
		scales: generateColorScale(baseColor),
	};
};

export const colors = defineSemanticTokens.colors({
	black: { value: "#333333" },
	white: { value: "#FAFAFA" },
	primary: generateColorDeclination("#273dffff"),
	info: { value: "#0B2EF1" },
	yellow: { value: "#FCD53F" },
	danger: { value: "#E11D2E" },
	success: { value: "#1B7F4B" },
	// Persistent surface-emphasis hues, independent of the interactive
	// primary. Orange: the near emphasis step; desaturated steel blue: the
	// far emphasis step (both read chromatic, not grey, at low alpha).
	ember: generateColorDeclination("#FF9040"),
	steel: generateColorDeclination("#7EA6E0"),
	grey: generateColorDeclination("#888"),
	infoScale: generateColorScale("#0B2EF1"),
	yellowScale: generateColorScale("#FCD53F"),
});
