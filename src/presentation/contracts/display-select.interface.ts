import type {
	DisplaySelectFieldKey,
	DisplaySelectItem,
} from "@src/interface-adapters/contracts/common/display-select.fields";

export type DisplaySelectState =
	| "loading"
	| "ready"
	| "empty"
	| "manual"
	| "error"
	| "invalid-configuration";

export type DisplaySelectTextSegment = Readonly<{
	text: string;
	highlighted: boolean;
}>;

export type DisplaySelectFilterView = Readonly<{
	key: DisplaySelectFieldKey;
	translationKey: string;
	label: string;
	placeholder: string;
	value: string;
}>;

export type DisplaySelectFieldView = Readonly<{
	key: DisplaySelectFieldKey;
	label: string;
	value: string;
	segments: readonly DisplaySelectTextSegment[];
}>;

export type DisplaySelectItemView = Readonly<{
	id: string;
	fields: readonly DisplaySelectFieldView[];
	selectionValue: string;
	selectable: boolean;
}>;

export type DisplaySelectSelection = Readonly<{
	itemId: string;
	field: DisplaySelectFieldKey;
	value: string;
	item: DisplaySelectItem;
}>;

export type DisplaySelectManualSelection = Readonly<{
	folderName: string;
	folderSid: string;
}>;

export type DisplaySelectManualField = "folderName" | "folderSid";

export type DisplaySelectManualError = Readonly<{
	field: DisplaySelectManualField;
	code: "required";
}>;

export type DisplaySelectManualView = Readonly<{
	folderName: string;
	folderSid: string;
	showFolderName: boolean;
	errors: readonly DisplaySelectManualError[];
}>;

export type DisplaySelectViewProps = Readonly<{
	state: DisplaySelectState;
	filters: readonly DisplaySelectFilterView[];
	items: readonly DisplaySelectItemView[];
	totalCount: number;
	filteredCount: number;
	visibleCount: number;
	hasMore: boolean;
	remainingCount: number;
	showAll: boolean;
	manual: DisplaySelectManualView;
	configurationError?: string;
	errorMessage?: string;
	isSubmitting: boolean;
	onFilterChange: (
		key: DisplaySelectFieldKey,
		value: string,
	) => void;
	onClearFilters: () => void;
	onShowAll: () => void;
	onSelectItem: (itemId: string) => Promise<void>;
	onManualFolderNameChange: (value: string) => void;
	onManualFolderSidChange: (value: string) => void;
	onManualSubmit: () => Promise<void>;
}>;
