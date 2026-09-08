import type { ReactNode } from "react";
import { Spinner } from "../../components/loader";
import { useLoadable } from "./loadable-context";

interface LoadableLoaderProps {
	children: ReactNode;
}

export const LoadableLoader = ({ children }: LoadableLoaderProps) => {
	const { isLoading } = useLoadable();

	if (!isLoading) {
		return;
	}

	return children;
};
