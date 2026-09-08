import { css } from "@styles";
import classNames from "classnames";
import { useContext } from "react";
import type { PositionCombo } from "../../abstract/abstract/abstract";
import { Stack } from "../../abstract/stack/stack";
import { Button } from "../button/button";
import { Context } from "./snackbar-context";

interface ISnackbarProps {
	positionCombo?: PositionCombo;
}

export const Card = ({ positionCombo }: ISnackbarProps) => {
	const snackbarContext = useContext(Context);

	if (!snackbarContext) {
		throw new Error("Content must be used within a Provider");
	}

	const styles = {
		snackbar: css({
			padding: "c.snackbar.padding",
			margin: "c.snackbar.margin",
			backgroundColor: "c.snackbar.bg",
			color: "c.snackbar.fg",
			width: "c.snackbar.width",
			borderColor: "c.snackbar.fg",
			border: "1px solid",
			right: 0,
			bottom: -100,
			opacity: 0,
			rounded: "c.snackbar.radius",
			gap: "c.snackbar.padding",
			transition: "all ease-in 1s",
		}),
		show: css({
			bottom: "0 !important",
			opacity: "1 !important",
			transition: "all ease-in-out .6s",
		}),
		inner: css({
			gap: "c.snackbar.padding",
		}),
	};

	return (
		<Stack
			className={classNames(styles.snackbar, {
				[styles.show]: snackbarContext.isVisible,
			})}
			// biome-ignore lint/a11y/useSemanticElements: status region via role
			role="status"
			aria-live="polite"
			position={{
				type: "relativeToApp",
				position: positionCombo || ["bottom", "right"],
			}}
		>
			<Stack
				alignItems="center"
				direction="row"
				className={styles.inner}
			>
				{snackbarContext.message}
				<Button onClick={() => snackbarContext.hide()}>Hide</Button>
			</Stack>
		</Stack>
	);
};
