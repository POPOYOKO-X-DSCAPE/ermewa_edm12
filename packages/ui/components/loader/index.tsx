import { css } from "@styles";
import classNames from "classnames";
import { bg } from "../../theme/semantic/colors";
import { sizes } from "../../theme/semantic/sizes";

const srOnly = css({
	position: "absolute",
	clip: "rect(0 0 0 0)",
	width: "1px",
	height: "1px",
	overflow: "hidden",
	whiteSpace: "nowrap",
});

const panda = css({
	position: "relative",
	"&::before": {
		content: "''",
		display: "inline-block",
		boxSizing: "border-box",
		width: sizes.loaderSpin.value,
		aspectRatio: "1 / 1",
		borderWidth: "4px",
		borderStyle: "solid",
		borderBottomStyle: "solid",
		borderColor: bg.actionHigh.initial.value,
		borderBottomColor: "transparent",
		borderRadius: "50%",
		animation: "loaderSpin 1s linear infinite",
	},
});

interface SpinnerProps {
	/** Accessible announcement for screen readers (defaults to "Loading"). */
	label?: string;
}

export const Spinner = ({ label = "Loading" }: SpinnerProps) => (
	// biome-ignore lint/a11y/useSemanticElements: role=status is a valid status region
	<span className={classNames(panda)} role="status">
		<span className={srOnly}>{label}</span>
	</span>
);
