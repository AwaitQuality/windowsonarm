import React from "react";
import { Form } from "@/components/ui/form";
import InputField, { InputTextArea } from "@/components/ui/form/input";
import SelectField from "@/components/ui/form/select";
import FormTagPicker from "@/components/ui/form/form-tag-picker";
import FileUploader from "@/components/ui/upload-button";
import {
  Button,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@fluentui/react-components";
import type { UseFormReturn } from "react-hook-form";
import { CreatePostInput, PENDING_STATUS_ID } from "@/lib/schemas/post";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";

interface ContributeFormProps {
  form: UseFormReturn<CreatePostInput>;
  info?: InfoResponse;
  onSubmit: (values: CreatePostInput) => void | Promise<void>;
  onError: (errors: unknown) => void;
  onFileSelect: (file: File | null) => void;
  submitDisabled: boolean;
}

const ContributeForm: React.FC<ContributeFormProps> = ({
  form,
  info,
  onSubmit,
  onError,
  onFileSelect,
  submitDisabled,
}) => (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit, onError)}>
      <DialogBody>
        <DialogTitle>Post application</DialogTitle>
        <DialogContent className={"flex gap-4 flex-col"}>
          <div className={"flex gap-4 w-full"}>
            <InputField
              placeholder={"Photoshop"}
              formControl={form.control}
              label={"App name"}
              name={"title"}
              formItemClassName={"w-full"}
            />
            <InputField
              placeholder={"Adobe"}
              formControl={form.control}
              label={"Company"}
              name={"company"}
              formItemClassName={"w-full"}
            />
          </div>
          <InputField
            placeholder={"https://example.com"}
            formControl={form.control}
            label={"App URL"}
            name={"app_url"}
          />
          <InputField
            placeholder={"https://example.com"}
            formControl={form.control}
            label={"Community URL"}
            name={"community_url"}
            description="URL to community-made ARM version or compatibility fix"
          />
          <InputField
            placeholder={"https://example.com/banner.png"}
            formControl={form.control}
            label={"Banner URL"}
            name={"banner_url"}
            disabled
            description="Banner URL is coming soon."
          />

          <FileUploader onFileSelect={onFileSelect} />

          {info && (
            <FormTagPicker
              formControl={form.control}
              label={"Tags"}
              name={"tags"}
              options={info.tags.map((tag) => tag.name)}
            />
          )}

          <SelectField
            formControl={form.control}
            label={"Category ID"}
            name={"categoryId"}
          >
            <option value={""}>Select a category</option>
            {info?.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>

          <SelectField
            formControl={form.control}
            label={"Status"}
            name={"status_hint"}
            description={
              "Select a status hint for the application. If you're not sure about the status, select 'Ask community to test'."
            }
          >
            <option value={""}>Select a status hint</option>
            <option key={PENDING_STATUS_ID} value={PENDING_STATUS_ID}>
              Ask community to test
            </option>
            {info?.status
              .filter((s) => s.id >= 0)
              .map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
          </SelectField>

          <InputTextArea
            placeholder={"Description"}
            formControl={form.control}
            rows={5}
            label={"Description"}
            name={"description"}
            description={
              "A brief description of the application. Markdown is supported. A rich MD editor is coming soon."
            }
          />
        </DialogContent>

        <DialogActions className={"mt-2"}>
          <DialogTrigger disableButtonEnhancement>
            <Button appearance="secondary">Close</Button>
          </DialogTrigger>
          <Button appearance="primary" type={"submit"} disabled={submitDisabled}>
            Post
          </Button>
        </DialogActions>
      </DialogBody>
    </form>
  </Form>
);

export default ContributeForm;
