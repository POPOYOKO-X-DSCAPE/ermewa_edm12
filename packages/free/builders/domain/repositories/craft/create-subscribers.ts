import type { CrudEvent } from "../../types";

type SubscriberEvent = CrudEvent | "global";

interface SubscriberConfig<T extends Record<string, unknown>> {
  [key: string]: SubscriberFunction<T>[];
}

export type SubscriberFunction<T extends Record<string, unknown>> = (payload: {
  state: Record<string, T>;
  event: SubscriberEvent;
  diff: Record<string, T>;
}) => void;

type SubscriberRegistry<T extends Record<string, unknown>> = {
  register: (
    subscriber: SubscriberFunction<T>,
    event?: SubscriberEvent
  ) => { unregister: () => void };
  notify: (payload: {
    event: SubscriberEvent;
    diff: Record<string, T>;
    state: Record<string, T>;
  }) => void;
};

function createSubscribers<T extends Record<string, unknown>>(
  config: SubscriberConfig<T> = {}
) {
  const subscribers: SubscriberConfig<T> = {
    global: [],
    ...config,
  };

  const subscriberRegistry = {
    register: (subscriber, event = "global") => {
      if (!subscribers[event]) {
        subscribers[event] = [];
      }

      subscribers[event].push(subscriber);

      return {
        unregister: () => {
          delete subscribers[event];
        },
      };
    },

    notify: (payload) => {
      const { event } = payload;

      for (const subscriber of subscribers.global) {
        subscriber(payload);
      }

      if (subscribers[event]) {
        for (const subscriber of subscribers[event]) {
          subscriber(payload);
        }
      }
    },
  } satisfies SubscriberRegistry<T>;

  return subscriberRegistry;
}

export default createSubscribers;
