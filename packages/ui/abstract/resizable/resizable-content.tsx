import { type ReactNode, useContext } from "react";
import { Context } from "./resizable-context";

interface IContentProps {
	children: ReactNode;
}

export const Content = ({ children }: IContentProps) => {
	const context = useContext(Context);

	if (!context) {
		throw new Error("Content must be used within a Provider");
	}

	return (
		<div
			style={{
				overflow: "clip",
				maxHeight: "100%",
				display: "flex",
			}}
		>
			{children}
		</div>
	);
};
