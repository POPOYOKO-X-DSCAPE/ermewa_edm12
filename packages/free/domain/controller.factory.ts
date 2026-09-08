type BaseCtx<Api, Repos, Stores> = Readonly<{
	api: Api;
	repositories: Repos;
	stores: Stores;
}>;

type RefineCtx<Api, Repos, Stores, Controls> = Readonly<{
	api: Api;
	repositories: Repos;
	stores: Stores;
	controls: Controls;
}>;

type Merge<A, B> = Readonly<A & B>;

export const controllerFactory = <Api, Repos, Stores>(deps: {
	api: Api;
	repositories: Repos;
	stores: Stores;
}) => {
	function makeBuilder<Controls extends object>(
		factories: ReadonlyArray<
			(ctx: RefineCtx<Api, Repos, Stores, Controls>) => object
		>,
	) {
		return {
			refine<Added extends object>(
				refine: (ctx: RefineCtx<Api, Repos, Stores, Controls>) => Added,
			) {
				return makeBuilder<Merge<Controls, Added>>([
					...factories,
					refine,
				]);
			},

			build(): Readonly<Controls> {
				const controls = {} as Controls;

				const ctx: RefineCtx<Api, Repos, Stores, Controls> = {
					api: deps.api,
					repositories: deps.repositories,
					stores: deps.stores,
					controls,
				};

				for (const factory of factories) {
					const produced = factory(ctx);

					Object.assign(controls, produced);
				}

				return Object.freeze(controls);
			},
		} as const;
	}

	return function createController<Seed extends object>(
		seed: (ctx: BaseCtx<Api, Repos, Stores>) => Seed,
	) {
		const first = (ctx: RefineCtx<Api, Repos, Stores, Seed>) =>
			seed(ctx);

		return makeBuilder<Seed>([first]);
	};
};
