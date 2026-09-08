import {
	Button as AriaButton,
	Tooltip,
	TooltipAnchor,
	TooltipProvider,
} from "@ariakit/react";
import {
	type RemixiconComponentType,
	RiMore2Line,
} from "@remixicon/react";
import type { ReactElement, ReactNode } from "react";
import React from "react";
import { Stack } from "../../abstract";
import { Button } from "../button/button";
import { Styles } from "./styles";

/**
 * Represents the properties for the SideBarAction component.
 *
 * @interface ISideBarAction
 * @property {ReactNode} icon - The icon to be displayed alongside the label.
 * @property {string} label - The label text for the action.
 * @property {function} callback - A function that is called when the action is triggered.
 */

interface ISideBarAction {
	icon: ReactNode;
	label: string;
	hideLabel?: boolean;
	callback: () => void;
}

/**
 * A component representing a single action in the sidebar.
 * It displays an icon and a label, and calls a callback function when clicked.
 *
 * @component
 * @param {ISideBarAction} props - The properties passed to the SideBarAction component.
 * @returns {JSX.Element} The rendered SideBarAction component.
 *
 * @example
 * <SideBarAction
 *   icon={<RiAccountCircleLine />}
 *   label="Profile"
 *   callback={() => console.log("Profile clicked")}
 * />
 */

export const SideBarAction = ({
	label,
	icon,
	callback,
	hideLabel,
}: ISideBarAction) => {
	return (
		<AriaButton onClick={callback} className={Styles.Button}>
			{!hideLabel ? (
				<>
					{icon}
					{label}
				</>
			) : (
				<TooltipProvider>
					<TooltipAnchor>{icon}</TooltipAnchor>
					<Tooltip>{label}</Tooltip>
				</TooltipProvider>
			)}
		</AriaButton>
	);
};

export const SideBarActions = ({
	children,
}: { children: ReactNode }) => {
	const filteredChildren = React.Children.toArray(children).filter(
		(child): child is ReactElement<ISideBarAction> =>
			React.isValidElement(child) && child.type === SideBarAction,
	);

	const displayIconsOnly = filteredChildren.length > 2;

	return (
		<Stack direction="row" alignItems="center">
			{displayIconsOnly ? (
				<Button.Menu
					placement="bottom-end"
					items={filteredChildren.map((child) => ({
						label: child.props.label,
						icon: child.props
							.icon as ReactElement<RemixiconComponentType>,
						callback: child.props.callback,
					}))}
					level="secondary"
				>
					<RiMore2Line />
				</Button.Menu>
			) : (
				filteredChildren.map((child, index) =>
					// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
					React.cloneElement(child, { key: index }),
				)
			)}
		</Stack>
	);
};
