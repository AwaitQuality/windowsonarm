import {
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import React from "react";
import { Label, Select } from "@fluentui/react-components";
import type { FieldValues } from "react-hook-form";
import type { FormFieldBaseProps } from "@/components/ui/form/input";

interface SelectFieldProps<T extends FieldValues> extends FormFieldBaseProps<T> {
  placeholder?: string;
  onValueChange?: (e: string) => void;
  children: React.ReactNode;
}

const SelectField = <T extends FieldValues>(props: SelectFieldProps<T>) => (
  <FormField
    control={props.formControl}
    name={props.name}
    shouldUnregister={props.shouldUnregister}
    render={({ field }) => (
      <FormItem>
        <Label size={"medium"}>{props.label}</Label>
        <Select required onChange={field.onChange} defaultValue={field.value}>
          {props.children}
        </Select>
        {props.description && (
          <FormDescription>{props.description}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    )}
  />
);

export default SelectField;
