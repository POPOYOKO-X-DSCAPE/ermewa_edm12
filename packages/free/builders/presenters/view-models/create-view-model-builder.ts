import type { Entity, Funnel, Repository, SubscriberFunction } from '../../domain/types';

import createStore from '../../core/stores/create-store';
import type { Store } from '../../core/types';

const createViewModelBuilder = <R extends Record<string, Repository<any>>>(
  repositories: R
) => {
  
  type ComputedProperties<T extends Record<string, unknown>> = {
    [K in keyof T]: (dependencies: { [K in keyof R]: R[K]['read'] }) => T[K];
  };

  function createViewModel<T extends Record<string, unknown>>(
    computedProperties: ComputedProperties<T>
  ) {
    const dependencyStores = Object.keys(computedProperties).reduce((acc, propertyName) => ({
      ...acc,
      [propertyName]: createStore(Object.keys(repositories).reduce((subAcc, repositoryName) => ({
        ...subAcc,
        [repositoryName]: undefined
      }), {} as { [Kb in keyof R]: Record<string, ReturnType<R[Kb]['read']>> | undefined }))
    }), {} as { [K in keyof ComputedProperties<T>]: Store<{ [Kb in keyof R]: Record<string, ReturnType<R[Kb]['read']>> | undefined }> });
    
    const dependencies = (propertyName: string) =>
      Object.entries(repositories).reduce((acc, [repositoryName, repository]) => ({
        ...acc,
        [repositoryName]: <Tb extends Record<string, unknown>>(funnel: Funnel<Tb>) => {
          let data: Record<string, ReturnType<R[string]["read"]>> | undefined;
          if (dependencyStores[propertyName].state[repositoryName] !== undefined) {
            data = dependencyStores[propertyName].state[repositoryName];
          } else {
            data = repository.read(funnel) as Record<string, ReturnType<R[string]["read"]>> | undefined;
            
            let currentIds: string[] = Object.keys(<object>data || {});
            const subscriber: SubscriberFunction<Entity<Record<string, unknown>>> = ({ event, diff }) => {              
              let diffIds = Object.keys(diff);

              if (event === 'onDelete') {
                const toDeleteIds = currentIds.filter(id => diffIds.includes(id));
                
                if (!toDeleteIds.length) return;
                
                currentIds = currentIds.filter(id => !toDeleteIds.includes(id));
              } else {
                // apply funnel on diff here (must refactor / mutualize logic)
                const filter = typeof funnel === 'string' ? [funnel] : funnel;
  
                let funneledDiff = Object.values(diff);
          
                if (Array.isArray(filter)) {
                  funneledDiff = funneledDiff.filter(entity => filter.includes(entity.meta.id));
                } else if (typeof filter === "object" && Object.keys(filter).length) {
                  Object.entries(filter).every(([propertyName, property]) => {
                    funneledDiff = funneledDiff.filter(entity => 
                      typeof property === 'function' ?
                        property(entity.state[propertyName])
                      : entity.state[propertyName] === property
                    );
          
                    return funneledDiff.length;
                  });
                }                
                // end of funnel
                
                switch (event) {
                  case 'onCreate':
                    if (!funneledDiff.length) return;
  
                    const createdIds = funneledDiff.map(entity => entity.meta.id);                  
                    currentIds = [...currentIds, ...createdIds];
                    break;
                  case 'onUpdate':
                    const funneledIds = funneledDiff.map(entity => entity.meta.id);
                    const toCreateIds = funneledIds.length ? diffIds.filter(id => !currentIds.includes(id) && funneledIds.includes(id)) : [];
                    const toDeleteIds = currentIds.length  ? diffIds.filter(id => currentIds.includes(id) && !funneledIds.includes(id)) : [];
  
                    if (!toCreateIds.length && !toDeleteIds.length && !funneledIds.length) return;                    
  
                    const remainingIds = toDeleteIds.length ? currentIds.filter(id => !toDeleteIds.includes(id)) : currentIds;
                    currentIds = [...remainingIds, ...toCreateIds];
                    break;
                };
              }
              
              dependencyStores[propertyName].patch({
                  [repositoryName]: {
                    ...currentIds.reduce((acc, entityId) => ({
                      ...acc,
                      [entityId]: repository.state[entityId]
                    }), {})
                  }
                } as Partial<{ [Kb in keyof R]: Record<string, ReturnType<R[Kb]["read"]>> }>
              );
            }

            repository.subscribe(subscriber);
          }
          
          return data || {};
        }
      }), {} as { [K in keyof R]: R[K]['read'] });

    const initialData = Object.keys(computedProperties).reduce((acc, propertyName) => ({
      ...acc,
      [propertyName]: computedProperties[propertyName](dependencies(propertyName))
    }), {} as { [K in keyof ComputedProperties<T>]: ReturnType<ComputedProperties<T>[K]> });

    const store = createStore(initialData);

    Object.entries(dependencyStores).forEach(([propertyName, dependencyStore]) => {
      
      dependencyStore.onChange(() => {                        
        store.patch({
          [propertyName]: computedProperties[propertyName](dependencies(propertyName))
        } as { [K in keyof ComputedProperties<T>]: ReturnType<ComputedProperties<T>[K]>});
      });
    });

    return store;
  };

  return createViewModel;
};

export default createViewModelBuilder;
