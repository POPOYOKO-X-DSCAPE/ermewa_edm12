import {
	readDisplaySelectFieldValue,
	type DisplaySelectFieldKey,
	type DisplaySelectItem,
} from "@src/interface-adapters/contracts/common/display-select.fields";
import type {
	DisplaySelectFilterView,
	DisplaySelectItemView,
} from "@src/presentation/contracts/display-select.interface";

import { formatDisplaySelectValue } from "./display-select-format";
import type { DisplaySelectDefinition } from "./display-select-layout";
import {
	buildDisplaySelectTextSegments,
	normalizeDisplaySelectSearch,
} from "./display-select-search";

export type DisplaySelectFilters = Partial<
	Record<DisplaySelectFieldKey, string>
>;

type PreparedDisplaySelectField = Readonly<{
	key: DisplaySelectFieldKey;
	label: string;
	value: string;
}>;

export type PreparedDisplaySelectItem = Readonly<{
	id: string;
	source: DisplaySelectItem;
	fields: readonly PreparedDisplaySelectField[];
	filterValues: Readonly<Partial<Record<DisplaySelectFieldKey, string>>>;
	selectionValue: string;
}>;

export const prepareDisplaySelectItems = (
	items: readonly DisplaySelectItem[],
	definition: DisplaySelectDefinition,
	locale?: string,
): readonly PreparedDisplaySelectItem[] =>
	items.map((item) => {
		const filterValues: Partial<Record<DisplaySelectFieldKey, string>> = {};

		for (const filter of definition.filters) {
			filterValues[filter.key] = normalizeDisplaySelectSearch(
				formatDisplaySelectValue(
					readDisplaySelectFieldValue(item, filter.key),
					filter.format,
					locale,
				),
			);
		}

		return {
			id: item.id,
			source: item,
			fields: definition.fields.map((field) => ({
				key: field.key,
				label: field.label,
				value: formatDisplaySelectValue(
					readDisplaySelectFieldValue(item, field.key),
					field.format,
					locale,
				),
			})),
			filterValues,
			selectionValue: String(
				readDisplaySelectFieldValue(item, definition.selectField),
			),
		};
	});

export const filterDisplaySelectItems = (
	items: readonly PreparedDisplaySelectItem[],
	filters: DisplaySelectFilters,
): readonly PreparedDisplaySelectItem[] => {
	const activeFilters = Object.entries(filters)
		.map(([key, value]) => ({
			key: key as DisplaySelectFieldKey,
			value: normalizeDisplaySelectSearch(value ?? ""),
		}))
		.filter((filter) => Boolean(filter.value));

	if (!activeFilters.length) {
		return items;
	}

	return items.filter((item) =>
		activeFilters.every((filter) =>
			(item.filterValues[filter.key] ?? "").includes(filter.value),
		),
	);
};

export const buildDisplaySelectFilterViews = (
	definition: DisplaySelectDefinition,
	items: readonly DisplaySelectItem[],
	filters: DisplaySelectFilters,
	locale?: string,
): readonly DisplaySelectFilterView[] => {
	const firstItem = items[0];

	return definition.filters.map((filter) => ({
		key: filter.key,
		translationKey: filter.translationKey,
		label: filter.label,
		placeholder: firstItem
			? formatDisplaySelectValue(
					readDisplaySelectFieldValue(firstItem, filter.key),
					filter.format,
					locale,
				)
			: "",
		value: filters[filter.key] ?? "",
	}));
};

export const buildDisplaySelectItemViews = (
	items: readonly PreparedDisplaySelectItem[],
	filters: DisplaySelectFilters,
): readonly DisplaySelectItemView[] =>
	items.map((item) => ({
		id: item.id,
		fields: item.fields.map((field) => ({
			key: field.key,
			label: field.label,
			value: field.value,
			segments: buildDisplaySelectTextSegments(
				field.value,
				filters[field.key] ?? "",
			),
		})),
		selectionValue: item.selectionValue,
		selectable: Boolean(item.selectionValue.trim()),
	}));
