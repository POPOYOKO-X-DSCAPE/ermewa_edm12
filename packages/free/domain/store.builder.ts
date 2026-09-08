import type {
	DefinitionHelpers,
	EntityField,
} from "../core/dsl/state.definition";
import type { InferEntityState } from "../core/infer/state.infer";
import {
	ReactiveKeys,
	type ReactiveKey,
} from "../core/runtime/reactive-keys";
import { makeRefBuilder } from "../core/runtime/refs.runtime";
import {
	type StateInstance,
	makeStateInstance,
} from "../core/runtime/state.instance";
import type { RuntimeEntityField } from "../core/runtime/state.validation";
import type { Kind } from "../core/symbols";
import { makeDictField } from "./schema.builder";

type TypeEngineLike<D extends Record<string, unknown>> = {
	load(): D;
};

type SubscriberEngine = {
	notify(source: string): void;
	notifyMany?: (sources: readonly ReactiveKey[]) => void;
};

export type StoreInstance<TState extends Record<PropertyKey, unknown>> =
	StateInstance<TState>;

export const storeBuilder = <
	D extends Record<string, unknown>,
	const ENames extends readonly string[],
>(deps: {
	appTypes: TypeEngineLike<D>;
	entityNames: ENames;
	refs: { [K in ENames[number]]: Kind<K> };
	subscriber: SubscriberEngine;
}) => {
	const { appTypes, refs, subscriber } = deps;
	const types = appTypes.load();

	return {
		createStore: <S extends Record<string, EntityField<D>>>(
			name: string,
			definition: (helpers: DefinitionHelpers<D, typeof refs>) => S,
		) => {
			const schema = definition({
				array: (of) => ({ __kind: "array", of }),
				optional: (of) => ({ __kind: "opt", of }),
				oneOf: (...values) =>
					({
						__kind: "oneOf",
						values,
					}) as const,
				dict: (of) => makeDictField(of),
				lazy: (of) => ({
					__kind: "lazy",
					of,
					get: () => {
						throw new Error("lazy.get should never be called directly");
					},
				}),
				ref: {
					hasOne: () => makeRefBuilder(1),
					has: <MIN extends number>(min: MIN) => makeRefBuilder(min),
				},
				refs,
			});

			type State = InferEntityState<typeof types, S>;
			const rootKey = ReactiveKeys.store(name);

			const notifyStoreSources = (sources: readonly ReactiveKey[]) => {
				if (!sources.length) {
					return;
				}

				if (typeof subscriber.notifyMany === "function") {
					subscriber.notifyMany(sources);
					return;
				}

				for (const source of sources) {
					subscriber.notify(source);
				}
			};

			return (initial: State): StoreInstance<State> =>
				makeStateInstance<State>({
					types: types as Record<
						string,
						readonly ((v: unknown) => boolean | string)[]
					>,
					schema: schema as Record<string, RuntimeEntityField>,
					initial,
					notifyPaths: (paths) => {
						const uniqueSources = new Set<ReactiveKey>();

						for (const path of paths) {
							uniqueSources.add(
								path.length
									? ReactiveKeys.store(name, ...path)
									: rootKey,
							);
						}

						notifyStoreSources(Array.from(uniqueSources));
					},
				});
		},
	};
};
