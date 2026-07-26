import {
  Label,
  Tag,
  TagPicker as FluentTagPicker,
  TagPickerControl,
  TagPickerGroup,
  TagPickerInput,
  TagPickerList,
  TagPickerOption,
} from "@fluentui/react-components";
import React, { useState } from "react";
import { FormDescription, FormItem, FormMessage } from "@/components/ui/form";
import { Controller } from "react-hook-form";
import type { Control, FieldPathByValue, FieldValues } from "react-hook-form";

/**
 * The concrete form shape the inner picker works against: a single `string[]`
 * field. Keeping the implementation non-generic is what lets `field.value` be a
 * real `string[]` instead of an opaque `FieldPathValue<T, TName>`.
 */
type TagFieldValues = Record<string, string[]>;

interface TagPickerFieldProps {
  options: string[];
  label: string;
  name: string;
  formControl: Control<TagFieldValues>;
  shouldUnregister?: boolean;
  description?: string;
}

const TagPickerField = ({
  options,
  label,
  name,
  formControl,
  shouldUnregister,
  description,
}: TagPickerFieldProps) => {
  const [tagPickerOptions, setTagPickerOptions] = useState<string[]>(options);
  const [inputValue, setInputValue] = useState<string>("");

  const addOption = (option: string) => {
    setTagPickerOptions((prev) => [...prev, option]);
  };

  return (
    <Controller
      name={name}
      control={formControl}
      shouldUnregister={shouldUnregister}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <FormItem>
          <Label size={"medium"}>{label}</Label>
          <FluentTagPicker
            selectedOptions={value || []}
            onOptionSelect={(e, data) => {
              onChange(data.selectedOptions);
              setInputValue("");
            }}
          >
            <TagPickerControl>
              <TagPickerGroup>
                {value &&
                  value.map((option) => (
                    <Tag key={option} shape="rounded" value={option}>
                      {option}
                    </Tag>
                  ))}
              </TagPickerGroup>
              <TagPickerInput
                aria-label={label}
                value={inputValue}
                onChange={(e) => {
                  const newInputValue = e.target.value;
                  setInputValue(newInputValue);
                  if (newInputValue.includes(",")) {
                    const newOption = newInputValue.replace(",", "").trim();
                    if (newOption && !tagPickerOptions.includes(newOption)) {
                      addOption(newOption);
                    }
                    onChange([...(value || []), newOption]);
                    setInputValue("");
                  }
                }}
              />
            </TagPickerControl>
            <TagPickerList>
              {tagPickerOptions
                .filter(
                  (option) =>
                    (!value || !value.includes(option)) &&
                    option.toLowerCase().includes(inputValue.toLowerCase()),
                )
                .map((option) => (
                  <TagPickerOption value={option} key={option}>
                    {option}
                  </TagPickerOption>
                ))}
            </TagPickerList>
          </FluentTagPicker>
          {description && <FormDescription>{description}</FormDescription>}
          {error && <FormMessage>{error.message}</FormMessage>}
        </FormItem>
      )}
    />
  );
};

/**
 * The form's fields that hold a list of tags. `| undefined` is part of the
 * value type because the schemas mark `tags` optional.
 */
type TagListPath<T extends FieldValues> = FieldPathByValue<
  T,
  string[] | undefined
>;

interface FormTagPickerProps<T extends FieldValues> {
  options: string[];
  label: string;
  /** Restricted to the form's fields that actually hold a list of tags. */
  name: TagListPath<T>;
  formControl: Control<T>;
  shouldUnregister?: boolean;
  description?: string;
}

/**
 * Thin generic wrapper so callers get field-name and value checking against
 * their own schema. The single cast is the boundary between the caller's form
 * type and the concrete `string[]` shape the picker implements.
 */
const FormTagPicker = <T extends FieldValues>({
  formControl,
  name,
  ...rest
}: FormTagPickerProps<T>) => (
  <TagPickerField
    {...rest}
    name={name}
    formControl={formControl as unknown as Control<TagFieldValues>}
  />
);

export default FormTagPicker;
