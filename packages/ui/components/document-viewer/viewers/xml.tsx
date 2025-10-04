import React, { useState, useEffect } from "react";
import XMLViewer from "react-xml-viewer";

type XmlViewerProps = {
  url?: string;
  xmlData?: string;
};

export const XmlViewer: React.FC<XmlViewerProps> = ({ url, xmlData }) => {
  const [data, setData] = useState<string | null>(xmlData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    setIsLoading(true);
    setError(null);

    const fetchXml = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch XML: ${response.status}`);
        const text = await response.text();
        setData(text);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchXml();
  }, [url]);

  return (
    <div className="xml-viewer">
      {isLoading && <p>Loading XML...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {data && <XMLViewer xml={data} />}
      {!isLoading && !error && !data && <p>No data available.</p>}
    </div>
  );
};
