import classNames from "classnames";
import { useState } from "react";

import "./index.scss";

export interface FormProps {
  children:
    | React.ReactElement<typeof FormInput>
    | React.ReactElement<typeof FormInput>[];
}

export const Form = ({ children }: FormProps) => {
  return <form>{children}</form>;
};

export interface InputProps {
  label: string;
  placeholder: string;
  initialValue?: string;
  value?: string;
  type: "text" | "date";
  onChange?: (e: React.ChangeEvent) => void;
}

const FormInput = ({
  label,
  placeholder,
  initialValue,
  value: controlledValue,
  type,
  onChange,
}: InputProps) => {
  const [value, setValue] = useState(initialValue);
  const isControlled = controlledValue !== undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;
    if (isControlled) {
      setValue(newValue);
    }

    onChange?.(e);
  };

  return (
    <div className={classNames("input")}>
      <label htmlFor={label} aria-label={label}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={isControlled ? controlledValue : value}
        onChange={handleChange}
      />
    </div>
  );
};

Form.Input = ({
  label,
  placeholder,
  type,
  value,
  initialValue,
  onChange,
}: InputProps) => {
  return (
    <FormInput
      label={label}
      placeholder={placeholder}
      type={type}
      value={value}
      onChange={onChange}
      initialValue={initialValue}
    />
  );
};
