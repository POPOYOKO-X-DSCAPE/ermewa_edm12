import * as Ariakit from "@ariakit/react";
import { css } from "@styles";
import classNames from "classnames";
import type React from "react";

const styles = {
	overlay: css({
		backgroundColor: "rgb(0 0 0 / 0.6)",
		backdropBlur: "4px",
	}),
	card: css({
		position: "absolute",
		transform: "translate(-50%, -50%)",
		top: "50vh",
		left: "50vw",
		padding: "s.padding.l",
		borderRadius: "b.radius.m",
		backgroundColor: "s.bg.elevated.initial",
	}),
};

interface DialogProps {
	children: React.ReactNode;
	isOpen?: boolean;
	closeButtonContent: React.ReactNode;
	onClose: () => void;
}

export const Dialog = ({
	children,
	isOpen = false,
	onClose,
}: DialogProps) => {
	return (
		<Ariakit.Dialog
			open={isOpen}
			onClose={() => onClose()}
			className={classNames(styles.card)}
			backdrop={<div className={classNames(styles.overlay)} />}
		>
			{children}
		</Ariakit.Dialog>
	);
};
