import type { Store, StoreSubscriber } from '../types';

const createStore = <T extends Record<string, unknown>>(data: T, disableKeysChecking = false): Store<T> => {
  const reference = {
    state: data
  }

  const subscribers: Array<{
    callback: StoreSubscriber<T>;
    dependencies?: Array<keyof T>;
  }> = [];

  function set(value: T, silent: boolean = false): void {
    const requiredKeys = Object.keys(data);
    if (requiredKeys.some(requiredKey => !Object.keys(value).includes(requiredKey))) {
      throw new Error(`Please define all required keys: ${requiredKeys.join(', ')}`);
    }

    validateKeys(value);
    reference.state = { ...value };

    if (!silent) notifySubscribers();
  }

  function patch(changes: Partial<T>, silent: boolean = false): void {    
    validateKeys(changes);
    reference.state = { ...reference.state, ...changes };
    
    if (!silent) notifySubscribers(changes);
  }

  function onChange(
    callback: StoreSubscriber<T>,
    dependencies?: Array<keyof T>
  ): void {
    validateSubscriberKeys(dependencies);
    subscribers.push({ callback, dependencies });
  }

  function notifySubscribers(partialState?: Partial<T>): void {
    subscribers.forEach(({ callback, dependencies }) => {
      if (!dependencies || shouldTrigger(dependencies, partialState)) {
        callback({
          state: Object.freeze({ ...reference.state }),
          diff: partialState || {}
        });
      }
    });
  }

  function shouldTrigger(
    dependencies: Array<keyof T>,
    partialState?: Partial<T>
  ): boolean {
    if (!partialState) {
      return true;
    }

    const patchKeys = Object.keys(partialState) as Array<keyof T>;
    return Array.from(dependencies).some((key) => patchKeys.includes(key));
  }

  function validateKeys(value: Partial<T>): void {
    if (disableKeysChecking) return;

    const invalidKeys = Object.keys(value).filter((key) => !(key in data));
    
    if (invalidKeys.length > 0) {
      throw new Error(`Invalid keys: ${invalidKeys.join(', ')}`);
    }
  }

  function validateSubscriberKeys(dependencies?: Array<keyof T>): void {
    if (disableKeysChecking) return;

    if (dependencies) {      
      const invalidSubscriberKeys = Array.from(dependencies).filter((key) => !(key in data));

      if (invalidSubscriberKeys.length > 0) {
        throw new Error(`Invalid subscriber keys: ${invalidSubscriberKeys.join(', ')}`);
      }
    }
  }

  return {
    get state     () { return Object.freeze({ ...reference.state });  },
    get set       () { return set;                                    },
    get patch     () { return patch;                                  },
    get onChange  () { return onChange;                               }
  };
};

export default createStore;
