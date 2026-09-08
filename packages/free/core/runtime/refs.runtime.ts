import type { RefBuilder } from "../dsl/state.definition";
import {
	type RuntimeEntityField,
	isRefField,
} from "./state.validation";

export type EntityRefs = Record<
	string,
	{
		kind: symbol;
		min: number;
		max: number | "n";
	}
>;

export const makeRefBuilder = <
	MIN extends number,
	MAX extends number | "n" = MIN,
>(
	min: MIN,
	max?: MAX,
): RefBuilder<MIN, MAX> => {
	const realMax = (max ?? min) as MAX;

	const fn = ((kind: symbol) => ({
		__kind: "ref" as const,
		kind,
		min,
		max: realMax,
	})) as unknown as RefBuilder<MIN, MAX>;

	(
		fn as unknown as RefBuilder<MIN, MAX> & {
			to: <NEWMAX extends number>(
				newMax: NEWMAX,
			) => RefBuilder<MIN, NEWMAX>;
		}
	).to = <NEWMAX extends number>(newMax: NEWMAX) =>
		makeRefBuilder(min, newMax);

	(
		fn as unknown as RefBuilder<MIN, MAX> & {
			toMany: () => RefBuilder<MIN, "n">;
		}
	).toMany = () => makeRefBuilder(min, "n");

	return fn;
};

export const extractRefs = (
	entity: Record<string, RuntimeEntityField>,
): EntityRefs => {
	const refs: EntityRefs = {};

	for (const key in entity) {
		const field = entity[key];
		if (isRefField(field)) {
			refs[key] = {
				kind: field.kind,
				min: field.min,
				max: field.max,
			};
		}
	}

	return refs;
};
