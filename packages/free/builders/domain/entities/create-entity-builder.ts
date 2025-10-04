import { v4 as uid } from "uuid";

import type { Entity } from "../types";
import type { TypeDefinitions, UnitSubscriber } from "../../core/types";

import createStore from "../../core/stores/create-store";

const createEntityBuilder =
  <T extends Record<string, unknown>>(schema: TypeDefinitions<T>) =>
  (initialState: T, order?: number, id = uid()): Entity<T> => {
    const store = createStore(initialState);

    const reference = {
      status: {
        errors: Object.keys(schema).reduce((acc, key) => {
          acc[key] = [];
          return acc;
        }, {} as Record<string, { code: string; message: string }[]>),
        isValid: false,
      } as Entity<T>["status"],
      meta: {
        id,
        order,
        modifiedOn: Date.now(),
      } as Entity<T>["meta"],
    };

    function onChange(
      callback: UnitSubscriber<T>,
      dependencies?: Array<keyof T>
    ): void {
      store.onChange((payload) => {
        while (Date.now() <= reference.meta.modifiedOn + 1) {} // force delay of 1 millisecond
        reference.meta.modifiedOn = Date.now();

        callback(payload, Object.freeze({ ...reference }));
      }, dependencies);
    }

    function updateStatus(newValue: Partial<T>) {
      const schemaSlice = Object.keys(newValue).reduce(
        (acc, property: keyof T) => {
          acc[property] = schema[property];
          return acc;
        },
        {} as Partial<typeof schema>
      );

      const isStatusValid = Object.entries(schemaSlice)
        .map(
          ([property, validator]: [keyof T, TypeDefinitions<T>[keyof T]]) => {
            reference.status.errors[property] = [];

            const isPropertyValid = Object.entries(
              validator(newValue[property] as T[keyof T])
            )
              .map(([code, [expression, message]]) => {
                if (!expression)
                  reference.status.errors[property].push({ code, message });

                return expression;
              })
              .every((status) => !!status);

            return isPropertyValid;
          }
        )
        .every((status) => !!status);

      reference.status.isValid = isStatusValid;
    }

    /* TODO: optimize error checks (this onChange below perform unnecessary checks). 
    A schema boolean matrix is needed to avoid re-executing some validation rules (especially when using patch function) */
    store.onChange(({ state }) => updateStatus(state));

    updateStatus(initialState);

    return {
      get state() {
        return Object.freeze({ ...store.state });
      },
      get status() {
        return Object.freeze({ ...reference.status });
      },
      get meta() {
        return Object.freeze({ ...reference.meta });
      },
      get set() {
        return store.set;
      },
      get patch() {
        return (
          partialState: Partial<T> | Partial<T & { order: number }>,
          silent?: boolean
        ) => {
          // Si "order" est défini dans le `partialState`, mettez à jour `meta.order`
          if (
            "order" in partialState &&
            typeof partialState.order === "number"
          ) {
            reference.meta.order = partialState.order;
          }

          // Exclure "order" du reste des propriétés (pour éviter des conflits avec T)
          const { order, ...toPatch } = partialState;

          // Appliquez les modifications à l'état du store
          store.patch(toPatch as Partial<T>, silent);
        };
      },
      get onChange() {
        return onChange;
      },
      get remove() {
        return (silent = false) => {
          const state = { ...store.state };

          // const toRemove = state[id];
          delete state[id];
          store.set(state, silent);
        };
      },
    };
  };

export default createEntityBuilder;
