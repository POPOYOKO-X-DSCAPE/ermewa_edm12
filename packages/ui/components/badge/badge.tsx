import { Stack } from "@packages/ui";
import type { ReactNode } from "react";
import { Styles } from "./styles";

interface IBadgeProps {
	children: ReactNode;
}

export const Badge = ({ children }: IBadgeProps) => {
	return (
		<Stack
			className={Styles.badge}
			alignItems="center"
			justifyContent="center"
		>
			{children}
		</Stack>
	);
};
