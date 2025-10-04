import type { TypeDefinitions } from '../types';

import createSchemasBuilder from '../schemas/create-schemas-builder';

type CoreTypeDefinitions = TypeDefinitions<{
  number: number;
  string: string;
  boolean: boolean;
  date: Date;
  email: string;
}>;

const EMAIL_REGEX = /^[\p{L}!#-'*+\-/\d=?^-~]+(.[\p{L}!#-'*+\-/\d=?^-~])*@[^@\s]{2,}$/u;

const coreTypeDefinitions: CoreTypeDefinitions = {
  number: (value) => ({
    type: [typeof value === 'number', `${value} is of type '${typeof value}', 'number' expected.`]
  }),
  string: (value) => ({
    type: [typeof value === 'string', `${value} is of type '${typeof value}', 'string' expected.`]
  }),
  boolean: (value) => ({
    type: [typeof value === 'boolean', `${value} is of type '${typeof value}', 'boolean' expected.`]
  }),
  date: (value) => ({
    type: [value instanceof Date, `${value} is not a valid date instance.`]
  }),
  email: (value) => ({
    format: [EMAIL_REGEX.test(value), `'${value}' is not a valid email.`]
  })
};

const createTypeDefinitions = <T extends Record<string, unknown> = {}>(
  definitions: TypeDefinitions<T> 
) => {
  
  const typeDefinitions = {
    ...coreTypeDefinitions,
    ...definitions
  };

  return { 
    typeDefinitions, 
    createSchemas: createSchemasBuilder(typeDefinitions)
  };
};

export default createTypeDefinitions;
