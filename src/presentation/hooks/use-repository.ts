import type { Repository } from "@packages/free";
import { useEffect, useState } from "react";

const useRepository = <T extends Record<string, unknown>>(
  repository: Repository<T>,
  events?: Partial<{
    [key in "onCreate" | "onUpdate" | "onDelete"]: <
      U extends { diff: Repository<T>["state"]; state: Repository<T>["state"] }
    >(
      callback: U
    ) => void;
  }>
) => {
  type RepositoryState = Repository<T>["entities"];
  const [state, setState] = useState<RepositoryState>([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    repository.subscribe(({ diff, state, event }) => {
      setState(repository.entities);
      switch (event) {
        case "onCreate":
          events?.onCreate?.({ diff, state });
          break;
        case "onUpdate":
          events?.onUpdate?.({ diff, state });

          break;
        case "onDelete":
          events?.onDelete?.({ diff, state });
          break;
        default:
          break;
      }
    });
  }, []);

  return state;
};

export default useRepository;
