const createSorter = <T>(initialItems: T[], getId: (item: T) => string) => {
  let state = [...initialItems];

  const sync = (
    event: "onCreate" | "onDelete" | "onUpdate",
    diff: T[],
    insertIndex?: number
  ) => {
    switch (event) {
      case "onCreate": {
        const toAdd = diff.filter(
          (item) => !state.some((i) => getId(i) === getId(item))
        );

        if (
          insertIndex !== undefined &&
          insertIndex >= 0 &&
          insertIndex <= state.length
        ) {
          state = [
            ...state.slice(0, insertIndex),
            ...toAdd,
            ...state.slice(insertIndex),
          ];
        } else {
          state = [...state, ...toAdd];
        }
        break;
      }

      case "onDelete": {
        state = state.filter(
          (item) => !diff.some((i) => getId(i) === getId(item))
        );
        break;
      }

      case "onUpdate": {
        state = state.map((item) => {
          const updatedItem = diff.find((i) => getId(i) === getId(item));
          return updatedItem ? updatedItem : item;
        });
        break;
      }

      default: {
        console.warn(`Unknown event type: "${event}"`);
        break;
      }
    }
  };

  const moveItem = (
    id: string,
    position: "before" | "after" | "toLast",
    targetId?: string
  ): boolean => {
    const index = state.findIndex((item) => getId(item) === id);
    if (index === -1) {
      console.warn(`Item with id "${id}" not found in sorter.`);
      return false;
    }

    if (position !== "toLast" && !targetId) {
      console.warn(`Target id must be provided for "${position}" operation.`);
      return false;
    }

    const targetIndex =
      position === "toLast"
        ? state.length
        : state.findIndex((item) => getId(item) === targetId);

    if (position !== "toLast" && targetIndex === -1) {
      console.warn(`Target with id "${targetId}" not found in sorter.`);
      return false;
    }

    const newState = [...state];
    const [movedItem] = newState.splice(index, 1);

    if (position === "before") {
      newState.splice(targetIndex, 0, movedItem);
    } else if (position === "after") {
      newState.splice(targetIndex + 1, 0, movedItem);
    } else if (position === "toLast") {
      newState.push(movedItem);
    }

    state = newState;
    return true;
  };

  return {
    get state() {
      return [...state];
    },

    move(id: string) {
      return {
        before(targetId: string) {
          return moveItem(id, "before", targetId);
        },
        after(targetId: string) {
          return moveItem(id, "after", targetId);
        },
        toLast() {
          return moveItem(id, "toLast");
        },
      };
    },

    remove(id: string) {
      const index = state.findIndex((item) => getId(item) === id);
      if (index === -1) {
        console.warn(`Item with id "${id}" not found. Cannot remove.`);
        return false;
      }
      state = state.filter((item) => getId(item) !== id);
      return true;
    },

    replace(id: string, item: T) {
      const index = state.findIndex((i) => getId(i) === id);
      if (index === -1) {
        console.warn(`Item with id "${id}" not found. Cannot replace.`);
        return false;
      }
      state = state.map((i) => (getId(i) === id ? item : i));
      return true;
    },

    notify: sync,
  };
};

export default createSorter;
