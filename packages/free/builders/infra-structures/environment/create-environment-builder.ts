import createStore from '../../core/stores/create-store';
import createServicesBuilder from '../services/create-services';

const createEnvironment = <T extends Record<string, unknown>>(defaultValues: T) => {
  const environment = createStore<T>(defaultValues);
  
  return {
    environment,
    createServices: createServicesBuilder(environment)
  };
}

export default createEnvironment;
