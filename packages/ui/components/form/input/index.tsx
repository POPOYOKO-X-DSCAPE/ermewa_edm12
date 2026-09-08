import {
	FormInput,
	FormLabel,
	type FormStore,
	useStoreState,
} from "@ariakit/react";
import { Stack } from "@packages/ui";
import classNames from "classnames";
import type { ChangeEvent, ReactNode } from "react";
import { useId } from "react";
import { Styles } from "./styles";

export type InputProps<T extends FormStore = FormStore> = {
	form: T;
	name: keyof T["names"];
	label: string;
	type?: "input" | "textarea";
	prefix?: ReactNode;
	suffix?: ReactNode;
	disabled?: boolean;
	onChange?: (
		event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => void;
};

export const Input = <T extends FormStore = FormStore>({
	form,
	name,
	label,
	type = "input",
	prefix,
	suffix,
	disabled = false,
	onChange,
}: InputProps<T>) => {
	const field = name.toString();
	const labelId = useId();
	const error = useStoreState(
		form,
		() => form.getError(field) ?? undefined,
	);
	const boxClass = classNames(
		Styles.base,
		error != null && Styles.stateError,
		disabled && Styles.stateDisabled,
	);

	return (
		<Stack className={classNames(Styles.container)}>
			<FormLabel
				store={form}
				name={field}
				id={labelId}
				className={classNames(Styles.label)}
			>
				{label}
			</FormLabel>
			<div className={boxClass}>
				{prefix != null && (
					<span className={classNames(Styles.prefix)}>{prefix}</span>
				)}
				{type === "input" ? (
					<FormInput
						store={form}
						name={field}
						aria-labelledby={labelId}
						className={classNames(Styles.inner)}
						disabled={disabled}
						onChange={onChange}
					/>
				) : (
					<FormInput
						store={form}
						name={field}
						aria-labelledby={labelId}
						render={<textarea />}
						className={classNames(Styles.inner)}
						disabled={disabled}
						onChange={onChange}
					/>
				)}
				{suffix != null && (
					<span className={classNames(Styles.suffix)}>{suffix}</span>
				)}
			</div>
			{error != null && (
				<span className={classNames(Styles.errorMessage)} role="alert">
					{error}
				</span>
			)}
		</Stack>
	);
};
