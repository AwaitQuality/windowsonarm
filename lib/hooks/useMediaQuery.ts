import { useCallback, useSyncExternalStore } from "react";

const subscribeNothing = () => () => {};
const notMatched = () => false;

/**
 * Tracks a media query.
 *
 * Backed by `useSyncExternalStore` rather than state-plus-effect: the first
 * client render already has the correct value (no one-frame flash at the wrong
 * breakpoint) and no setState happens inside an effect. During SSR there is no
 * viewport to measure, so the snapshot is `false`.
 */
export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onStoreChange);
      return () => media.removeEventListener("change", onStoreChange);
    },
    [query]
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query]
  );

  const isBrowser = typeof window !== "undefined";

  return useSyncExternalStore(
    isBrowser ? subscribe : subscribeNothing,
    isBrowser ? getSnapshot : notMatched,
    notMatched
  );
};
