import React, { type ReactNode } from "react";

interface IHeaderProps {
	children: ReactNode;
}

export const Header = ({ children }: IHeaderProps) => (
	<header>{children}</header>
);
