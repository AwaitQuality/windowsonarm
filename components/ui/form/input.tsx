import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input, Label, Textarea } from "@fluentui/react-components";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

/**
 * Props shared by every field wrapper in this directory.
 *
 * Generic in the form's value type so `name` is checked against the schema and
 * `formControl` cannot be handed the control of a different form.
 */
export interface FormFieldBaseProps<T extends FieldValues> {
  name: FieldPath<T>;
  label: string;
  description?: string;
  formControl: Control<T>;
  shouldUnregister?: boolean;
  className?: string;
}

export interface InputFieldProps<T extends FieldValues>
  extends FormFieldBaseProps<T> {
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  formItemClassName?: string;
}

interface InputTextAreaProps<T extends FieldValues> extends InputFieldProps<T> {
  rows?: number;
}

const InputField = <T extends FieldValues>(props: InputFieldProps<T>) => (
  <FormField
    control={props.formControl}
    name={props.name}
    disabled={props.disabled}
    shouldUnregister={props.shouldUnregister}
    render={({ field }) => (
      <FormItem className={props.formItemClassName}>
        <div className={"flex flex-col gap-1"}>
          <Label size={"medium"}>{props.label}</Label>
          <FormControl>
            <Input
              placeholder={props.placeholder}
              className={props.className}
              {...field}
            />
          </FormControl>
        </div>
        {props.description && (
          <FormDescription>{props.description}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    )}
  />
);

export const InputTextArea = <T extends FieldValues>(
  props: InputTextAreaProps<T>,
) => (
  <FormField
    control={props.formControl}
    name={props.name}
    shouldUnregister={props.shouldUnregister}
    render={({ field }) => (
      <FormItem className={props.formItemClassName}>
        <div className={"flex flex-col gap-1"}>
          <Label size={"medium"}>{props.label}</Label>
          <FormControl>
            <Textarea
              placeholder={props.placeholder}
              rows={props.rows}
              className={props.className}
              {...field}
            />
          </FormControl>
        </div>
        {props.description && (
          <FormDescription>{props.description}</FormDescription>
        )}
        <FormMessage />
      </FormItem>
    )}
  />
);

export default InputField;
