export const toLocalIsoDate = (value: Date): string => {
	const year = value.getFullYear();
	const month = String(value.getMonth() + 1).padStart(2, "0");
	const day = String(value.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
};

export const getTodayIsoDate = () => toLocalIsoDate(new Date());

export const getTomorrowIsoDate = (): string => {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	return toLocalIsoDate(tomorrow);
};

export const normalizeMetaName = (value: string | undefined): string =>
	value?.trim() ?? "";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const normalizeMetaDate = (
	value: string | undefined,
): string => {
	const trimmed = value?.trim() ?? "";
	return ISO_DATE_RE.test(trimmed) ? trimmed : "";
};

export const isDocumentDateAllowed = (
	value: string | undefined,
): boolean => {
	const normalized = normalizeMetaDate(value);
	return normalized.length === 0 || normalized <= getTodayIsoDate();
};

export const isExpirationDateAllowed = (
	value: string | undefined,
): boolean => {
	const normalized = normalizeMetaDate(value);
	return normalized.length === 0 || normalized >= getTomorrowIsoDate();
};

export const normalizeControlText = (
	value: string | null | undefined,
): string => value?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";

export const isButtonLikeElement = (
	value: Element | null,
): value is HTMLElement =>
	value instanceof HTMLElement &&
	(value.tagName === "BUTTON" ||
		value.getAttribute("role") === "button");

export const hideElement = (element: HTMLElement) => {
	element.style.display = "none";
	element.setAttribute("aria-hidden", "true");
};

export const matchesPasteLabel = (value: string): boolean =>
	["paste", "coller", "kleben"].includes(value);

export const matchesAddPagesLabel = (value: string): boolean =>
	[
		/^add page(?:s)?$/i,
		/^ajouter (?:une|des )?page(?:s)?$/i,
		/^seite(?:n)? hinzufügen$/i,
	].some((pattern) => pattern.test(value));

export const hideNeighbourIconButtons = (
	button: HTMLElement,
	direction: "previousElementSibling" | "nextElementSibling",
) => {
	let current = button[direction];
	let hiddenCount = 0;

	while (current && hiddenCount < 3) {
		if (!isButtonLikeElement(current)) {
			break;
		}

		const visibleText = normalizeControlText(current.textContent);
		if (visibleText.length > 0) {
			break;
		}

		hideElement(current);
		hiddenCount += 1;
		current = current[direction];
	}
};

export const setElementDisabled = (
	element: HTMLElement,
	disabled: boolean,
) => {
	if (element instanceof HTMLButtonElement) {
		element.disabled = disabled;
		return;
	}

	if (disabled) {
		element.setAttribute("aria-disabled", "true");
		element.style.pointerEvents = "none";
		element.style.opacity = "0.5";
		return;
	}

	element.removeAttribute("aria-disabled");
	element.style.pointerEvents = "";
	element.style.opacity = "";
};

export const isZoomOverlayControl = (element: HTMLElement): boolean =>
	Boolean(
		element.closest('[data-document-viewer-zoom-controls="true"]'),
	);

export const applyPdfEditUiVisibility = (
	root: HTMLElement,
	readonly: boolean,
	interactionDisabled: boolean,
) => {
	const controls = Array.from(
		root.querySelectorAll<HTMLElement>('button, [role="button"]'),
	);

	for (const control of controls) {
		const label = normalizeControlText(
			control.getAttribute("aria-label") ||
				control.getAttribute("title") ||
				control.textContent,
		);

		if (matchesPasteLabel(label)) {
			hideElement(control);
			hideNeighbourIconButtons(control, "previousElementSibling");
			hideNeighbourIconButtons(control, "nextElementSibling");
			continue;
		}

		if (readonly && matchesAddPagesLabel(label)) {
			hideElement(control);
			continue;
		}

		if (isZoomOverlayControl(control)) {
			continue;
		}

		setElementDisabled(control, interactionDisabled);
	}
};

const STATUS_ACTION_IDS = new Set([
	"pending",
	"validate",
	"reject",
	"remove",
]);
const PRIMARY_ACTION_IDS = new Set(["save", "upload"]);

export const isStatusActionId = (id: string): boolean =>
	STATUS_ACTION_IDS.has(id);
export const isPrimaryActionId = (id: string): boolean =>
	PRIMARY_ACTION_IDS.has(id);
