import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useState,
} from "react";

type ColorMode = "light" | "dark";

const STORAGE_KEY = "edm12.color-mode";

interface ColorModeContextType {
	colorMode: ColorMode;
	setColorMode: (
		mode: ColorMode | ((prevMode: ColorMode) => ColorMode),
	) => void;
}

const ColorModeContext = createContext<
	ColorModeContextType | undefined
>(undefined);

function readStoredMode(): ColorMode {
	if (typeof window === "undefined") return "light";
	try {
		const stored = window.localStorage.getItem(STORAGE_KEY);
		return stored === "dark" ? "dark" : "light";
	} catch {
		return "light";
	}
}

export const ColorModeProvider = ({
	children,
}: { children: ReactNode }) => {
	const [colorMode, setColorMode] = useState<ColorMode>(readStoredMode);

	useEffect(() => {
		document.documentElement.setAttribute("data-color-mode", colorMode);
		try {
			window.localStorage.setItem(STORAGE_KEY, colorMode);
		} catch {
			/* storage unavailable — mode still applies in-memory */
		}
	}, [colorMode]);

	return (
		<ColorModeContext.Provider value={{ colorMode, setColorMode }}>
			{children}
		</ColorModeContext.Provider>
	);
};

export const useColorMode = (): ColorModeContextType => {
	const context = useContext(ColorModeContext);
	if (context === undefined) {
		throw new Error(
			"useColorMode must be used within a ColorModeProvider",
		);
	}
	return context;
};
