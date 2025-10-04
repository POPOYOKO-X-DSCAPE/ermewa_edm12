import { useMemo, useState } from "react";

const ZOOM_LEVELS = [25, 33, 50, 67, 75, 80, 90, 100, 150, 200];

export type ZoomMode = "fit-width" | "fit-height" | "custom";

export const useZoom = (controlledZoom?: number, initialZoom = 100) => {
	const [zoomIndex, setZoomIndex] = useState(
		ZOOM_LEVELS.indexOf(initialZoom) >= 0
			? ZOOM_LEVELS.indexOf(initialZoom)
			: ZOOM_LEVELS.indexOf(100),
	);
	const [zoomMode, setZoomModeState] = useState<ZoomMode>("fit-height");
	const [previousZoomMode, setPreviousZoomMode] =
		useState<ZoomMode | null>(null);

	const setZoomMode = (mode: ZoomMode) => {
		if (mode !== "custom") {
			setPreviousZoomMode(mode);
		}
		setZoomModeState(mode);
	};

	const getClosestIndex = (zoomPercent: number) =>
		ZOOM_LEVELS.reduce(
			(prev, z, i) =>
				Math.abs(z - zoomPercent) <
				Math.abs(ZOOM_LEVELS[prev] - zoomPercent)
					? i
					: prev,
			0,
		);

	const currentZoom = useMemo(() => {
		if (zoomMode === "custom") return ZOOM_LEVELS[zoomIndex] / 100;
		if (controlledZoom !== undefined) return controlledZoom;
		return ZOOM_LEVELS[zoomIndex] / 100;
	}, [zoomMode, zoomIndex, controlledZoom]);

	const zoomIn = (effectiveZoom?: number) => {
		const basePercent = (effectiveZoom ?? currentZoom) * 100;
		let startIndex =
			zoomMode === "custom" ? zoomIndex : getClosestIndex(basePercent);
		setZoomMode("custom");
		if (startIndex < ZOOM_LEVELS.length - 1) {
			if (ZOOM_LEVELS[startIndex] <= basePercent) startIndex++;
			setZoomIndex(startIndex);
		}
	};

	const zoomOut = (effectiveZoom?: number) => {
		const basePercent = (effectiveZoom ?? currentZoom) * 100;
		let startIndex =
			zoomMode === "custom" ? zoomIndex : getClosestIndex(basePercent);
		setZoomMode("custom");
		if (startIndex > 0) {
			if (ZOOM_LEVELS[startIndex] >= basePercent) startIndex--;
			setZoomIndex(startIndex);
		}
	};

	const canZoomIn = useMemo(
		() => currentZoom * 100 < Math.max(...ZOOM_LEVELS),
		[currentZoom],
	);
	const canZoomOut = useMemo(
		() => currentZoom * 100 > Math.min(...ZOOM_LEVELS),
		[currentZoom],
	);

	return {
		zoomMode,
		previousZoomMode,
		setZoomMode,
		currentZoom,
		zoomIn,
		zoomOut,
		zoomPercent: Math.round(currentZoom * 100),
		canZoomIn,
		canZoomOut,
	};
};
