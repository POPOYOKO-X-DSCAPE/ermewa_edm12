import { semantic as kitSemantic } from "@packages/ui/theme/semantic";
import { defineTokens } from "@pandacss/dev";

export const sizes = defineTokens.sizes({
	md: kitSemantic.sizes.s.md,
	iconSm: { value: "16px" },
	iconMd: { value: "24px" },
	iconLg: { value: "32px" },
	wagonIcon: { value: "18px" },
	loaderSpin: { value: "24px" },
});
