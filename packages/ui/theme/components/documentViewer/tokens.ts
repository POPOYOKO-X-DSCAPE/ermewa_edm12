import { defineTokens } from "@pandacss/dev";
import { brand } from "../../brand";
import { bg, fg } from "../../semantic/colors";
import { padding } from "../../semantic/spacings";

export const colors = defineTokens.colors({
	bg: bg.elevated.initial,
	fg: fg.elevated.initial,
	border: {
		// PDF page / thumbnail outlines.
		initial: brand.colors.grey.scales.s08,
		hover: brand.colors.black,
	},
});

export const spacing = defineTokens.spacing({
	padding: padding.m,
	gap: padding.m,
});

// One-off document-viewer dimensions (min-widths, compact box heights).
export const sizes = defineTokens.sizes({
	thumbnailContainer: { value: "180px" },
	pageNumber: { value: "24px" },
	actionIcon: { value: "12px" },
	metaDialog: { value: "320px" },
	zoomField: { value: "50px" },
});

export const documentViewer = defineTokens({
	colors,
	spacing,
	sizes,
});

export const zoomSpacing = defineTokens.spacing({
	gap: padding.xs,
});

export const documentViewerZoom = defineTokens({
	spacing: zoomSpacing,
});
