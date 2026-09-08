import {
	Button as AriaButton,
	Tooltip,
	TooltipAnchor,
	TooltipProvider,
} from "@ariakit/react";
import { Button, Stack } from "@packages/ui";
import {
	type RemixiconComponentType,
	RiMore2Line,
} from "@remixicon/react";
import type { SidebarAction } from "@src/presentation/contracts/side-bar.interface";
import type { ReactElement } from "react";
import { memo } from "react";
import { Styles } from "./styles";

const SideBarActionButton = memo(
	({ action }: { action: SidebarAction }) => (
		<AriaButton
			onClick={action.handler}
			className={Styles.actionButton}
		>
			<TooltipProvider>
				<TooltipAnchor>{action.icon}</TooltipAnchor>
				<Tooltip>{action.label}</Tooltip>
			</TooltipProvider>
		</AriaButton>
	),
);

export const SideBarActionButtons = memo(
	({ actions = [] }: { actions?: readonly SidebarAction[] }) => {
		const visibleActions = actions.filter(({ hidden }) => !hidden);
		if (!visibleActions.length) {
			return null;
		}

		if (visibleActions.length > 2) {
			return (
				<Stack direction="row" alignItems="center">
					<Button.Menu
						placement="bottom-end"
						items={visibleActions.map((action) => ({
							label: action.label,
							icon: action.icon as ReactElement<RemixiconComponentType>,
							callback: action.handler,
						}))}
						level="secondary"
					>
						<RiMore2Line />
					</Button.Menu>
				</Stack>
			);
		}

		return (
			<Stack direction="row" alignItems="center">
				{visibleActions.map((action) => (
					<SideBarActionButton key={action.id} action={action} />
				))}
			</Stack>
		);
	},
);
