import { useState, useEffect } from "preact/hooks";
import { getPDFPageCountFromFile } from "@/infra-structures/libraries/pdf";

const usePdfPageCount = (file: File) => {
  if (file.type !== "application/pdf") return 0;

  const [pageCount, setPageCount] = useState<number | null>(null);

  useEffect(() => {
    if (!file) {
      setPageCount(null);
      return;
    }

    let isMounted = true;

    const handlePageCount = (count: number) => {
      if (isMounted) {
        setPageCount(count);
      }
    };

    getPDFPageCountFromFile(file, handlePageCount);

    return () => {
      isMounted = false;
    };
  }, [file]);

  return pageCount;
};

export default usePdfPageCount;
