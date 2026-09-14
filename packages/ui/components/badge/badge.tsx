import { Stack } from "@packages/ui";
import classNames from "classnames";
import type { ReactNode } from "react";
import { Styles } from "./styles";

interface IBadgeProps {
	children: ReactNode;
	className?: string;
}

// Token-driven pill (c.badge.*). Themed consumers pass a className carrying
// their box (paddings/typography) and may prefix children with an icon or
// other leading node — the pill is a centered row. With no className the
// badge falls back to a minimal count circle (c.badge.height, .5em text) so
// unthemed usages keep working.
export const Badge = ({ children, className }: IBadgeProps) => {
	return (
		<Stack
			direction="row"
			className={classNames(
				className ? classNames(Styles.badge, className) : Styles.dot,
			)}
			alignItems="center"
			justifyContent="center"
		>
			{children}
		</Stack>
	);
};
