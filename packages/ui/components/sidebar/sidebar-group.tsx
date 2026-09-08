import {
	Disclosure,
	DisclosureContent,
	useDisclosureStore,
} from "@ariakit/react";
import {
	RiArrowDownSLine,
	RiArrowUpSLine,
	RiLoaderLine,
} from "@remixicon/react";
import classNames from "classnames";
import { useState, useTransition } from "react";
import { FilteredChildren } from "../../abstract";
import { Stack } from "../../abstract/stack/stack";
import { SideBarAction, SideBarActions } from "./sidebar-action";
import {
	SideBarElement,
	SideBarElementContent,
	type SideBarElementProps,
} from "./sidebar-element";
import { Styles } from "./styles";

interface BaseSideBarGroupProps extends SideBarElementProps {
	isInitiallyOpen?: boolean;
	onClick?: (event?: React.MouseEvent) => void;
}

type WithToggle = BaseSideBarGroupProps & {
	onToggle: (event?: React.MouseEvent) => void;
	onOpen?: never;
	onClose?: never;
};

type WithOpenClose = BaseSideBarGroupProps & {
	onToggle?: never;
	onOpen?: (event?: React.MouseEvent) => void;
	onClose?: (event?: React.MouseEvent) => void;
};

export type SideBarGroupProps = WithToggle | WithOpenClose;

export const SideBarGroup = ({
	children,
	active,
	isInitiallyOpen = false,
	href,
	onClick,
	onToggle,
	onOpen,
	onClose,
}: SideBarGroupProps) => {
	const [isOpen, setIsOpen] = useState(isInitiallyOpen);
	const [isPending, startTransition] = useTransition();

	const disclosure = useDisclosureStore({
		open: isOpen,
		setOpen: (open: boolean) => {
			startTransition(() => {
				setIsOpen(open);
			});
		},
	});

	const handleDisclosureEvents = () => {
		if (onToggle) {
			onToggle();
		} else {
			const isCurrentlyOpen = disclosure.getState().open;
			if (isCurrentlyOpen) {
				if (onClose) {
					onClose();
				}
			} else {
				if (onOpen) {
					onOpen();
				}
			}
		}
	};

	return (
		<Stack grow>
			{onClick || href ? (
				<Stack
					direction="row"
					className={classNames({ [Styles.Active]: active })}
				>
					<SideBarElementContent href={href} onClick={onClick}>
						<FilteredChildren
							excludes={[SideBarElement, SideBarAction, SideBarGroup]}
						>
							{children}
						</FilteredChildren>
					</SideBarElementContent>
					<SideBarActions>{children}</SideBarActions>
					<Disclosure
						store={disclosure}
						onClick={handleDisclosureEvents}
					>
						<Stack
							alignItems="center"
							direction="row"
							className={Styles.Button}
						>
							{isPending ? (
								<RiLoaderLine />
							) : isOpen ? (
								<RiArrowUpSLine />
							) : (
								<RiArrowDownSLine />
							)}
						</Stack>
					</Disclosure>
				</Stack>
			) : (
				<Disclosure store={disclosure} onClick={handleDisclosureEvents}>
					<Stack
						grow
						direction="row"
						className={classNames(Styles.Button, {
							[Styles.Active]: active,
						})}
						alignItems="center"
					>
						<Stack
							grow
							direction="row"
							className={Styles.ElementContent}
						>
							<FilteredChildren
								excludes={[SideBarElement, SideBarAction, SideBarGroup]}
							>
								{children}
							</FilteredChildren>
							<SideBarActions>{children}</SideBarActions>
						</Stack>
						<Stack className={Styles.DisclosureIcon}>
							{isPending ? (
								<RiLoaderLine />
							) : isOpen ? (
								<RiArrowUpSLine />
							) : (
								<RiArrowDownSLine />
							)}
						</Stack>
					</Stack>
				</Disclosure>
			)}
			<DisclosureContent store={disclosure}>
				<Stack grow className={Styles.Group}>
					<FilteredChildren
						includes={[SideBarElement, SideBarGroup]}
						excludes={[SideBarAction]}
					>
						{children}
					</FilteredChildren>
				</Stack>
			</DisclosureContent>
		</Stack>
	);
};
