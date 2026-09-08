import { Checkbox as AriaCheckbox } from "@ariakit/react";
import type { CheckboxProps as AriaCheckboxProps } from "@ariakit/react";
import classNames from "classnames";
import { useId } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Styles } from "./styles";

export type OnValueChangeFn = (value: boolean) => void;

export interface CheckboxProps
	extends Omit<
		AriaCheckboxProps,
		"onChange" | "checked" | "defaultValue"
	> {
	checked?: "mixed" | boolean;
	disabled?: boolean;
	name?: string;
	value?: string;
	ariaLabel?: string;
	label?: ReactNode;
	onValueChange?: OnValueChangeFn;
	children?: never;
}

export function Checkbox({
	checked,
	disabled,
	name,
	value,
	ariaLabel,
	label,
	onValueChange,
	className,
	...rest
}: CheckboxProps) {
	const checkboxId = useId();

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		onValueChange?.(e.currentTarget.checked);
	};

	return (
		<label
			htmlFor={checkboxId}
			className={classNames(Styles.group, className)}
		>
			<AriaCheckbox
				id={checkboxId}
				className={Styles.checkbox}
				checked={checked}
				disabled={disabled ?? false}
				name={name}
				value={value}
				aria-label={ariaLabel}
				onChange={handleChange}
				{...rest}
			/>
			{label != null && label}
		</label>
	);
}
