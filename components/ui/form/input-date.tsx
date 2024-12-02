import React from "react";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input, Label } from "@fluentui/react-components";

interface InputDateProps {
  name: string;
  label: string;
  formControl: any;
  className?: string;
}

export const InputDate: React.FC<InputDateProps> = ({
  name,
  label,
  formControl,
  className,
}) => {
  return (
    <FormField
      control={formControl}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <Label size="medium">{label}</Label>
          <Input
            type="datetime-local"
            {...field}
            value={field.value || ''}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}; 