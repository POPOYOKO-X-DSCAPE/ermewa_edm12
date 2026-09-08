import { defineTokens } from "@pandacss/dev";

const radiusScale = (base: number) => {
	return defineTokens.radii({
		none: { value: "0" },
		xs: { value: `${base / 2}px` },
		s: { value: `${base * 1}px` },
		m: { value: `${base * 2}px` },
		l: { value: `${base * 3}px` },
		xl: { value: `${base * 4}px` },
	});
};

export const radii = defineTokens.radii({
	radius: radiusScale(1),
});
