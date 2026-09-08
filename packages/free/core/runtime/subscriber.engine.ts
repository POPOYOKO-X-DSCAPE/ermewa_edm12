import {
	ReactiveKeys,
	type ReactiveKey,
	type ReactiveScope,
} from "./reactive-keys";

import { createScheduler } from "./scheduler.engine";

type Source = ReactiveKey;
type Model = ReactiveKey;

type Subscriber = () => void;

const getCurrentCapture = (stack: readonly Model[]): Model | undefined =>
	stack.length ? stack[stack.length - 1] : undefined;

export const createSubscriberEngine = () => {
	const scheduler = createScheduler();

	const captureStack: Model[] = [];

	const sourceToModels = new Map<Source, Set<Model>>();
	const scopeToSources = new Map<ReactiveScope, Set<Source>>();
	const modelToSources = new Map<Model, Set<Source>>();
	const modelSubscribers = new Map<Model, Set<Subscriber>>();
	const modelDirty = new Set<Model>();

	const removeSourceFromScopeIndex = (source: Source) => {
		const scope = ReactiveKeys.scope(source);
		const scopedSources = scopeToSources.get(scope);
		if (!scopedSources) return;

		scopedSources.delete(source);
		if (scopedSources.size === 0) {
			scopeToSources.delete(scope);
		}
	};

	const registerSourceInScopeIndex = (source: Source) => {
		const scope = ReactiveKeys.scope(source);
		let scopedSources = scopeToSources.get(scope);
		if (!scopedSources) {
			scopedSources = new Set();
			scopeToSources.set(scope, scopedSources);
		}

		scopedSources.add(source);
	};

	const unlinkModelFromSource = (model: Model, source: Source) => {
		const models = sourceToModels.get(source);
		if (!models) return;

		models.delete(model);
		if (models.size > 0) return;

		sourceToModels.delete(source);
		removeSourceFromScopeIndex(source);
	};

	const clearModelDependencies = (model: Model) => {
		const previousSources = modelToSources.get(model);
		if (!previousSources) return;

		for (const source of previousSources) {
			unlinkModelFromSource(model, source);
		}
	};

	const beginModel = (name: Model) => {
		captureStack.push(name);
		clearModelDependencies(name);
		modelToSources.set(name, new Set());
	};

	const endModel = () => {
		captureStack.pop();
	};

	const track = (source: Source) => {
		const currentModel = getCurrentCapture(captureStack);
		if (!currentModel) return;

		let sources = modelToSources.get(currentModel);
		if (!sources) {
			sources = new Set();
			modelToSources.set(currentModel, sources);
		}

		if (sources.has(source)) {
			return;
		}

		sources.add(source);

		let models = sourceToModels.get(source);
		if (!models) {
			models = new Set();
			sourceToModels.set(source, models);
			registerSourceInScopeIndex(source);
		}

		models.add(currentModel);
	};

	const markDirty = (model: Model) => {
		if (modelDirty.has(model)) return;
		modelDirty.add(model);
	};

	const collectDependents = (
		source: Source,
		dirtyModels: Set<Model>,
		visitedSources: Set<Source>,
	) => {
		if (visitedSources.has(source)) {
			return;
		}

		visitedSources.add(source);

		const scopedSources = scopeToSources.get(ReactiveKeys.scope(source));
		if (!scopedSources) {
			return;
		}

		for (const candidateSource of scopedSources) {
			if (!ReactiveKeys.isRelated(candidateSource, source)) {
				continue;
			}

			const models = sourceToModels.get(candidateSource);
			if (!models) {
				continue;
			}

			for (const model of models) {
				if (!dirtyModels.has(model)) {
					dirtyModels.add(model);
				}

				collectDependents(model, dirtyModels, visitedSources);
			}
		}
	};

	const flushDirtyModels = (dirtyModels: Iterable<Model>) => {
		for (const model of dirtyModels) {
			markDirty(model);

			const subs = modelSubscribers.get(model);
			if (!subs) continue;

			for (const cb of subs) {
				scheduler.schedule(cb);
			}
		}
	};

	const notifyMany = (sources: readonly Source[]) => {
		if (!sources.length) return;

		const dirtyModels = new Set<Model>();
		const visitedSources = new Set<Source>();
		const normalizedSources = ReactiveKeys.compact(sources);

		for (const source of normalizedSources) {
			collectDependents(source, dirtyModels, visitedSources);
		}

		flushDirtyModels(dirtyModels);
	};

	const notify = (source: Source) => {
		notifyMany([source]);
	};

	const subscribeModel = (model: Model, cb: Subscriber) => {
		let set = modelSubscribers.get(model);
		if (!set) {
			set = new Set();
			modelSubscribers.set(model, set);
		}

		set.add(cb);

		return () => {
			set?.delete(cb);
			if (set && set.size === 0) {
				modelSubscribers.delete(model);
			}
		};
	};

	const isDirty = (model: Model) => modelDirty.has(model);

	const clearDirty = (model: Model) => {
		modelDirty.delete(model);
	};

	return {
		beginModel,
		endModel,
		track,
		notify,
		notifyMany,
		subscribeModel,
		isDirty,
		clearDirty,
	};
};
