import { defineSemanticTokens } from "@pandacss/dev";
import { brand } from "../../brand";

export const radii = defineSemanticTokens.radii({
	radius: brand.radii.radius,
});

export const { radius } = radii;
