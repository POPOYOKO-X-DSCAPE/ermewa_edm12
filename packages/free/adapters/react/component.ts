import React from "react";
import { ReactiveKeys } from "../../core/runtime/reactive-keys";
import { useSubscription } from "./use-subscription";

type SubscriberEngine = {
	beginModel(name: string): void;
	endModel(): void;
	subscribeModel(model: string, cb: () => void): () => void;
};

export const createReactRenderer =
	(subscriber: SubscriberEngine) =>
	<
		M extends Record<string, unknown>,
		C extends Record<string, unknown>,
	>(deps: {
		models: M;
		controllers: C;
	}) =>
	<Props extends Record<string, unknown> = Record<string, never>>(
		render: (ctx: {
			models: M;
			controllers: C;
			props: Props & { children?: unknown };
		}) => React.ReactNode,
	) =>
	(props: Props & { children?: unknown }) => {
		const componentId = React.useMemo(
			() => ReactiveKeys.component(crypto.randomUUID()),
			[],
		);

		useSubscription(subscriber, componentId);

		subscriber.beginModel(componentId);

		const result = render({
			models: deps.models,
			controllers: deps.controllers,
			props,
		});

		subscriber.endModel();

		return result;
	};
