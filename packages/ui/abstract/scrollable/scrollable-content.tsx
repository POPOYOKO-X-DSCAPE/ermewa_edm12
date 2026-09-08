import { type ReactNode, useContext } from "react";
import { Context } from "./scrollable-context";

interface IContentProps {
	children: ReactNode;
}

export const Content = ({ children }: IContentProps) => {
	const context = useContext(Context);

	if (!context) {
		throw new Error("Content must be used within a Provider");
	}

	return <div onWheel={(e) => context.OnWheel(e)}>{children}</div>;
};
