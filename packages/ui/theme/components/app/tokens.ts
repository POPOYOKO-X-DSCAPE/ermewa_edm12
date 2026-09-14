import { defineTokens } from "@pandacss/dev";
import { bg, fg } from "../../semantic/colors";

export const app = defineTokens({
	colors: {
		bg: bg.default.initial,
		fg: fg.default.initial,
	},
});
