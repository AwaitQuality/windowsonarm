import * as FluentIcons from "@fluentui/react-icons";
import type { FluentIcon } from "@fluentui/react-icons";

type IconMap = Record<string, FluentIcon>;

export const getFluentIcon = (name: string | null | undefined): FluentIcon => {
  if (!name) return FluentIcons.InfoRegular;
  const icon = (FluentIcons as unknown as IconMap)[name];
  return icon ?? FluentIcons.InfoRegular;
};
