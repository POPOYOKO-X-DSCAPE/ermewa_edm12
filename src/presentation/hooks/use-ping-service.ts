import { useCallback, useEffect, useMemo, useState } from "react";

const usePingService = (host: string) => {
  const [enabled, setEnabled] = useState(false);
  const memoizedStatus = useMemo(() => enabled, [enabled]);

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const watchHostStatus = useCallback(async () => {
    try {
      const result = await fetch(host);
      if (result.status === 200) setEnabled(true);
      else setEnabled(false);
    } catch (error) {
      setEnabled(false);
    } finally {
      await sleep(1000);
    }
  }, [host]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    watchHostStatus();
  }, []);

  return memoizedStatus;
};

export default usePingService;
