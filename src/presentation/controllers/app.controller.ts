import { createController } from "@src/core/presentation.builder";

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
	typeof value === "object" && value !== null
		? (value as Record<string, unknown>)
		: undefined;

export const appController = createController(({ api, stores }) => ({
	loadAppProfile: async () => {
		const result = await api.ermewa.get.appProfile();
		console.log(result.value);

		if (!result.ok) {
			return result;
		}

		stores.appStore.patch({
			appProfile: result.value.data,
			xprmRaw: asRecord(result.value.raw),
		});

		return result;
	},
})).build();
