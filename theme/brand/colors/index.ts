import { defineSemanticTokens } from "@pandacss/dev";
import type { Token } from "@pandacss/types";
import chroma from "chroma-js";

type ColorScale = Record<
	`s0${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`,
	Token<string>
>;

const factor = (step: number, multiplier: number) =>
	(step / 10) * multiplier;

const stepName = (index: number) =>
	`0${index}` as `0${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`;

const generateColorScale = (baseColor: string): ColorScale => {
	const multiplier = 2.3;
	const darkenMultiplier = multiplier * 1.3;
	const scale = {
		s05: { value: chroma(baseColor).hex() },
	} as ColorScale;
	const darkening = [10, 9, 6, 4, 2];
	const brightening = [2, 4, 7, 9, 10];

	darkening.forEach((step, index) => {
		scale[`s${stepName(index)}`] = {
			value: chroma(baseColor)
				.darken(factor(step, darkenMultiplier))
				.hex(),
		};
	});
	brightening.forEach((step, index) => {
		scale[`s${stepName(index + 6)}`] = {
			value: chroma(baseColor).brighten(factor(step, multiplier)).hex(),
		};
	});
	return scale;
};

export const colors = defineSemanticTokens.colors({
	black: { value: "#0E0204" },
	white: { value: "#FAFAFA" },
	primary: generateColorScale("#2a04d1"),
	info: { value: "#0B2EF1" },
	yellow: { value: "#FCD53F" },
});
