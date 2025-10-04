export type TypeDefinitions<T extends Record<string, unknown>> = {
  [K in keyof T]: (value: T[K]) => Record<string, [boolean, string]>;
};

export type SchemaBuilderResult<T extends Record<string, unknown>, U extends Record<string, Record<string, keyof T>>> = {
  [K in keyof U]: {
    [P in keyof U[K]]: TypeDefinitions<T>[U[K][P]];
  };
};

export type StoreSubscriber<T> = (payload: { state: T, diff: Partial<T> }) => void;

export type Store<T extends Record<string, unknown>> = {
  readonly state: T;
  readonly set: (data: T, silent?: boolean) => void;
  readonly patch: (partialState: Partial<T>, silent?: boolean) => void;
  readonly onChange: (
    callback: StoreSubscriber<T>,
    dependencies?: Array<keyof T>
  ) => void;
};

export type UnitSubscriber<T extends Record<string, unknown>> = (
  payload: { state: T, diff: Partial<T> },
  extra: {
    status: Unit<T>['status'],
    meta: Unit<T>['meta']
  }
) => void;

export type Unit<T extends Record<string, unknown>> = {
  readonly meta: { 
    modifiedOn: number 
  };
  readonly status: {
    errors: { [K in keyof T]: { code: string, message: string }[] };
    isValid: boolean;
  };
  readonly onChange: (
    callback: UnitSubscriber<T>,
    dependencies?: Array<keyof T>
  ) => void;
} & Store<T>;
