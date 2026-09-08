import { css } from "@styles";
import { useEffect, useState } from "react";
import XMLViewer from "react-xml-viewer";
import { Stack } from "../../../abstract/stack/stack";

const styles = {
	xml: css({
		padding: "s.padding.m",
	}),
	error: css({
		color: "s.danger",
	}),
};

type XmlViewerProps = {
	url?: string;
	xmlData?: string;
};

export const XmlViewer: React.FC<XmlViewerProps> = ({
	url,
	xmlData,
}) => {
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
				if (!response.ok)
					throw new Error(`Failed to fetch XML: ${response.status}`);
				const text = await response.text();
				setData(text);
			} catch (err) {
				console.error(err);
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				setIsLoading(false);
			}
		};

		fetchXml();
	}, [url]);

	return (
		<Stack className={"xml-viewer"} scrollable grow>
			{isLoading && <p>Loading XML...</p>}
			{error && <p className={styles.error}>{error}</p>}
			{data && (
				<Stack className={styles.xml}>
					<XMLViewer xml={data} />
				</Stack>
			)}
			{!isLoading && !error && !data && <p>No data available.</p>}
		</Stack>
	);
};
