import { derive, reset, unset } from "../runtime/intent.engine";
import {
	isOptionalType,
	stripOptionalType,
} from "../runtime/state.optional";
import type { OneOfField } from "./state.definition";

/* -----------------------
   tokens
----------------------- */

const VALUE = Symbol("graph.value");

export type ValueToken = { readonly [VALUE]: true };
export const value: ValueToken = { [VALUE]: true };

export const isValue = (v: unknown): v is ValueToken =>
	typeof v === "object" &&
	v !== null &&
	VALUE in (v as Record<PropertyKey, unknown>);

const SELF = Symbol("graph.self");

export type SelfToken = { readonly [SELF]: true };

export const self: SelfToken = { [SELF]: true };

export const isSelf = (v: unknown): v is SelfToken =>
	typeof v === "object" &&
	v !== null &&
	SELF in (v as Record<PropertyKey, unknown>);

/* -----------------------
   db schema (json)
   - scalars = string typeName (+ '?' for optional)
   - objects = fields records
   - one/many = node relation, min indicates optional (0) or required (1)
----------------------- */

export type ScalarTypeName<TNames extends string> =
	| TNames
	| `${TNames}?`;

export type OneRel<Node extends string> = {
	readonly __kind: "one";
	readonly target: Node;
	readonly min: 0 | 1;
};

export type ManyRel<Node extends string> = {
	readonly __kind: "many";
	readonly target: Node;
	readonly min: 0 | 1;
};

export type ArrayDef<Node extends string, TNames extends string> = {
	readonly __kind: "array";
	readonly of: FieldDef<Node, TNames>;
};

export interface ObjectDef<Node extends string, TNames extends string> {
	readonly [key: string]: FieldDef<Node, TNames>;
}

export type FieldDef<Node extends string, TNames extends string> =
	| ScalarTypeName<TNames>
	| OneOfField<
			readonly (string | number | boolean | null | undefined)[]
	  >
	| OneRel<Node>
	| ManyRel<Node>
	| ArrayDef<Node, TNames>
	| ObjectDef<Node, TNames>;

export type GraphDb<
	Node extends string,
	TNames extends string,
	Db extends Readonly<
		Record<Node, Readonly<Record<string, FieldDef<Node, TNames>>>>
	> = Readonly<
		Record<Node, Readonly<Record<string, FieldDef<Node, TNames>>>>
	>,
> = Db;

/* -----------------------
   re-exports intents
----------------------- */

export { derive, unset, reset, isOptionalType, stripOptionalType };
