import { useSyncExternalStore } from "react";

type SubscriberEngine = {
	subscribeModel(model: string, cb: () => void): () => void;
};

let version = 0;

export const useSubscription = (
	subscriber: SubscriberEngine,
	modelKey: string,
) => {
	return useSyncExternalStore(
		(cb) =>
			subscriber.subscribeModel(modelKey, () => {
				version++;
				cb();
			}),
		() => version,
	);
};
