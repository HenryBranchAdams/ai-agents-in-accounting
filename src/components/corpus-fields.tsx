import type { ComponentProps } from "react";
import { Field, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import { NativeSelect, NativeSelectOption } from "./ui/native-select";

export function SelectField({
  name,
  label,
  values,
  selected = "",
  allLabel,
}: {
  name: string;
  label: string;
  values: [string, string][];
  selected?: string;
  allLabel?: string;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={`filter-${name}`}>{label}</FieldLabel>
      <NativeSelect id={`filter-${name}`} name={name} defaultValue={selected}>
        {allLabel !== undefined && (
          <NativeSelectOption value="">{allLabel}</NativeSelectOption>
        )}
        {values.map(([value, title]) => (
          <NativeSelectOption key={value} value={value}>
            {title}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  );
}
export function InputField({
  name,
  label,
  ...props
}: ComponentProps<"input"> & { name: string; label: string }) {
  return (
    <Field>
      <FieldLabel htmlFor={`filter-${name}`}>{label}</FieldLabel>
      <Input {...props} id={`filter-${name}`} name={name} />
    </Field>
  );
}
