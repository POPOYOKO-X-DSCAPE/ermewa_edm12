import base from "./panda.custom.config";
import { defineConfig } from "@pandacss/dev";

export default defineConfig({
	...base,
	include: ["./src/**/*.{js,jsx,ts,tsx}", "./packages/**/*.{js,jsx,ts,tsx}"],
});
