import { defineSemanticTokens } from "@pandacss/dev";
import { brand } from "../../brand";

export const spacing = defineSemanticTokens.spacing({
	padding: brand.spacings.padding,
	margin: brand.spacings.margin,
});

export const { padding, margin } = spacing;
