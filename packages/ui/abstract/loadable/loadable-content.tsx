import type { ReactNode } from "react";
import { useLoadable } from "./loadable-context";

interface LoadableContentProps {
	children: ReactNode;
}

export const LoadableContent = ({ children }: LoadableContentProps) => {
	const { isLoading } = useLoadable();

	if (isLoading) {
		return <div style={{ display: "none" }}>{children}</div>;
	}

	return children;
};
