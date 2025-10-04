import { useEffect, useRef, useState } from "react";

const useEditableContent = (
  initialValue?: string,
  onChange?: (newValue: string) => void
) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  const inputRef = useRef<HTMLInputElement | null>(null); // Single ref for both text and date inputs

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const startEditing = () => {
    setIsEditing(true);
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  };

  const stopEditing = () => {
    setIsEditing(false);
  };

  const handleBlur = () => {
    if (inputRef.current) {
      const newValue = inputRef.current.value;
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    }
    stopEditing();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
    }
  };

  const handleInput = () => {
    if (inputRef.current) {
      const newValue = inputRef.current.value;
      setValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    }
  };

  return {
    value,
    isEditing,
    inputRef,
    startEditing,
    stopEditing,
    handleBlur,
    handleKeyDown,
    handleInput,
  };
};

export default useEditableContent;
