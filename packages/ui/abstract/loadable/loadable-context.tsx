import { createContext, useContext } from "react";

interface LoadableContextType {
	isLoading: boolean;
	setIsLoading: (loading: boolean) => void;
}

export const Context = createContext<LoadableContextType | undefined>(
	undefined,
);

export const useLoadable = () => {
	const context = useContext(Context);
	if (!context) {
		throw new Error(
			"useLoadable must be used within a Loadable.Provider",
		);
	}
	return context;
};
