import { useEffect, useMemo } from "react";

interface DefaultViewerProps {
	url: string;
	type: string;
	currentZoom?: number;
	onZoomChange?: (effectiveZoom: number) => void;
}

export const DefaultViewer = ({
	url,
	type,
	currentZoom = 1,
	onZoomChange,
}: DefaultViewerProps) => {
	const effectiveZoom = useMemo(() => {
		return currentZoom;
	}, [currentZoom]);

	useEffect(() => {
		onZoomChange?.(effectiveZoom);
	}, [effectiveZoom, onZoomChange]);

	if (type.match(/^(jpeg|jpg|png|gif|webp)$/i)) {
		return (
			<img
				src={url}
				alt="document"
				style={{
					maxWidth: `${effectiveZoom * 100}%`,
					maxHeight: `${effectiveZoom * 100}%`,
				}}
			/>
		);
	}

	if (type.match(/^(mp4|webm|ogg)$/i)) {
		return (
			// biome-ignore lint/a11y/useMediaCaption: <no captions are handled for now>
			<video
				src={url}
				controls
				style={{ maxWidth: "100%", maxHeight: "100%" }}
			/>
		);
	}

	if (type.match(/^(txt|md)$/i)) {
		return (
			<iframe
				src={url}
				style={{ width: "100%", height: "100%", border: "none" }}
				title="Text document"
			/>
		);
	}

	return <p>Type de document non pris en charge</p>;
};
