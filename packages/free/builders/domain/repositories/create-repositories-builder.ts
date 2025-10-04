import type { SchemaBuilderResult, TypeDefinitions } from "../../core/types";
import type { Entity, Repository, RepositoryConfig } from "../types";

import { faker } from "@faker-js/faker";

import createStore from "../../core/stores/create-store";
import createViewModelBuilder from "../../presenters/view-models/create-view-model-builder";
import createAggregateManager from "../aggregates/create-aggregates";
import createEntityBuilder from "../entities/create-entity-builder";
import createSorter from "../sorter/create-sorter";
import createSubscribers from "./craft/create-subscribers";

const createRepository = <T extends Record<string, unknown>>(
  config: RepositoryConfig<T>,
  schema: TypeDefinitions<T>
): Repository<T> => {
  const store = createStore<Record<string, Entity<T>>>({}, true);

  const subscriberRegistry = createSubscribers<Entity<T>>({
    onCreate: [],
    onDelete: [],
    onUpdate: [],
  });

  const aggregateManager = createAggregateManager<T>({
    repositorySubscriber: (sync) => {
      subscriberRegistry.register(({ event, diff }) => {
        sync({ event, diff });
      });
    },
    aggregateConfig: config.aggregates || {},
  });

  const createEntity = createEntityBuilder(schema);

  const sorter = createSorter(
    Object.values(store.state),
    (item) => item.meta.id
  );

  subscriberRegistry.register(({ event, diff }) => {
    if (event === "onDelete") {
      sorter.notify(event, Object.values(diff));
    }
  });

  function create(data: T | T[], insertIndex?: number) {
    const items = Array.isArray(data) ? data : [data];

    const toCreate = items.reduce((acc, item) => {
      const id = item.id as string;
      const order = insertIndex ?? sorter.state.length;

      const entity = createEntity(
        {
          ...item,
          ...(config.ordered ? { [config.ordered]: order } : {}),
        } as unknown as T,
        order,
        id
      );

      acc[entity.meta.id] = entity;
      return acc;
    }, {} as Record<string, Entity<T>>);

    store.patch(toCreate, true);

    sorter.notify("onCreate", Object.values(toCreate), insertIndex);

    subscriberRegistry.notify({
      event: "onCreate",
      diff: toCreate,
      state: store.state,
    });

    return Object.values(toCreate).map(({ meta: { id }, state }) => ({
      ...state,
      id,
    }));
  }

  function initialize() {
    if (config.initialItems) {
      create(config.initialItems);
    } else if (config.seeder) {
      const { length, builder } = config.seeder;

      create({ ...Array.from({ length }).map(() => builder(faker)) });
    }
  }

  initialize();

  return {
    get state() {
      return store.state;
    },

    get entities() {
      return sorter.state;
    },

    get validEntities() {
      return sorter.state.filter((entity) => entity.status.isValid);
    },

    get invalidEntities() {
      return sorter.state.filter((entity) => !entity.status.isValid);
    },

    get groups() {
      return aggregateManager.getAggregates();
    },

    create,

    read(funnel) {
      const filter = typeof funnel === "string" ? [funnel] : funnel;

      let entities = sorter.state;

      if (Array.isArray(filter)) {
        entities = entities.filter((entity) => filter.includes(entity.meta.id));
      } else if (typeof filter === "object" && Object.keys(filter).length) {
        for (const [propertyName, property] of Object.entries(filter)) {
          entities = entities.filter((entity) =>
            typeof property === "function"
              ? property(entity.state[propertyName])
              : entity.state[propertyName] === property
          );

          if (!entities.length) return {};
        }
      } else {
        return store.state;
      }

      return entities.reduce((acc, entity) => {
        Object.defineProperty(acc, entity.meta.id, {
          get() {
            return store.state[entity.meta.id];
          },
          enumerable: true,
        });
        return acc;
      }, {} as Record<string, Entity<T>>);
    },

    update(identifiers, changes) {
      const ids = Array.isArray(identifiers) ? identifiers : [identifiers];

      const toPatch = ids.reduce((acc, id) => {
        const entity = store.state[id];
        if (entity) {
          acc[id] = createEntity(
            { ...entity.state, ...changes },
            entity.meta.order,
            id
          );
        }
        return acc;
      }, {} as Record<string, Entity<T>>);

      store.patch(toPatch);

      for (const entity of Object.values(toPatch)) {
        sorter.replace(entity.meta.id, entity);
      }

      subscriberRegistry.notify({
        event: "onUpdate",
        diff: toPatch,
        state: store.state,
      });
    },
    move(id: string) {
      const moveHandler = sorter.move(id);

      const notifyAndPatchWrapper = (
        moveFn: (targetId: string) => void
      ): ((targetId: string, options?: { patch?: Partial<T> }) => void) => {
        return (targetId: string, options?: { patch?: Partial<T> }) => {
          const entity = store.state[id];
          if (!entity) {
            console.warn(`Entity with id "${id}" not found.`);
            return;
          }

          if (options?.patch) {
            store.patch(
              {
                [id]: {
                  ...entity,
                  state: { ...entity.state, ...options.patch },
                },
              },
              true
            );
          }

          moveFn(targetId);

          sorter.notify("onUpdate", [store.state[id]]);

          subscriberRegistry.notify({
            event: "onUpdate",
            diff: { [id]: store.state[id] },
            state: store.state,
          });
        };
      };

      return {
        before: notifyAndPatchWrapper((targetId) => {
          moveHandler.before(targetId);
        }),

        after: notifyAndPatchWrapper((targetId) => {
          moveHandler.after(targetId);
        }),

        toLast: (options?: { patch?: Partial<T> }) => {
          const entity = store.state[id];
          if (!entity) {
            console.warn(`Entity with id "${id}" not found.`);
            return;
          }

          if (options?.patch) {
            store.patch(
              {
                [entity.meta.id]: {
                  ...entity,
                  state: { ...entity.state, ...options.patch },
                },
              },
              true
            );
          }

          moveHandler.toLast();

          sorter.notify("onUpdate", [store.state[id]]);

          subscriberRegistry.notify({
            event: "onUpdate",
            diff: { [id]: store.state[id] },
            state: store.state,
          });
        },
      };
    },
    delete(ids) {
      const identifiers = Array.isArray(ids) ? ids : [ids];

      const toDelete = identifiers.reduce((acc, id) => {
        if (store.state[id]) {
          acc[id] = store.state[id];
        }
        return acc;
      }, {} as Record<string, Entity<T>>);

      store.set(
        Object.values(store.state).reduce((acc, entity) => {
          if (!identifiers.includes(entity.meta.id)) {
            acc[entity.meta.id] = entity;
          }
          return acc;
        }, {} as Record<string, Entity<T>>)
      );

      for (const id of identifiers) {
        sorter.remove(id);
      }

      subscriberRegistry.notify({
        event: "onDelete",
        diff: toDelete,
        state: store.state,
      });
    },

    subscribe(subscriber, dependencies) {
      const isArray = Array.isArray(dependencies);
      const events = isArray ? dependencies : [dependencies];

      const { unregister } = subscriberRegistry.register(subscriber);

      if (isArray) {
        for (const event of events) {
          subscriberRegistry.register(subscriber, event as string);
        }
      }

      return unregister;
    },
  };
};

const createRepositoriesBuilder =
  <
    T extends Record<string, unknown>,
    U extends Record<string, Record<string, keyof T>>
  >(
    schemas: SchemaBuilderResult<T, U>
  ) =>
  <
    Opt extends Partial<{
      [K in keyof U]: RepositoryConfig<{ [Kb in keyof U[K]]: T[U[K][Kb]] }>;
    }>
  >(
    options: Opt
  ) => {
    type Repositories = {
      [K in keyof Opt]: K extends keyof U
        ? Repository<{ [Kb in keyof U[K]]: T[U[K][Kb]] }>
        : never;
    };

    const repositories = Object.entries(options).reduce<Repositories>(
      (acc, [property, config]) => {
        // @ts-ignore		<Repositories is too generic to recognize the property as a valid index.>
        acc[property] = createRepository(
          config,
          schemas[property] as unknown as TypeDefinitions<T>
        );
        return acc;
      },
      {} as Repositories
    );

    return {
      repositories,
      createViewModel: createViewModelBuilder(repositories),
    };
  };

export default createRepositoriesBuilder;
