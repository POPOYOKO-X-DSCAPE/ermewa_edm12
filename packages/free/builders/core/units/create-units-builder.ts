import type { SchemaBuilderResult, Unit } from '../types';
import createUnitBuilder from './create-unit-builder';

const createUnitsBuilder = <
  T extends Record<string, unknown>,
  U extends Record<string, Record<string, keyof T>>
>(
  schemas: SchemaBuilderResult<T, U>
) => {
  type Options = Partial<{
    [K in keyof U]: { [Kb in keyof U[K]]: T[U[K][Kb]] };
  }>;

  type Units<Opt extends Options> = {
    [K in keyof Opt]: K extends keyof U
      ? Unit<{ [Kb in keyof U[K]]: T[U[K][Kb]] }>
      : never;
  };

  const createUnits = <Opt extends Options>(options: Opt): { units: Units<Opt> } => {
    const units = {} as Units<Opt>;

    for (const property in options) {
      if (options.hasOwnProperty(property) && schemas[property]) {
        // @ts-ignore
        const createUnit = createUnitBuilder(schemas[property]);
        units[property] = createUnit(options[property] as any) as unknown as Units<Opt>[typeof property];
      }
    }

    return { units };
  };
  

  return createUnits;
};

export default createUnitsBuilder;
