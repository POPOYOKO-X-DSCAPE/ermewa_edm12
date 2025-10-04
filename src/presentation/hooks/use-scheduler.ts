import { useCallback, useMemo } from "react";
import createScheduler, {
  type OnSaveCallback,
  type StructureMap,
  type Group,
} from "@/infra-structures/libraries/scheduler";

export function useScheduler<T>(
  list: Group<T>[],
  structureMap: StructureMap,
  options: { allowEmptyGroups?: boolean; onSave?: OnSaveCallback<Group<T>> }
) {
  const { allowEmptyGroups = false, onSave } = options;

  // Scheduler instance
  const scheduler = useMemo(() => {
    return createScheduler(list, {
      map: structureMap,
      allowEmptyGroups,
      onSave: (updatedList: Group<T>[]) => {
        if (onSave) {
          onSave(updatedList);
        }
      },
    });
  }, [list, structureMap, allowEmptyGroups, onSave]);

  // Wrapper for the move function to trigger React state updates
  const moveItem = useCallback(
    (
      from: { path: number | [number, number]; group?: string },
      to: { path: number | [number, number]; group?: string }
    ) => {
      scheduler.move(from)(to);
    },
    [scheduler]
  );

  return {
    moveItem, // Exposed move method
  };
}
