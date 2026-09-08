import { defineKeyframes } from "@pandacss/dev";

// Kit-wide keyframes. Applied to each project's panda.config `theme` so the
// `@keyframes loaderSpin` block is emitted into the generated CSS (required by
// the kit `Spinner`, which uses a raw `animation` shorthand referencing it).
export const keyframes = defineKeyframes({
	loaderSpin: {
		to: {
			transform: "rotate(360deg)",
		},
	},
});
