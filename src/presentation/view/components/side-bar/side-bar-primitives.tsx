import {
	Button as AriaButton,
	Disclosure,
	DisclosureContent,
	useDisclosureStore,
} from "@ariakit/react";
import { Ellipsis, Stack } from "@packages/ui";
import {
	RiArrowDownSLine,
	RiArrowUpSLine,
	RiLoaderLine,
} from "@remixicon/react";
import classNames from "classnames";
import { type ReactNode, memo, useState, useTransition } from "react";
import { Styles } from "./styles";

type RowActions = ReactNode;

export const SideBarShell = memo(
	({ children }: { children: ReactNode }) => (
		<Stack className={classNames("sidebar", Styles.main)} grow>
			<Stack>{children}</Stack>
		</Stack>
	),
);

const SideBarElementContent = memo(
	({
		content,
		onClick,
	}: {
		content: ReactNode;
		onClick?: () => void;
	}) => {
		if (onClick) {
			return (
				<AriaButton onClick={onClick} className={Styles.ariaFullWidth}>
					<Stack
						direction="row"
						alignItems="center"
						grow
						className={Styles.button}
					>
						{content}
					</Stack>
				</AriaButton>
			);
		}

		return (
			<Stack
				grow
				direction="row"
				className={classNames(Styles.button)}
				alignItems="center"
			>
				{content}
			</Stack>
		);
	},
);

export const SideBarElementRow = memo(
	({
		content,
		actions,
		onClick,
		active,
	}: {
		content: ReactNode;
		actions?: RowActions;
		onClick?: () => void;
		active?: boolean;
	}) => {
		return (
			<Stack
				className={classNames(
					{
						[Styles.active]: active,
					},
					Styles.wrapper,
				)}
				direction="row"
				alignItems="center"
			>
				<Ellipsis>
					<Stack
						grow
						className={Styles.elementContent}
						alignItems="center"
						direction="row"
					>
						<SideBarElementContent
							content={content}
							onClick={onClick}
						/>
					</Stack>
				</Ellipsis>
				{actions}
			</Stack>
		);
	},
);

export const SideBarGroupRow = memo(
	({
		header,
		actions,
		children,
		isInitiallyOpen = false,
		onOpen,
		active,
		isLoading = false,
	}: {
		header: ReactNode;
		actions?: RowActions;
		children?: ReactNode;
		isInitiallyOpen?: boolean;
		onOpen?: () => void;
		active?: boolean;
		isLoading?: boolean;
	}) => {
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

		const handleDisclosure = () => {
			const nextOpen = !disclosure.getState().open;
			if (nextOpen) {
				onOpen?.();
			}
		};

		return (
			<Stack grow>
				<Disclosure store={disclosure} onClick={handleDisclosure}>
					<Stack
						grow
						direction="row"
						className={classNames(
							Styles.button,
							{
								[Styles.active]: active,
							},
							Styles.wrapper,
						)}
						alignItems="center"
					>
						<Ellipsis>
							<Stack
								grow
								direction="row"
								className={Styles.elementContent}
								alignItems="center"
							>
								{header}
							</Stack>
						</Ellipsis>
						{actions}
						<Stack className={classNames(Styles.disclosureIcon)}>
							{isLoading || isPending ? (
								<RiLoaderLine />
							) : isOpen ? (
								<RiArrowUpSLine />
							) : (
								<RiArrowDownSLine />
							)}
						</Stack>
					</Stack>
				</Disclosure>
				<DisclosureContent store={disclosure}>
					<Stack grow className={Styles.group}>
						{children}
					</Stack>
				</DisclosureContent>
			</Stack>
		);
	},
);
