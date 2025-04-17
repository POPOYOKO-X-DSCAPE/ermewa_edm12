// biome-ignore lint/style/useImportType: <explanation>
import React from "react";

export type ChildType = string | string[];

export interface ButtonProps {
	variant?: "primary" | "secondary" | "tertiary";
	children: ChildType;
	action: () => void;
	value?: string;
	type?: "button";
	disabled?: boolean;
}

export const Button = ({
	variant = "primary",
	children,
	action,
	value = undefined,
	type = undefined,
	disabled = false,
}: ButtonProps): React.ReactElement<ButtonProps> => {
	return (
		<button
			className={`${variant} ${disabled ? "disabled" : ""}`}
			onClick={disabled ? undefined : action}
			type={type}
			value={value}
			disabled={disabled}
		>
			{children}
		</button>
	);
};

Button.Primary = (props: Omit<ButtonProps, "variant">) => {
	return <Button variant="primary" {...props} />;
};

Button.Secondary = (props: Omit<ButtonProps, "variant">) => {
	return <Button variant="secondary" {...props} />;
};

Button.Tertiary = (props: Omit<ButtonProps, "variant">) => {
	return <Button variant="tertiary" {...props} />;
};

export default Button;
