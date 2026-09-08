import { css } from "@styles";

const dot = css({
	width: "1em",
	height: "1em",
	borderRadius: "1em",
});

const STATUS_COLORS: Record<number, string> = {
	0: "grey",
	1: "orange",
	2: "green",
	3: "red",
	4: "black",
	5: "lavender",
};

/**
 * Generic document status indicator dot. Renders a small colored dot from a
 * numeric status code; color mapping is the canonical document status set.
 */
export const StatusDot = ({ statusType }: { statusType: number }) => (
	<span
		className={dot}
		style={{ backgroundColor: STATUS_COLORS[statusType] ?? "black" }}
		aria-label={`Status ${statusType}`}
		role="img"
	/>
);
