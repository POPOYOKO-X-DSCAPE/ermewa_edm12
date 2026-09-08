import { type IntentPath, createIntentEngine } from "./intent.engine";
import {
	type RuntimeEntityField,
	buildErrorTree,
	validateState,
	validateStateAtPaths,
} from "./state.validation";

type Validators = Record<
	string,
	readonly ((v: unknown) => boolean | string)[]
>;

type ValidationMode = "full" | "paths" | "none";

export type StateInstance<TState extends Record<PropertyKey, unknown>> =
	{
		readonly state: TState;
		readonly errors: unknown;

		patch(
			input: Parameters<
				ReturnType<typeof createIntentEngine<TState>>["merge"]
			>[0],
		): StateInstance<TState>;

		set(
			input: Parameters<
				ReturnType<typeof createIntentEngine<TState>>["replace"]
			>[0],
		): StateInstance<TState>;
	};

export const makeStateInstance = <
	TState extends Record<PropertyKey, unknown>,
>(args: {
	types: Validators;
	schema: Record<string, RuntimeEntityField>;
	initial: TState;
	onMutate?: () => void;
	notify?: () => void;
	notifyPaths?: (paths: readonly IntentPath[]) => void;
	validation?: {
		patch?: ValidationMode;
		set?: ValidationMode;
	};
}) => {
	const {
		types,
		schema,
		initial,
		onMutate,
		notify,
		notifyPaths,
		validation,
	} = args;

	const errors = buildErrorTree(schema);
	const engine = createIntentEngine<TState>(initial);

	validateState(types, schema, initial, errors, true);

	const patchValidationMode = validation?.patch ?? "paths";
	const setValidationMode = validation?.set ?? "full";

	const runValidation = (mode: ValidationMode, isInitial: boolean) => {
		const touchedPaths = engine.lastMutation.paths;
		if (!touchedPaths.length || mode === "none") {
			return;
		}

		if (mode === "full") {
			validateState(types, schema, engine.current, errors, isInitial);
			return;
		}

		validateStateAtPaths(
			types,
			schema,
			engine.current,
			errors,
			touchedPaths,
		);
	};

	const flushNotifications = () => {
		const touchedPaths = engine.lastMutation.paths;
		if (!touchedPaths.length) {
			return;
		}

		onMutate?.();
		notifyPaths?.(touchedPaths);
		notify?.();
	};

	const instance: StateInstance<TState> = {
		get state() {
			return engine.current;
		},
		get errors() {
			return errors;
		},
		patch(input) {
			engine.merge(input);
			runValidation(patchValidationMode, false);
			flushNotifications();
			return instance;
		},
		set(input) {
			engine.replace(input);
			runValidation(setValidationMode, true);
			flushNotifications();
			return instance;
		},
	};

	return instance;
};
