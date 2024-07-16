import {
  Tag,
  TagPicker as FluentTagPicker,
  TagPickerControl,
  TagPickerGroup,
  TagPickerInput,
  TagPickerList,
  TagPickerOption,
  TagPickerProps,
} from "@fluentui/react-components";
import React from "react";

interface _TagPickerProps {
  options: string[];
}

const TagPicker = ({ options }: _TagPickerProps) => {
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>([]);

  const [tagPickerOptions, setTagPickerOptions] =
    React.useState<string[]>(options);

  const addOption = (option: string) => {
    setTagPickerOptions([...tagPickerOptions, option]);
  };

  const onOptionSelect: TagPickerProps["onOptionSelect"] = (e, data) => {
    setSelectedOptions(data.selectedOptions);
  };

  const filteredOptions = tagPickerOptions.filter(
    (option) => !selectedOptions.includes(option),
  );

  return (
    <FluentTagPicker
      onOptionSelect={onOptionSelect}
      selectedOptions={selectedOptions}
    >
      <TagPickerControl>
        <TagPickerGroup>
          {selectedOptions.map((option) => (
            <Tag key={option} shape="rounded" value={option}>
              {option}
            </Tag>
          ))}
        </TagPickerGroup>
        <TagPickerInput
          aria-label="Select Employees"
          name={"tags"}
          onChange={(e) => {
            const value = e.target.value;

            if (value.includes(",")) {
              const newOption = value.replace(",", "");
              addOption(newOption);
              setSelectedOptions([...selectedOptions, newOption]);
              e.target.value = "";
            }
          }}
        />
      </TagPickerControl>
      <TagPickerList>
        {filteredOptions.length > 0
          ? tagPickerOptions.map((option) => (
              <TagPickerOption value={option} key={option}>
                {option}
              </TagPickerOption>
            ))
          : "No options available"}
      </TagPickerList>
    </FluentTagPicker>
  );
};

export default TagPicker;
