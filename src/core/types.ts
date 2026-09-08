import { typeSystem } from "@packages/free/core/types/type.engine";
import { isErmiDate, isErmiDateOrEmpty } from "./type-utils";

/**
 * Base enhanced primitives
 */
const appTypes = typeSystem
	.refine((t) => ({
		/**
		 * String
		 */
		nonEmptyString: t.string(
			(v) => v.length > 0 || "string must not be empty",
		),

		trimmedString: t.string(
			(v) => v.trim().length === v.length || "string must be trimmed",
		),

		sizedString: t.string(
			(v) => v.length >= 3 || "string is too short (min 3)",
			(v) => v.length <= 255 || "string is too long (max 255)",
		),

		/**
		 * Number
		 */
		positiveNumber: t.number(
			(v) => Number.isFinite(v) || "number must be finite",
			(v) => v > 0 || "number must be positive",
		),

		positiveInt: t.number(
			(v) => Number.isInteger(v) || "number must be an integer",
			(v) => v > 0 || "integer must be positive",
		),

		percentage: t.number(
			(v) => Number.isFinite(v) || "percentage must be finite",
			(v) => v >= 0 || "percentage must be >= 0",
			(v) => v <= 100 || "percentage must be <= 100",
		),
	}))

	/**
	 * Identifiers & value objects
	 */
	.refine(
		({ nonEmptyString, trimmedString, sizedString, positiveInt }) => ({
			uuid: nonEmptyString(
				(v) =>
					/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
						v,
					) || "invalid UUID format",
			),

			email: trimmedString(
				(v) =>
					/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ||
					"invalid email address",
			),

			slug: sizedString(
				(v) =>
					/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) ||
					"slug must be kebab-case (lowercase, hyphens)",
			),

			username: sizedString(
				(v) =>
					/^[a-zA-Z0-9_]+$/.test(v) ||
					"username may only contain letters, numbers and underscores",
			),

			entityId: positiveInt(
				(v) => v < Number.MAX_SAFE_INTEGER || "id is too large",
			),
		}),
	)

	/**
	 * Domain flavored types
	 */
	.refine(({ string, email, positiveInt, percentage }) => ({
		userEmail: email(),

		age: positiveInt((v) => v <= 120 || "age must be <= 120"),

		completionRate: percentage(),

		password: string(
			(v) => v.length >= 8 || "password too short (min 8)",
			(v) =>
				/[A-Z]/.test(v) || "password must contain an uppercase letter",
			(v) =>
				/[a-z]/.test(v) || "password must contain a lowercase letter",
			(v) => /[0-9]/.test(v) || "password must contain a number",
		),

		isoDate: string(
			(v) =>
				v.trim().length === 0 ||
				!Number.isNaN(Date.parse(v)) ||
				"not an ISO-like date",
		),

		documentDate: string(
			(v) => isErmiDate(v) || "date must match YYYY-MM-DD",
		),

		documentDateOrEmpty: string(
			(v) =>
				isErmiDateOrEmpty(v) ||
				"date must match YYYY-MM-DD or be empty",
		),

		binaryLike: [
			(v: Blob | File) => {
				if (typeof Blob !== "undefined") {
					return v instanceof Blob || "not a Blob/File";
				}

				return (
					(typeof v === "object" &&
						v !== null &&
						"size" in v &&
						"type" in v &&
						"arrayBuffer" in v) ||
					"not a Blob/File"
				);
			},
		] as const,
	}));

export default appTypes;
