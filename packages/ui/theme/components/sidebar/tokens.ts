import { defineTokens } from "@pandacss/dev";
import { brand } from "../../brand";
import { bg, fg } from "../../semantic/colors";
import { radii } from "../../semantic/radii";
import { padding } from "../../semantic/spacings";

export const sidebar = defineTokens({
	colors: {
		bg: {
			initial: bg.elevated.initial,
			hover: bg.elevated.hover,
		},
		fg: { initial: fg.elevated.initial },
		border: {
			// Group / indent guide line.
			guide: brand.colors.black,
		},
		element: {
			bg: {
				initial: bg.elevated.initial,
				hover: bg.elevated.hover,
				active: bg.elevated.active,
			},
			fg: {
				initial: fg.elevated.initial,
				hover: fg.elevated.hover,
				active: fg.elevated.active,
			},
		},
	},
	spacing: {
		element: {
			gap: padding.xs,
			padding: padding.xs,
			paddingLeft: padding.m,
		},
		group: {
			paddingLeft: padding.xxl,
		},
	},
	radii: { element: { radius: radii.radius.l } },
});
