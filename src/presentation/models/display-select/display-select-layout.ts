import {
	resolveDisplaySelectFieldKey,
	type DisplaySelectFieldKey,
} from "@src/interface-adapters/contracts/common/display-select.fields";

export type DisplaySelectFilterDefinition = Readonly<{
	key: DisplaySelectFieldKey;
	translationKey: string;
	label: string;
	format?: string;
}>;

export type DisplaySelectFieldDefinition = Readonly<{
	key: DisplaySelectFieldKey;
	label: string;
	format?: string;
}>;

export type DisplaySelectDefinition = Readonly<{
	filters: readonly DisplaySelectFilterDefinition[];
	fields: readonly DisplaySelectFieldDefinition[];
	selectField: DisplaySelectFieldKey;
}>;

export type DisplaySelectDefinitionError =
	| "missing-layout"
	| "missing-bindings"
	| "missing-select-action";

export type DisplaySelectDefinitionResult =
	| Readonly<{
			ok: true;
			value: DisplaySelectDefinition;
	  }>
	| Readonly<{
			ok: false;
			reason: DisplaySelectDefinitionError;
	  }>;

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | undefined =>
	typeof value === "object" && value !== null
		? (value as UnknownRecord)
		: undefined;

const asArray = (value: unknown): readonly unknown[] =>
	Array.isArray(value) ? value : [];

const readString = (record: UnknownRecord, ...keys: string[]) => {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "string" && value.trim()) {
			return value.trim();
		}
	}

	return undefined;
};

const readParameterValue = (input: unknown): unknown => {
	const record = asRecord(input);
	if (!record) {
		return input;
	}

	return asRecord(record.value) ?? input;
};

export const readDisplaySelectionLayout = (
	appProfile: unknown,
): unknown => {
	const profile = asRecord(asRecord(appProfile)?.profile);
	const parameters = asRecord(profile?.parameters);
	const parameter = asRecord(parameters?.displaySelectionLayout);

	return parameter?.value;
};

export const parseDisplaySelectDefinition = (
	input: unknown,
): DisplaySelectDefinitionResult => {
	const parameterValue = asRecord(readParameterValue(input));
	const dspQuery = asRecord(parameterValue?.dspQuery) ?? parameterValue;
	const content = asRecord(dspQuery?.content);
	const rootLayout = asRecord(content?.layout);
	const rootItem = asRecord(asArray(rootLayout?.items)[0]);
	const layout = asRecord(rootItem?.layout);

	if (!layout) {
		return {
			ok: false,
			reason: "missing-layout",
		};
	}

	const headerRecords = asArray(layout.header)
		.map(asRecord)
		.filter((value): value is UnknownRecord => Boolean(value));

	const bindingContainer = asRecord(asArray(layout.items)[0]);
	const bindingRecords = asArray(bindingContainer?.bind)
		.map(asRecord)
		.filter((value): value is UnknownRecord => Boolean(value));

	if (!bindingRecords.length) {
		return {
			ok: false,
			reason: "missing-bindings",
		};
	}

	const headerByField = new Map<
		DisplaySelectFieldKey,
		Readonly<{
			translationKey: string;
			label: string;
		}>
	>();

	for (const header of headerRecords) {
		const key = resolveDisplaySelectFieldKey(
			readString(header, "linkto", "linkTo"),
		);
		if (!key || headerByField.has(key)) {
			continue;
		}

		headerByField.set(key, {
			translationKey:
				readString(header, "alias") ?? key,
			label:
				readString(header, "defaultTxt", "defaultText") ?? key,
		});
	}

	const fields: DisplaySelectFieldDefinition[] = [];
	const fieldKeySet = new Set<DisplaySelectFieldKey>();
	let selectField: DisplaySelectFieldKey | undefined;

	for (const binding of bindingRecords) {
		const key = resolveDisplaySelectFieldKey(
			readString(binding, "field"),
		);
		if (!key) {
			continue;
		}

		if (!fieldKeySet.has(key)) {
			fields.push({
				key,
				label: headerByField.get(key)?.label ?? key,
				format: readString(binding, "format"),
			});
			fieldKeySet.add(key);
		}

		if (!selectField) {
			const hasSelectAction = asArray(binding.actions).some(
				(action) =>
					readString(asRecord(action) ?? {}, "action")
						?.toLowerCase() === "select",
			);

			if (hasSelectAction) {
				selectField = key;
			}
		}
	}

	if (!selectField) {
		return {
			ok: false,
			reason: "missing-select-action",
		};
	}

	const fieldByKey = new Map(fields.map((field) => [field.key, field]));
	const filters = Array.from(headerByField.entries()).map(
		([key, header]) => ({
			key,
			translationKey: header.translationKey,
			label: header.label,
			format: fieldByKey.get(key)?.format,
		}),
	);

	return {
		ok: true,
		value: {
			filters,
			fields,
			selectField,
		},
	};
};
