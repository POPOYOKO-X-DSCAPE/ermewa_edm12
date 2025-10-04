import { useState } from "react";

type StoreType<T extends Record<string, {}>> = T;

const useStore = <T extends Record<string, {}>>(initialData?: StoreType<T>) => {
  const [store, setStore] = useState<StoreType<T>>(
    initialData || ({} as StoreType<T>)
  );

  const upsert = (key: keyof T, record: T[keyof T]) => {
    setStore((prevStore) => ({
      ...prevStore,
      [key]: record,
    }));
  };

  const remove = (key: keyof T) => {
    setStore((prevStore) => {
      const updatedStore = { ...prevStore };
      delete updatedStore[key];
      return updatedStore;
    });
  };

  const reset = () => {
    setStore(initialData || ({} as StoreType<T>));
  };

  return { store, upsert, remove, reset };
};

export default useStore;
