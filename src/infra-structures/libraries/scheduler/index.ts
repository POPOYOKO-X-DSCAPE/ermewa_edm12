export type StructureMap = {
  children?: string; // Nom de la propriété contenant les enfants (pages).
  groups?: string[]; // Propriétés définissant les groupes.
};

export type Group<T> = {
  [key: string]: unknown;
  children?: T[]; // Les groupes contiennent des enfants.
};

export type OnSaveCallback<T = unknown> = (updatedStructure: T[]) => void;

export function createScheduler<T>(
  list: Group<T>[],
  options: {
    map: StructureMap;
    allowEmptyGroups: boolean;
    onSave: OnSaveCallback<Group<T>>;
  }
) {
  const { map, allowEmptyGroups, onSave } = options;

  function move(from: { path: number | [number, number]; group?: string }) {
    return (to: { path: number | [number, number]; group?: string }) => {
      const { path: fromPath, group: fromGroup } = from;
      const { path: toPath, group: toGroup } = to;

      console.log(
        `Moving from ${JSON.stringify(from)} to ${JSON.stringify(to)}`
      );

      // Vérification des types de fromPath et toPath
      if (typeof fromPath === "number" && typeof toPath === "number") {
        // Déplacement de groupe (on peut directement appeler adjustPath sans ajuster de sous-items)
        console.log("Handling group-level move");

        const adjusted = adjustPath(fromPath, toPath, { fromGroup, toGroup });

        if (adjusted.isSame) {
          console.log("No change required, move is insignificant.");
          return;
        }

        const { adjustedFrom, adjustedTo } = adjusted;

        // Effectuer le mouvement du groupe
        const updatedList = performMove(list, adjustedFrom, adjustedTo);

        if (!allowEmptyGroups) {
          removeEmptyGroups(updatedList);
        }

        onSave(updatedList);
      } else if (Array.isArray(fromPath) && Array.isArray(toPath)) {
        // Déplacement d'éléments dans un groupe
        console.log("Handling item-level move");

        const adjusted = adjustPath(fromPath, toPath, { fromGroup, toGroup });

        if (adjusted.isSame) {
          console.log("No change required, move is insignificant.");
          return;
        }

        const { adjustedFrom, adjustedTo } = adjusted;

        // Effectuer le mouvement de l'élément dans le groupe
        const updatedList = performMove(list, adjustedFrom, adjustedTo);

        if (!allowEmptyGroups) {
          removeEmptyGroups(updatedList);
        }

        onSave(updatedList);
      } else {
        console.error("Invalid paths provided.");
      }
    };
  }

  return {
    move,
  };
}

/**
 * Adjust paths to ensure valid reordering and detect no-op moves.
 */
function adjustPath(
  fromPath: number | [number, number],
  toPath: number | [number, number],
  options: { fromGroup?: string; toGroup?: string }
): {
  adjustedFrom: number | [number, number];
  adjustedTo: number | [number, number];
  isSame: boolean;
} {
  const { fromGroup, toGroup } = options;
  const isSameGroup = fromGroup === toGroup || (!fromGroup && !toGroup);

  // Cas où les deux chemins sont des indices simples (déplacement de groupe)
  if (typeof fromPath === "number" && typeof toPath === "number") {
    if (fromPath === toPath) {
      return { adjustedFrom: fromPath, adjustedTo: toPath, isSame: true };
    }
    if (Math.abs(fromPath - toPath) === 1) {
      return { adjustedFrom: fromPath, adjustedTo: toPath, isSame: true };
    }
    return { adjustedFrom: fromPath, adjustedTo: toPath, isSame: false };
  }

  // Cas où les chemins sont des tableaux (déplacement d'éléments dans un groupe)
  if (Array.isArray(fromPath) && Array.isArray(toPath)) {
    const [fromGroupIndex, fromChildIndex] = fromPath;
    const [toGroupIndex, toChildIndex] = toPath;

    // Vérification si le déplacement est dans le même groupe et s'il est insignifiant
    if (isSameGroup && fromGroupIndex === toGroupIndex) {
      if (Math.abs(fromChildIndex - toChildIndex) <= 1) {
        return { adjustedFrom: fromPath, adjustedTo: toPath, isSame: true };
      }
    }

    return { adjustedFrom: fromPath, adjustedTo: toPath, isSame: false };
  }

  throw new Error("Invalid paths provided to adjustPath.");
}

/**
 * Perform the actual move operation in the list.
 */
function performMove<T>(
  list: Group<T>[],
  from: number | [number, number],
  to: number | [number, number]
): Group<T>[] {
  const updatedList = [...list];

  if (typeof from === "number" && typeof to === "number") {
    // Moving groups
    const [removed] = updatedList.splice(from, 1);
    updatedList.splice(to, 0, removed);
  } else if (Array.isArray(from) && Array.isArray(to)) {
    const [fromGroupIndex, fromChildIndex] = from;
    const [toGroupIndex, toChildIndex] = to;

    const fromGroup = updatedList[fromGroupIndex];
    const toGroup = updatedList[toGroupIndex];

    if (!Array.isArray(fromGroup.pages) || !Array.isArray(toGroup.pages)) {
      throw new Error("Invalid group structure: 'pages' must be an array.");
    }

    const [removed] = fromGroup.pages.splice(fromChildIndex, 1);
    toGroup.pages.splice(toChildIndex, 0, removed);
  }

  return updatedList;
}

/**
 * Remove empty groups from the list if empty groups are disallowed.
 */
function removeEmptyGroups<T>(list: Group<T>[]) {
  return list.filter(
    (group) => Array.isArray(group.pages) && group.pages.length > 0
  );
}

export default createScheduler;
