import { defineTokens } from "@pandacss/dev";

const paddingScale = (base: number) => {
	return defineTokens.sizes({
		none: { value: "0" },
		xxs: { value: `${base * 1}px` },
		xs: { value: `${base * 2}px` },
		s: { value: `${base * 3}px` },
		m: { value: `${base * 4}px` },
		l: { value: `${base * 5}px` },
		xl: { value: `${base * 6}px` },
		xxl: { value: `${base * 7}px` },
	});
};

const marginScale = (base: number) => {
	return defineTokens.sizes({
		none: { value: "0" },
		xxs: { value: `${base * 1}px` },
		xs: { value: `${base * 2}px` },
		s: { value: `${base * 3}px` },
		m: { value: `${base * 4}px` },
		l: { value: `${base * 5}px` },
		xl: { value: `${base * 6}px` },
		xxl: { value: `${base * 7}px` },
	});
};

export const spacings = defineTokens.spacing({
	padding: paddingScale(4),
	margin: marginScale(2),
});
