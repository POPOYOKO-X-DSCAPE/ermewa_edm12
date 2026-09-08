import {
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";

import type {
	DisplaySelectFieldKey,
	DisplaySelectItem,
} from "@src/interface-adapters/contracts/common/display-select.fields";
import type {
	DisplaySelectManualError,
	DisplaySelectManualSelection,
	DisplaySelectSelection,
	DisplaySelectState,
	DisplaySelectViewProps,
} from "@src/presentation/contracts/display-select.interface";
import {
	parseDisplaySelectDefinition,
} from "@src/presentation/models/display-select/display-select-layout";
import {
	buildDisplaySelectFilterViews,
	buildDisplaySelectItemViews,
	filterDisplaySelectItems,
	prepareDisplaySelectItems,
	type DisplaySelectFilters,
} from "@src/presentation/models/display-select/display-select.presenter";

export type UseDisplaySelectOptions = Readonly<{
	items?: readonly DisplaySelectItem[];
	layout: unknown;
	loading?: boolean;
	errorMessage?: string;
	locale?: string;
	currentFolderName?: string;
	initialVisibleCount?: number;
	emptyMode?: "manual" | "empty";
	translateLabel?: (
		translationKey: string,
		fallback: string,
	) => string;
	onSelect: (
		selection: DisplaySelectSelection,
	) => void | Promise<void>;
	onManualSubmit: (
		selection: DisplaySelectManualSelection,
	) => void | Promise<void>;
}>;

const configurationErrorMessage = (
	reason: "missing-layout" | "missing-bindings" | "missing-select-action",
): string => {
	switch (reason) {
		case "missing-layout":
			return "The display selection layout is missing.";
		case "missing-bindings":
			return "The display selection bindings are missing.";
		case "missing-select-action":
			return "The display selection action is missing.";
	}
};

export const useDisplaySelect = ({
	items: inputItems = [],
	layout,
	loading = false,
	errorMessage,
	locale,
	currentFolderName,
	initialVisibleCount = 15,
	emptyMode = "manual",
	translateLabel,
	onSelect,
	onManualSubmit,
}: UseDisplaySelectOptions): DisplaySelectViewProps => {
	const [filters, setFilters] = useState<DisplaySelectFilters>({});
	const [showAll, setShowAll] = useState(false);
	const [manualFolderName, setManualFolderName] = useState(
		currentFolderName ?? "",
	);
	const [manualFolderSid, setManualFolderSid] = useState("");
	const [manualErrors, setManualErrors] = useState<
		readonly DisplaySelectManualError[]
	>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const definitionResult = useMemo(
		() => parseDisplaySelectDefinition(layout),
		[layout],
	);

	const definition = definitionResult.ok
		? definitionResult.value
		: undefined;

	useEffect(() => {
		if (!currentFolderName || manualFolderName.trim()) {
			return;
		}

		setManualFolderName(currentFolderName);
	}, [currentFolderName, manualFolderName]);

	useEffect(() => {
		if (!definition) {
			setFilters({});
			return;
		}

		const allowedKeys = new Set(
			definition.filters.map((filter) => filter.key),
		);

		setFilters((current) => {
			const next: DisplaySelectFilters = {};
			let changed = false;

			for (const [key, value] of Object.entries(current)) {
				if (allowedKeys.has(key as DisplaySelectFieldKey)) {
					next[key as DisplaySelectFieldKey] = value;
				} else {
					changed = true;
				}
			}

			return changed ? next : current;
		});
	}, [definition]);

	const preparedItems = useMemo(
		() =>
			definition
				? prepareDisplaySelectItems(
						inputItems,
						definition,
						locale,
					)
				: [],
		[definition, inputItems, locale],
	);

	const filteredItems = useMemo(
		() => filterDisplaySelectItems(preparedItems, filters),
		[filters, preparedItems],
	);

	const safeInitialVisibleCount = Math.max(
		1,
		Math.trunc(initialVisibleCount),
	);
	const visiblePreparedItems = showAll
		? filteredItems
		: filteredItems.slice(0, safeInitialVisibleCount);

	const filterViews = useMemo(() => {
		if (!definition) {
			return [];
		}

		return buildDisplaySelectFilterViews(
			definition,
			inputItems,
			filters,
			locale,
		).map((filter) => ({
			...filter,
			label: translateLabel
				? translateLabel(filter.translationKey, filter.label)
				: filter.label,
		}));
	}, [definition, filters, inputItems, locale, translateLabel]);

	const itemViews = useMemo(
		() => buildDisplaySelectItemViews(visiblePreparedItems, filters),
		[filters, visiblePreparedItems],
	);

	const state: DisplaySelectState = loading
		? "loading"
		: errorMessage
			? "error"
			: !definitionResult.ok
				? "invalid-configuration"
				: inputItems.length === 0
					? emptyMode
					: filteredItems.length === 0
						? "empty"
						: "ready";

	const handleFilterChange = useCallback(
		(key: DisplaySelectFieldKey, value: string) => {
			setFilters((current) => {
				const next = { ...current };
				if (value) {
					next[key] = value;
				} else {
					delete next[key];
				}
				return next;
			});
			setShowAll(false);
		},
		[],
	);

	const handleClearFilters = useCallback(() => {
		setFilters({});
		setShowAll(false);
	}, []);

	const handleSelectItem = useCallback(
		async (itemId: string) => {
			if (!definition || isSubmitting) {
				return;
			}

			const item = inputItems.find((entry) => entry.id === itemId);
			if (!item) {
				return;
			}

			const prepared = preparedItems.find(
				(entry) => entry.id === itemId,
			);
			const value = prepared?.selectionValue.trim() ?? "";
			if (!value) {
				return;
			}

			setIsSubmitting(true);
			try {
				await onSelect({
					itemId,
					field: definition.selectField,
					value,
					item,
				});
			} finally {
				setIsSubmitting(false);
			}
		},
		[
			definition,
			inputItems,
			isSubmitting,
			onSelect,
			preparedItems,
		],
	);

	const handleManualSubmit = useCallback(async () => {
		if (isSubmitting) {
			return;
		}

		const folderName =
			manualFolderName.trim() || currentFolderName?.trim() || "";
		const folderSid = manualFolderSid.trim();
		const errors: DisplaySelectManualError[] = [];

		if (!folderName) {
			errors.push({ field: "folderName", code: "required" });
		}
		if (!folderSid) {
			errors.push({ field: "folderSid", code: "required" });
		}

		setManualErrors(errors);
		if (errors.length) {
			return;
		}

		setIsSubmitting(true);
		try {
			await onManualSubmit({ folderName, folderSid });
		} finally {
			setIsSubmitting(false);
		}
	}, [
		currentFolderName,
		isSubmitting,
		manualFolderName,
		manualFolderSid,
		onManualSubmit,
	]);

	const remainingCount = Math.max(
		0,
		filteredItems.length - visiblePreparedItems.length,
	);

	return {
		state,
		filters: filterViews,
		items: itemViews,
		totalCount: inputItems.length,
		filteredCount: filteredItems.length,
		visibleCount: visiblePreparedItems.length,
		hasMore: remainingCount > 0,
		remainingCount,
		showAll,
		manual: {
			folderName: manualFolderName,
			folderSid: manualFolderSid,
			showFolderName: !currentFolderName,
			errors: manualErrors,
		},
		configurationError: definitionResult.ok
			? undefined
			: configurationErrorMessage(definitionResult.reason),
		errorMessage,
		isSubmitting,
		onFilterChange: handleFilterChange,
		onClearFilters: handleClearFilters,
		onShowAll: () => setShowAll(true),
		onSelectItem: handleSelectItem,
		onManualFolderNameChange: (value) => {
			setManualFolderName(value);
			setManualErrors((current) =>
				current.filter((error) => error.field !== "folderName"),
			);
		},
		onManualFolderSidChange: (value) => {
			setManualFolderSid(value);
			setManualErrors((current) =>
				current.filter((error) => error.field !== "folderSid"),
			);
		},
		onManualSubmit: handleManualSubmit,
	};
};
