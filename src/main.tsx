import { createRoot } from "react-dom/client";

import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

import { AppContextProvider } from "@/presentation/contexts/app-context";
import { BrowserRouter as Router } from "react-router-dom";

import App from "./app";
// import './app/sandbox';

import "./main.scss";

// Use React 18's createRoot API
const container = document.getElementById("app") as HTMLElement;
const root = createRoot(container);

root.render(
	<Router basename={import.meta.env.PROD ? "app/EDM12/" : "/"}>
		<AppContextProvider>
			<App />
		</AppContextProvider>
	</Router>,
);
