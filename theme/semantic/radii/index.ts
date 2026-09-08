import { semantic as kitSemantic } from "@packages/ui/theme/semantic";
import { defineSemanticTokens } from "@pandacss/dev";

export const radii = defineSemanticTokens.radii({
	radius: kitSemantic.radii.s.radius,
});

export const { radius } = radii;
