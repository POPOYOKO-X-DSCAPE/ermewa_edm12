import { css } from "@styles";
import type { ReactNode } from "react";

interface IEllipsisProps {
	children?: ReactNode;
}

const Styles = css({
	maxWidth: "100%",
	whiteSpace: "nowrap",
	overflowX: "hidden",
	textOverflow: "ellipsis",
	textAlign: "start",
	flexGrow: 1,
});

export const Ellipsis = ({ children }: IEllipsisProps) => {
	return <div className={Styles}>{children}</div>;
};
