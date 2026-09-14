import { css } from "@styles";
import classNames from "classnames";
import type React from "react";
import { forwardRef } from "react";
import "../../../../styled-system/styles.css";
import { Stack } from "../stack/stack";

interface AppProps {
	children: React.ReactNode;
	className?: string;
}

const panda = css({
	bg: "c.app.bg",
	color: "c.app.fg",
	width: "100vw",
	height: "100vh",
	maxWidth: "100vw",
	maxHeight: "100vh",
	"& button": {
		display: "flex",
		alignItems: "stretch",
		justifyContent: "stretch",
	},
});

export const App = forwardRef<HTMLDivElement, AppProps>(
	({ children, className }, ref) => {
		return (
			<Stack
				ref={ref}
				direction="column"
				className={classNames("app", panda, className)}
			>
				{children}
			</Stack>
		);
	},
);

App.displayName = "App";