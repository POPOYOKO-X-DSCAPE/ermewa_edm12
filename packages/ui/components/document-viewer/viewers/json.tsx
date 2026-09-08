import { css } from "@styles";
import classNames from "classnames";
import { useEffect, useState } from "react";
import ReactJson from "react-json-view";
import { Stack } from "../../../abstract/stack/stack";

const danger = css({
	color: "s.danger",
});

type JsonViewerProps = {
	url?: string;
	jsonData?: Record<string, unknown>;
};

export const JsonViewer: React.FC<JsonViewerProps> = ({
	url,
	jsonData,
}) => {
	const [data, setData] = useState<Record<string, unknown> | null>(
		jsonData || null,
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
			} catch (err) {
				console.error(err);
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setIsLoading(false);
			}
		};

		fetchJson();
	}, [url]);

	return (
		<Stack className={classNames("json-viewer")} scrollable grow>
			{isLoading && <p>Loading JSON...</p>}
			{error && <p className={danger}>{error}</p>}
			{data && (
				<ReactJson
					src={data}
					name={false}
					collapsed={false}
					enableClipboard={true}
					displayDataTypes={false}
					theme={"tomorrow"}
					// Third-party prop: raw CSS style, not a Panda token path.
					style={{ padding: "24px" }}
				/>
			)}
			{!isLoading && !error && !data && <p>No data available.</p>}
		</Stack>
	);
};
