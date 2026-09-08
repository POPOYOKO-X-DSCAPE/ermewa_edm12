import { keyframes } from "@packages/ui/theme/keyframes";
import {
	defineSemanticTokens,
	defineThemeContract,
} from "@pandacss/dev";
import { componentsTokens } from "./defaultTheme";
import { semantic } from "./semantic";

const fgDark = "rgba(250 250 250 / 0.93)";
const fgDarkHover = "rgba(250 250 250 / 0.78)";
const fgDarkMuted = "rgba(250 250 250 / 0.85)";

const darkSemanticColors = defineSemanticTokens.colors({
	s: {
		bg: {
			default: {
				initial: { value: { _dark: "#14111a" } },
				hover: { value: { _dark: "#2e2b34" } },
			},
			elevated: {
				initial: { value: { _dark: "#2e2b34" } },
				hover: { value: { _dark: "rgba(136 136 136 / 0.25)" } },
				active: { value: { _dark: "rgba(136 136 136 / 0.15)" } },
			},
			actionLow: {
				initial: { value: { _dark: "#2e2b34" } },
				hover: { value: { _dark: "#3e3b44" } },
			},
			actionHigh: {
				initial: { value: { _dark: "#6b3aff" } },
				hover: { value: { _dark: "#5f30f6" } },
			},
		},
		fg: {
			default: {
				initial: { value: { _dark: fgDark } },
				hover: { value: { _dark: fgDarkHover } },
			},
			elevated: {
				initial: { value: { _dark: fgDark } },
				hover: { value: { _dark: fgDarkHover } },
				active: { value: { _dark: "#864fff" } },
			},
			actionLow: {
				initial: { value: { _dark: "#864fff" } },
				hover: { value: { _dark: "#955bff" } },
			},
			actionHigh: {
				initial: { value: { _dark: "#FAFAFA" } },
				hover: { value: { _dark: fgDarkMuted } },
			},
		},
	},
});

const themeContract = defineThemeContract({
	semanticTokens: componentsTokens,
});

const semanticTokens = {
	...componentsTokens,
	colors: {
		...componentsTokens.colors,
		s: darkSemanticColors.s,
	},
};

// biome-ignore lint/suspicious/noExplicitAny: Panda semantic tokens accept condition objects ({ _dark }) that the contract types do not model
const themeSemanticTokens: any = semanticTokens;

export const theme = themeContract({
	tokens: semantic,
	semanticTokens: themeSemanticTokens,
	keyframes,
});
