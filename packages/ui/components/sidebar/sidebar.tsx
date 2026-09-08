import classNames from "classnames";
import type { ReactNode } from "react";
import { FilteredChildren } from "../../abstract/filtered-children/filtered-children";
import { Stack, type StackProps } from "../../abstract/stack/stack";
import { SideBarAction } from "./sidebar-action";
import { SideBarElement } from "./sidebar-element";
import { SideBarGroup } from "./sidebar-group";
import { Styles } from "./styles";

/**
 * Represents the properties for the SideBar component.
 *
 * @interface SideBarProps
 * @extends StackProps
 * @property {ReactNode} children - The child components that will be rendered inside the SideBar.
 */

export interface SideBarProps extends StackProps {
	children: ReactNode;
	/** Accessible name for the navigation region. */
	label?: string;
}

/**
 * A sidebar component to contain grouped actions and elements.
 *
 * The component organizes its children using stacks and allows for specific filtering
 * of child elements (like SideBarGroup and SideBarElement).
 *
 * @component
 * @param {SideBarProps} props - The properties passed to the SideBar component.
 * @returns {JSX.Element} The rendered SideBar component.
 *
 * @example
 * <SideBar>
 *   <SideBar.Group href="https://google.com">
 *     <SideBar.Action
 *       callback={() => console.log("something")}
 *       label="test"
 *       icon={<RiAccountPinBoxLine />}
 *     />
 *     <RiAccountCircleLine /> Profile
 *     <SideBar.Element>
 *       <RiSettings2Line /> Settings
 *     </SideBar.Element>
 *   </SideBar.Group>
 * </SideBar>
 */

export const SideBar = ({ children, label }: SideBarProps) => {
	return (
		<Stack
			className={classNames("sidebar", Styles.Main)}
			grow
			// biome-ignore lint/a11y/useSemanticElements: nav region via role
			role="navigation"
			ariaLabel={label}
		>
			<Stack>
				<FilteredChildren includes={[SideBarGroup, SideBarElement]}>
					{children}
				</FilteredChildren>
			</Stack>
		</Stack>
	);
};

/**
 * A group component for organizing sidebar actions and elements.
 * It can be expanded or collapsed, showcasing its child elements based on the user's interaction.
 *
 * @component
 * @param {SideBarGroupProps} props - The properties passed to the SideBarGroup component.
 * @returns {JSX.Element} The rendered SideBarGroup component.
 *
 * @example
 * <SideBarGroup isInitiallyOpen={true} onClick={() => console.log("Group clicked")}>
 *   <RiAccountCircleLine /> User Account
 *   <SideBarElement href="/profile">Profile</SideBarElement>
 *   <SideBarElement href="/settings">Settings</SideBarElement>
 * </SideBarGroup>
 */

SideBar.Group = SideBarGroup;

/**
 * Represents a single element in the SideBar.
 * Combines content and actions, allowing for click handling and external link navigation.
 *
 * @component
 * @param {SideBarElementProps} props - The properties passed to the SideBarElement component.
 * @returns {JSX.Element} The rendered SideBarElement component.
 *
 * @example
 * <SideBarElement
 *   href="https://example.com"
 *   onClick={() => console.log("Element clicked")}
 *   active={true}
 * >
 *   <RiAccountCircleLine /> Profile
 * </SideBarElement>
 */

SideBar.Element = SideBarElement;

/**
 * A container for managing multiple SideBarAction components.
 * It displays actions horizontally and can render a menu if there are too many actions to display at once.
 *
 * @component
 * @param {{ children: ReactNode }} props - The properties passed to the SideBarActions component.
 * @returns {JSX.Element} The rendered SideBarActions component.
 *
 * @example
 *
 * <SideBarAction
 *   icon={<RiAccountCircleLine />}
 *   label="Profile"
 *   callback={() => console.log("Profile clicked")}
 * />
 */

SideBar.Action = SideBarAction;
