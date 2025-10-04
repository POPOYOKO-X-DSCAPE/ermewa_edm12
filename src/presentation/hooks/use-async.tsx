import { useEffect, useMemo, useState } from "react";

const useAsync = <T,>(
  fn: () => Promise<T>,
  { shouldLoadOnInit }: { shouldLoadOnInit: boolean }
) => {
  const [result, setResult] = useState<T | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  const isLoading = useMemo(() => result === undefined, [result]);

  const callAsync = async () => {
    let asyncResult: T | undefined = undefined;

    try {
      asyncResult = await fn();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(String(error));
      }
    } finally {
      setResult(asyncResult);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (shouldLoadOnInit) callAsync();
  }, [shouldLoadOnInit]);

  return {
    result,
    errorMessage,
    isLoading,
    call: callAsync,
  };
};

export default useAsync;
