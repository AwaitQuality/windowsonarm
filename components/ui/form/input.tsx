import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input, Label, Textarea } from "@fluentui/react-components";

interface InputFieldProps {
  name: string;
  description?: string;
  placeholder: string;
  label: string;
  required?: boolean;
  formControl: any;
  shouldUnregister?: boolean;
  disabled?: boolean;
  formItemClassName?: string;
  className?: string;
}

interface InputTextAreaProps extends InputFieldProps {
  rows?: number;
}

const InputField = (props: InputFieldProps) => (
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

export const InputTextArea = (props: InputTextAreaProps) => (
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
