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

interface _TagPickerProps {
  options: string[];
  label: string;
  name: string;
  formControl: any;
  shouldUnregister?: boolean;
  description?: string;
}

const FormTagPicker = ({
  options,
  label,
  name,
  formControl,
  shouldUnregister,
  description,
}: _TagPickerProps) => {
  const [tagPickerOptions, setTagPickerOptions] = useState<string[]>(options);
  const [inputValue, setInputValue] = useState<string>("");

  const addOption = (option: string) => {
    setTagPickerOptions((prev) => [...prev, option]);
  };

  return (
    <Controller
      name={name}
      control={formControl}
      render={({ field: { onChange, value } }) => (
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
                  value.map((option: string) => (
                    <Tag key={option} shape="rounded" value={option}>
                      {option}
                    </Tag>
                  ))}
              </TagPickerGroup>
              <TagPickerInput
                aria-label="Select Employees"
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
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormTagPicker;
