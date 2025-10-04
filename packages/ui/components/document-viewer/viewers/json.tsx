import React, { useState, useEffect } from "react";
import ReactJson from "react-json-view";

type JsonViewerProps = {
  url?: string;
  jsonData?: Record<string, unknown>;
};

export const JsonViewer: React.FC<JsonViewerProps> = ({ url, jsonData }) => {
  const [data, setData] = useState<Record<string, unknown> | null>(
    jsonData || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    setIsLoading(true);
    setError(null);

    const fetchJson = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(`Failed to fetch JSON: ${response.status}`);
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJson();
  }, [url]);

  return (
    <div className="json-viewer">
      {isLoading && <p>Loading JSON...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {data && (
        <ReactJson
          src={data}
          name={false}
          collapsed={false}
          enableClipboard={true}
          displayDataTypes={false}
          theme={"tomorrow"}
          style={{ padding: "24px" }}
        />
      )}
      {!isLoading && !error && !data && <p>No data available.</p>}
    </div>
  );
};
