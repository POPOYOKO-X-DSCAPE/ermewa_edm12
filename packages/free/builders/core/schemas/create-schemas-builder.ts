import type { TypeDefinitions, SchemaBuilderResult } from '../types';

import createRepositoriesBuilder from '../../domain/repositories/create-repositories-builder';
import createUnitsBuilder from '../units/create-units-builder';

const createSchemasBuilder = <T extends Record<string, unknown>>(
  typeDefinitions: TypeDefinitions<T>
) => <U extends Record<string, Record<string, keyof T /* extends string ? keyof T | `${keyof T}?` : never */>>>(
  schemasDefinitions: U
) => {

  const schemas = Object.entries(schemasDefinitions).reduce((acc, [key, schemaDefinition]) => ({
    ...acc,
    [key]: Object.entries(schemaDefinition).reduce((schema, [property, typeName]) => ({
      ...schema,
      [property]: typeDefinitions[typeName]
    }), {})
  }), {} as SchemaBuilderResult<T, U>);

  return { 
    schemas,
    createUnits: createUnitsBuilder(schemas),
    createRepositories: createRepositoriesBuilder(schemas)
  };
}

export default createSchemasBuilder;
