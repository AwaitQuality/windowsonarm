import {
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import React from "react";
import { Label, Select } from "@fluentui/react-components";

interface InputFieldProps {
  name: string;
  description?: string;
  placeholder?: string;
  label: string;
  formControl: any;
  shouldUnregister?: boolean;
  onValueChange?: (e: string) => void;
  children: React.ReactNode;
}

const SelectField = (props: InputFieldProps) => (
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
