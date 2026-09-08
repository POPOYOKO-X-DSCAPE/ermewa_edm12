import { createReactRenderer } from "../adapters/react/component";

import { ReactiveKeys } from "../core/runtime/reactive-keys";

type Models = Record<string, unknown>;
type Controllers = Record<string, unknown>;

type SubscriberEngine = {
	beginModel(name: string): void;
	endModel(): void;
	subscribeModel(model: string, cb: () => void): () => void;
};

type Renderer<Output> = <
	M extends Models,
	C extends Controllers,
>(deps: {
	models: M;
	controllers: C;
}) => <Props extends Record<string, unknown> = Record<string, never>>(
	render: (ctx: {
		models: M;
		controllers: C;
		props: Props & { children?: unknown };
	}) => Output,
) => (props: Props & { children?: unknown }) => Output;

export const baseComponentFactory = ({
	subscriber,
}: {
	subscriber: SubscriberEngine;
}) => {
	const createRenderer =
		<Output>(): Renderer<Output> =>
		(deps) => {
			const { models, controllers } = deps;

			return function createComponent<
				Props extends Record<string, unknown> = Record<string, never>,
			>(
				render: (ctx: {
					models: typeof models;
					controllers: typeof controllers;
					props: Props & { children?: unknown };
				}) => Output,
			) {
				return function Component(
					props: Props & { children?: unknown },
				): Output {
					const componentId = ReactiveKeys.component(
						crypto.randomUUID(),
					);
					let unsubscribe: (() => void) | undefined;

					const rerender = () => {
						console.log("[COMPONENT RERENDER]", componentId);
						output = run();
					};

					const run = () => {
						console.log("[COMPONENT RUN]", componentId);

						subscriber.beginModel(componentId);

						const result = render({
							models,
							controllers,
							props,
						});

						subscriber.endModel();

						if (!unsubscribe) {
							unsubscribe = subscriber.subscribeModel(
								componentId,
								rerender,
							);
						}

						return result;
					};

					let output = run();

					return output;
				};
			};
		};

	return {
		react: createReactRenderer(subscriber),
		dom: createRenderer<HTMLElement>(),
		ssr: createRenderer<string>(),
	};
};
