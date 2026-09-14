import { css } from "@styles";

// Box-neutral pill driven by the c.badge.* component tokens (themed per
// project via theme/components/badge/tokens.ts). Paddings and typography are
// left to the consumer's className so themed boxes (e.g. negspace chips) keep
// their own metrics; color / radius / height resolve against the project theme.
const badge = css({
	height: "c.badge.height",
	borderRadius: "c.badge.radius",
	backgroundColor: "c.badge.bg",
	color: "c.badge.fg",
	whiteSpace: "nowrap",
});

// Unthemed fallback (no className): the exact count circle the kit Badge had
// before tokenization — literal black dot / white .5em text, 16px square
// (c.badge.height in the kit theme). Themed consumers never hit this branch.
const dot = css({
	width: "c.badge.height",
	height: "c.badge.height",
	borderRadius: "9999px",
	backgroundColor: "black",
	color: "white",
	fontSize: ".5em",
	flexShrink: "0",
});

export const Styles = {
	badge,
	dot,
};
