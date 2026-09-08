import { createRoot } from "react-dom/client";

import { BrowserRouter as Router } from "react-router-dom";

import { Snackbar } from "@packages/ui";
import { ColorModeProvider } from "./contexts/color-mode-context";

import App from "./app";

const container = document.getElementById("app") as HTMLElement;
const root = createRoot(container);

root.render(
	<Router basename={import.meta.env.PROD ? "app/EDM12/" : "/"}>
		<ColorModeProvider>
			<Snackbar.Provider>
				<App />
				<Snackbar.Card />
			</Snackbar.Provider>
		</ColorModeProvider>
	</Router>,
);
