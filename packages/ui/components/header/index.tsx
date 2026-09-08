import { css } from "@styles";
import classNames from "classnames";
import type { ReactNode } from "react";

interface IHeaderProps {
	children: ReactNode;
}

const panda = css({
	bg: "c.header.bg",
	color: "c.header.fg",
	position: "sticky",
	padding: "c.header.padding",
});

export const Header = ({ children }: IHeaderProps) => (
	<header className={classNames(panda)}>{children}</header>
);
