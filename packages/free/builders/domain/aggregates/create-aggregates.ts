import type { CrudEvent, Entity } from "../types";

type Diff<T extends Record<string, unknown>> = {
  [id: string]: Entity<T>;
};

export type AggregateResult<T extends Record<string, unknown>> = {
  entities: Entity<T>[];
  grouped?: Record<string, Entity<T>[]>;
  metadata?: unknown;
};

export type AggregateConfig<T extends Record<string, unknown>> = {
  filter?: (option: Partial<{ entity: T; entities: T[] }>) => boolean;
  groupBy?: keyof T | ((entity: T) => string);
  metadata?: (option: Partial<{ entity: T; entities: T[] }>) => unknown;
};

type AggregateManagerOptions<T extends Record<string, unknown>> = {
  repositorySubscriber: (
    sync: (payload: { event: string; diff: Record<string, Entity<T>> }) => void
  ) => void;
  aggregateConfig: Record<string, AggregateConfig<Entity<T>>>;
};

const createAggregateManager = <T extends Record<string, unknown>>({
  repositorySubscriber,
  aggregateConfig,
}: AggregateManagerOptions<T>) => {
  const aggregates: Record<string, AggregateResult<T>> = {};

  for (const key of Object.keys(aggregateConfig)) {
    aggregates[key] = { entities: [], metadata: undefined };
  }

  const updateAggregates = (payload: { event: CrudEvent; diff: Diff<T> }) => {
    const { event, diff } = payload;

    for (const [groupName, { filter, metadata, groupBy }] of Object.entries(
      aggregateConfig
    )) {
      const aggregate = aggregates[groupName];

      // Fonction pour gérer l'entité
      const handleEntity = (entity: Entity<T>) => {
        // Appliquer le filtre, si défini, de manière indépendante
        if (filter?.({ entity })) {
          aggregate.entities.push(entity);
        }

        // Appliquer le groupement, si défini, de manière indépendante
        if (groupBy) {
          const groupKey =
            typeof groupBy === "function"
              ? String(groupBy(entity))
              : String(entity[groupBy]);

          if (!aggregate.grouped) {
            aggregate.grouped = {};
          }

          if (!aggregate.grouped[groupKey]) {
            aggregate.grouped[groupKey] = [];
          }

          aggregate.grouped[groupKey].push(entity);
        }
      };

      switch (event) {
        case "onCreate":
          // console.log("create-aggregate::onCreate");

          for (const entity of Object.values(diff)) {
            handleEntity(entity);
          }
          break;

        case "onUpdate":
          for (const entity of Object.values(diff)) {
            // Supprimer l'entité existante avant de l'ajouter à nouveau
            aggregate.entities = aggregate.entities.filter(
              ({ meta }) => meta.id !== entity.meta.id
            );

            // Supprimer l'entité du groupe avant d'ajouter la mise à jour
            if (groupBy && aggregate.grouped) {
              const groupKey =
                typeof groupBy === "function"
                  ? String(groupBy(entity))
                  : String(entity[groupBy]);

              if (aggregate.grouped[groupKey]) {
                aggregate.grouped[groupKey] = aggregate.grouped[
                  groupKey
                ].filter(
                  (existingEntity) => existingEntity.meta.id !== entity.meta.id
                );
              }
            }

            handleEntity(entity);
          }
          break;

        case "onDelete":
          // console.log("create-aggregate::onDelete");
          for (const deletedEntity of Object.values(diff)) {
            // Supprimer l'entité de la liste
            aggregate.entities = aggregate.entities.filter(
              (entity) => entity.meta.id !== deletedEntity.meta.id
            );

            // Si groupBy est défini, retirer l'entité du groupe
            if (groupBy && aggregate.grouped) {
              const groupKey =
                typeof groupBy === "function"
                  ? String(groupBy(deletedEntity))
                  : String(deletedEntity[groupBy]);

              // Retirer l'entité supprimée du groupe
              if (aggregate.grouped[groupKey]) {
                aggregate.grouped[groupKey] = aggregate.grouped[
                  groupKey
                ].filter((entity) => entity.meta.id !== deletedEntity.meta.id);

                // Si le groupe devient vide, on supprime le groupe
                if (aggregate.grouped[groupKey].length === 0) {
                  delete aggregate.grouped[groupKey];
                }
              }
            }
          }
          break;
      }

      // Mettre à jour la metadata après l'événement
      if (metadata) {
        aggregate.metadata = metadata({ entities: aggregate.entities });
      }
    }
    // console.log(aggregates);
  };

  repositorySubscriber(updateAggregates);

  return {
    getAggregates() {
      // console.log("[internal] get Aggregates => ", aggregates);

      return aggregates;
    },
  };
};

export default createAggregateManager;
