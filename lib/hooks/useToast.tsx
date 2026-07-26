import React from "react";
import {
  Toast,
  ToastBody,
  ToastIntent,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";

const TOASTER_ID = "toaster";

export const useToast = () => {
  const { dispatchToast } = useToastController(TOASTER_ID);

  const notify = React.useCallback(
    (title: string, subtitle?: string, intent: ToastIntent = "success") => {
      dispatchToast(
        <Toast>
          <ToastTitle>{title}</ToastTitle>
          {subtitle && <ToastBody>{subtitle}</ToastBody>}
        </Toast>,
        { intent },
      );
    },
    [dispatchToast],
  );

  return { notify };
};
