import { css } from "@styles";
import classNames from "classnames";
import type { KeyboardEvent, ReactNode } from "react";
import { styles } from "./styles";

interface CardProps {
	children: ReactNode;
	onClick?: () => void;
	className?: string;
}

const focusRing = css({
	"&:focus-visible": {
		outlineWidth: "2px",
		outlineStyle: "solid",
		outlineColor: "s.fg.default.initial",
		outlineOffset: "2px",
	},
});

export const Card = ({ children, onClick, className }: CardProps) => {
	const interactive = Boolean(onClick);

	const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (!onClick) return;
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			onClick();
		}
	};

	return (
		<article
			className={classNames(
				styles.container,
				interactive && styles.clickable,
				interactive && focusRing,
				"card",
				className,
			)}
			role={interactive ? "button" : undefined}
			tabIndex={interactive ? 0 : undefined}
			onClick={interactive ? onClick : undefined}
			onKeyDown={interactive ? handleKeyDown : undefined}
		>
			{children}
		</article>
	);
};
