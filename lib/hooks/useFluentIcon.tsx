import {
  ArrowTrendingLinesFilled,
  BugRegular,
  CheckmarkRegular,
  CodeRegular,
  CommunicationFilled,
  DismissRegular,
  GamesRegular,
  InfoRegular,
  OpenRegular,
  PeopleRegular,
  QuestionFilled,
  SubtractSquareRegular,
  TvRegular,
} from "@fluentui/react-icons";
// Aliased: `FluentIcon` below is this module's own component.
import type { FluentIcon as FluentIconComponent } from "@fluentui/react-icons";

/**
 * Statuses and categories store an icon by name, so the lookup has to be
 * dynamic. Resolving it against the whole `@fluentui/react-icons` namespace
 * defeats tree-shaking entirely (the bundler has to keep every export of a
 * 66 MB package), so only the names actually present in the database are
 * imported. Anything unrecognised falls back to `InfoRegular`.
 *
 * Adding a new icon to `Status.icon` or `Category.icon` means adding it here
 * too. Current contents:
 *   SELECT DISTINCT icon FROM Status;
 *   SELECT DISTINCT icon FROM Category;
 */
const ICONS: Record<string, FluentIconComponent> = {
  // Status
  BugRegular,
  CheckmarkRegular,
  DismissRegular,
  OpenRegular,
  SubtractSquareRegular,
  // Category
  ArrowTrendingLinesFilled,
  CodeRegular,
  CommunicationFilled,
  GamesRegular,
  PeopleRegular,
  QuestionFilled,
  TvRegular,
  // Fallback, also usable by name
  InfoRegular,
};

export const getFluentIcon = (name: string | null | undefined): FluentIconComponent => {
  if (!name) return InfoRegular;
  return ICONS[name] ?? InfoRegular;
};

interface FluentIconProps {
  /** `Status.icon` / `Category.icon` value from the database. */
  name: string | null | undefined;
  className?: string;
}

/**
 * Renders a database-named icon.
 *
 * Prefer this over calling `getFluentIcon` in a component body: assigning the
 * looked-up component to a local and rendering it reads as creating a component
 * during render, which React's lint rules reject.
 */
export const FluentIcon = ({ name, className }: FluentIconProps) => {
  const Icon = ICONS[name ?? ""] ?? InfoRegular;
  return <Icon className={className} />;
};
