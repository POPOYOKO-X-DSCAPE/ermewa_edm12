import {
	Button as AriaButton,
	MenuButton,
	MenuProvider,
} from "@ariakit/react";
import { Menu, MenuItem } from "@ariakit/react";

import classNames from "classnames";
import type { ReactNode } from "react";
import type { Action } from "../../types";
import { Styles } from "./styles";

export type ButtonLevel = "primary" | "secondary" | "ghost";

interface IButtonProps {
	children: ReactNode;
	type?: "button" | "reset" | "submit";
	level?: ButtonLevel;
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
	"aria-label"?: string;
}

export const Button = ({
	children,
	type = "button",
	level = "primary",
	onClick,
	disabled,
	className,
	...aria
}: IButtonProps) => {
	const levelStyle =
		level === "secondary"
			? Styles.secondary
			: level === "ghost"
				? Styles.ghost
				: Styles.primary;

	return (
		<AriaButton
			onClick={onClick}
			className={classNames(
				Styles.common,
				levelStyle,
				disabled && Styles.disabled,
				className,
			)}
			type={type}
			disabled={disabled}
			{...aria}
		>
			{children}
		</AriaButton>
	);
};

Button.Menu = ({
	children,
	level = "secondary",
	items,
	placement = "bottom-start",
}: {
	children: ReactNode;
	level?: ButtonLevel;
	items: Action[];
	placement?: "bottom-end" | "bottom-start" | "top-end" | "top-start";
}) => {
	return (
		<MenuProvider placement={placement}>
			<MenuButton
				className={classNames(
					(level === "secondary" && Styles.secondary) ||
						Styles.secondary,
					Styles.common,
				)}
			>
				{children}
			</MenuButton>
			<Menu className={Styles.menu}>
				{items.map((child, index) => (
					<MenuItem
						// biome-ignore lint/suspicious/noArrayIndexKey: menu items are static per usage
						key={index}
						onClick={() => child.callback()}
						className={Styles.menuItem}
					>
						{child.icon}
						{child.label}
					</MenuItem>
				))}
			</Menu>
		</MenuProvider>
	);
};
