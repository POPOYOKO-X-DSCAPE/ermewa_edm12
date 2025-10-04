import type { Faker } from "@faker-js/faker";

import type { Unit } from "../core/types";
import type {
  AggregateConfig,
  AggregateResult,
} from "./aggregates/create-aggregates";

export type LooseAutocomplete<T extends string> = T | Omit<string, T>;

export type Entity<
  T extends Record<string, unknown> = Record<string, unknown>
> = {
  readonly meta: {
    id: string;
    order: number | undefined;
  };
  readonly remove: (silent?: boolean) => void;
} & Unit<T>;

export type SubscriberFunction<T extends Record<string, unknown>> = (payload: {
  state: Record<string, T>;
  event: /* string */ string;
  diff: Record<string, T>;
}) => void;

export type Subscribers = {
  readonly global: string[];
  readonly onCreate: string[];
  readonly onUpdate: { global: string[] } & Record<string, string[]>;
  readonly onDelete: { global: string[] } & Record<string, string[]>;
};

export type FilterObject<T extends Record<string, unknown>> = Partial<{
  [K in keyof T]: T[K] | ((v: T[K]) => boolean);
}>;

export type Funnel<T extends Record<string, unknown>> =
  | string
  | string[]
  | FilterObject<T>;

export type CrudEvent = string; /* "onCreate" | "onUpdate" | "onDelete"; */

export type Repository<
  T extends Record<string, unknown> = Record<string, unknown>
> = {
  readonly state: Record<string, Entity<T>>;
  readonly entities: Entity<T>[];
  readonly validEntities: Entity<T>[];
  readonly invalidEntities: Entity<T>[];
  readonly groups?: Record<string, AggregateResult<T>>;
  create(data: T | T[], insertIndex?: number): (T & { id: string })[];
  read(funnel: Funnel<T>): Record<string, Entity<T>>;
  update(identifiers: string | string[], changes: Partial<T>): void;
  delete(identifiers: string | string[]): void;
  move(id: string): {
    before(targetId: string, options?: { patch?: Partial<T> }): void;
    after(targetId: string, options?: { patch?: Partial<T> }): void;
    toLast(options?: { patch?: Partial<T> }): void;
  };
  subscribe(
    subscriber: SubscriberFunction<Entity<T>>,
    dependencies?:
      | Partial<{
          onUpdate: string[] | string;
          onDelete: string[] | string;
        }>
      | string[]
      | string //LooseAutocomplete<'onCreate' | 'onUpdate' | 'onDelete'>
  ): () => void;
};

export type RepositoryConfig<T extends Record<string, unknown>> = {
  seeder?: Seeder<T>;
  initialItems?: ({ id: string } & T)[];
  ordered?: string;
  aggregates?: Record<string, AggregateConfig<Entity<T>>>; // `${Extract<keyof T, string>}${"" | `${string}`}`[];
};

export type Seeder<T extends Record<string, unknown>> = {
  builder: (mock: Faker) => T;
  length: number;
};
