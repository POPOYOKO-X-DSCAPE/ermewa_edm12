import { Heading } from "@ariakit/react";
import { Button } from "@packages/ui";
import { RiMoonLine, RiSunLine } from "@remixicon/react";
import classNames from "classnames";

import { useColorMode } from "@src/contexts/color-mode-context";
import { Icon } from "@src/presentation/components/icon";
import { Styles } from "./styles";

export type AppHeaderViewProps = Readonly<{
	appName: string;
	title?: string;
	version: string;
	login?: string;
	foldersLabel: string;
	today: string;
	onFoldersClick: () => void;
	onReloadClick: () => void;
}>;

export const AppHeaderView = ({
	appName,
	title,
	version,
	login,
	foldersLabel,
	today,
	onFoldersClick,
	onReloadClick,
}: AppHeaderViewProps) => {
	const displayLogin = login?.trim();
	const { colorMode, setColorMode } = useColorMode();

	return (
		<header className={Styles.header}>
			<div className={classNames(Styles.appName)}>
				<Heading className={Styles.appTitle}>
					{appName}&nbsp;
					<br />
					<span className={Styles.appMeta}>
						<span className={Styles.version}>{version}</span>
						{" · "}
						{today}
						{" · "}
						{displayLogin}
					</span>
				</Heading>
			</div>

			{title ? <div className={Styles.wagon}>{title}</div> : null}

			<div className={Styles.right}>
				<Button level="secondary" onClick={onFoldersClick}>
					<Icon.MenuSearch size="small" />
					{foldersLabel}
				</Button>

				<Button
					level="secondary"
					onClick={() =>
						setColorMode((prev) =>
							prev === "light" ? "dark" : "light",
						)
					}
				>
					{colorMode === "light" ? <RiMoonLine /> : <RiSunLine />}
				</Button>

				{displayLogin && (
					/* biome-ignore lint/a11y/useKeyWithClickEvents: parity with existing header affordance */
					<div
						className={Styles.loggedUser}
						title={displayLogin}
						onClick={onReloadClick}
					>
						{displayLogin[0] ?? "?"}
					</div>
				)}
			</div>
		</header>
	);
};
