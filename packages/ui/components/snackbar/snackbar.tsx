import { useContext } from "react";
import { Card } from "./snackbar-card";
import { Context } from "./snackbar-context";
import { Provider } from "./snackbar-provider";

export const Snackbar = {
	Provider,
	Context,
	Card,
};

export const useSnackbarContext = () => {
	const context = useContext(Snackbar.Context);

	if (!context) {
		throw new Error(
			"useSnackbarContext must be used within the scope of AppContextProvider.",
		);
	}

	return context;
};
