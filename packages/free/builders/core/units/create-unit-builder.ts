import type { TypeDefinitions, Unit, UnitSubscriber } from '../types';

import createStore from '../stores/create-store';

const createUnitBuilder = <T extends Record<string, unknown>>(
  schema: TypeDefinitions<T>
) => (
  initialState: T
): Unit<T> => {

  const store = createStore(initialState);

  const reference = {
    status: {
      errors: Object.keys(schema).reduce((acc, key) => ({
        ...acc,
        [key]: [] as string[]
      }), {}),
      isValid: false,
    } as Unit<T>['status'],
    meta: {
      modifiedOn: Date.now()
    } as Unit<T>['meta']
  };

  function onChange(
    callback: UnitSubscriber<T>,
    dependencies?: Array<keyof T>
  ): void {
    store.onChange((payload) => {
      while (Date.now() <= reference.meta.modifiedOn + 1) {} // force delay of 1 millisecond
      reference.meta.modifiedOn = Date.now();

      callback(payload, Object.freeze({ ...reference }));
    }, dependencies)
  }

  function updateStatus(newValue: Partial<T>) {
    const schemaSlice = Object.keys(newValue).reduce((acc, property: keyof T) => ({
      ...acc,
      [property]: schema[property]
    }), {} as Partial<typeof schema>);

    const isStatusValid = Object.entries(schemaSlice).map(([property, validator]: [keyof T, TypeDefinitions<T>[keyof T]]) => {
      reference.status.errors[property] = [];

      const isPropertyValid = Object.entries(validator(newValue[property] as T[keyof T])).map(([code, [expression, message]]) => {
        if (!expression) reference.status.errors[property].push({ code, message });

        return expression;
      }).every(status => !!status);

      return isPropertyValid;
    }).every(status => !!status);

    reference.status.isValid = isStatusValid;
  }

  /* TODO: optimize error checks (this onChange below perform unnecessary checks). 
    A schema boolean matrix is needed to avoid re-executing some validation rules (especially when using patch function) */
  store.onChange(({ state }) => updateStatus(state));

  updateStatus(initialState);

  return {
    get state     () { return Object.freeze({ ...store.state      }); },
    get status    () { return Object.freeze({ ...reference.status }); },
    get meta      () { return Object.freeze({ ...reference.meta   }); },
    get set       () { return store.set;                              },
    get patch     () { return store.patch;                            },
    get onChange  () { return onChange;                               }
  };
};

export default createUnitBuilder;
