import useEditableContent from "@/presentation/hooks/use-editable-content";

interface EditableFieldProps {
  label: string;
  initialValue?: string;
  onChange?: (newValue: string) => void;
  isDate?: boolean; // Indicates if the field is a date
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  initialValue,
  onChange,
  isDate = false,
}) => {
  const {
    value,
    isEditing,
    inputRef,
    startEditing,
    handleBlur,
    handleKeyDown,
    handleInput,
  } = useEditableContent(initialValue, onChange);

  return (
    <div className="editable-field">
      <span className="label" style={{ fontSize: "x-small", padding: "4px" }}>
        {label}:
      </span>
      {!isEditing ? (
        <div
          onDoubleClick={startEditing}
          style={{
            border: "1px solid transparent",
            padding: "4px",
            minHeight: "24px",
            cursor: "text",
            width: "fit-content",
          }}
        >
          {value || (isDate ? "YYYY-MM-DD" : "---")}
        </div>
      ) : (
        <input
          ref={inputRef}
          type={isDate ? "date" : "text"}
          value={value}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          style={{
            border: "1px solid blue",
            padding: "4px",
            minHeight: "24px",
            width: "100%",
          }}
          // biome-ignore lint/a11y/noAutofocus: <needed in this specific case>
          autoFocus={true}
        />
      )}
    </div>
  );
};

export default EditableField;
