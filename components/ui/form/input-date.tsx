import React from "react";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input, Label } from "@fluentui/react-components";
import type { FieldValues } from "react-hook-form";
import type { FormFieldBaseProps } from "@/components/ui/form/input";

type InputDateProps<T extends FieldValues> = Pick<
  FormFieldBaseProps<T>,
  "name" | "label" | "formControl" | "className"
>;

export const InputDate = <T extends FieldValues>({
  name,
  label,
  formControl,
  className,
}: InputDateProps<T>) => {
  return (
    <FormField
      control={formControl}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <Label size="medium">{label}</Label>
          <Input type="datetime-local" {...field} value={field.value ?? ""} />
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
