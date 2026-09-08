export type GraphErrorCode =
	| "root_not_found"
	| "unknown_field"
	| "required_missing"
	| "relation_not_found"
	| "unset_not_allowed"
	| "reset_not_allowed"
	| "derive_threw"
	| "type_mismatch";

export type LeafErrors = readonly GraphErrorCode[];
