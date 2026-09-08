import { Button as AriaButton } from "@ariakit/react";
import classNames from "classnames";
import { FilteredChildren } from "../../abstract";
import { Stack } from "../../abstract/stack/stack";
import { SideBarAction, SideBarActions } from "./sidebar-action";
import { Styles } from "./styles";

/**
 * Represents the properties for the SideBarElement component.
 *
 * @interface SideBarElementProps
 * @property {React.ReactNode} children - The child components or elements to render within the SideBarElement.
 * @property {string} [href] - Optional. A URL for linking when the element is used as a navigation link.
 * @property {function} [onClick] - Optional. A callback function invoked when the element is clicked.
 * @property {boolean} [active] - Optional. A flag indicating whether the element is active or highlighted.
 */

export interface SideBarElementProps {
	children: React.ReactNode;
	href?: string;
	onClick?: () => void;
	active?: boolean;
}

/**
 * Renders the content of the SideBarElement.
 * Handles both internal click handlers and external links.
 *
 * @component
 * @param {Omit<SideBarElementProps, "isActive">} props - The properties passed to the SideBarElementContent component.
 * @returns {JSX.Element} The rendered SideBarElementContent component.
 */

export const SideBarElementContent = ({
	children,
	href,
	onClick,
}: Omit<SideBarElementProps, "isActive">) => {
	const isLinkExternal = href
		? href.startsWith("http://") || href.startsWith("https://")
		: false;
	return (
		<Stack direction="row" alignItems="center" grow>
			{onClick ? (
				<AriaButton
					onClick={onClick}
					className={classNames(Styles.Button)}
				>
					<Stack grow direction="row" className={Styles.ElementContent}>
						<FilteredChildren excludes={[SideBarAction]}>
							{children}
						</FilteredChildren>
					</Stack>
				</AriaButton>
			) : href ? (
				<AriaButton
					className={Styles.Button}
					render={
						<a
							href={href || "#"}
							target={isLinkExternal ? "_blank" : "_self"}
							rel={isLinkExternal ? "noopener noreferrer" : undefined}
						>
							<Stack grow direction="row">
								<FilteredChildren excludes={[SideBarAction]}>
									{children}
								</FilteredChildren>
							</Stack>
						</a>
					}
				/>
			) : (
				<Stack direction="row" className={Styles.Button}>
					<FilteredChildren excludes={[SideBarAction]}>
						{children}
					</FilteredChildren>
				</Stack>
			)}
		</Stack>
	);
};

export const SideBarElement = ({
	children,
	href,
	onClick,
	active,
}: SideBarElementProps) => {
	return (
		<Stack
			className={classNames({
				[Styles.Active]: active,
			})}
			direction="row"
		>
			<SideBarElementContent onClick={onClick} href={href}>
				{children}
			</SideBarElementContent>
			<SideBarActions>{children}</SideBarActions>
		</Stack>
	);
};
