import { type ReactNode, useCallback, useState } from "react";
import { Context } from "./loadable-context";

interface LoadableProviderProps {
	children: ReactNode;
	initialLoading?: boolean;
}

export const LoadableProvider = ({
	children,
	initialLoading,
}: LoadableProviderProps) => {
	const [isLoading, setIsLoadingState] = useState(
		initialLoading ?? true,
	);

	const setIsLoading = useCallback((loading: boolean) => {
		setIsLoadingState(loading);
	}, []);

	return (
		<Context.Provider value={{ isLoading, setIsLoading }}>
			{children}
		</Context.Provider>
	);
};
