import type { ComponentChildren } from "preact";

import "./index.scss";

interface SnackbarProps {
	children: ComponentChildren;
	onClick: () => void;
}

export const Snackbar = ({ children, onClick }: SnackbarProps) => {
	return (
		<button className={"snackbar"} onClick={() => onClick()}>
			{children}
		</button>
	);
};
