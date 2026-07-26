import React from "react";

const read = (name: string): string | null => {
  try {
    return localStorage.getItem(name);
  } catch {
    return null;
  }
};

const write = (name: string, value: string): void => {
  try {
    localStorage.setItem(name, value);
  } catch {
    // Private browsing or a full quota: the value simply does not persist.
  }
};

/**
 * State mirrored into `localStorage` under `name`.
 *
 * The storage is untransformed: the value is written with `localStorage.setItem`
 * and read back verbatim, so only `string` round-trips losslessly. Callers
 * currently store `"true"` / `"false"`.
 *
 * The value is deliberately `null` until after mount. Reading `localStorage`
 * during render would make the client's first render disagree with the server's
 * HTML, so callers get `null` for one render and must handle it.
 */
const usePersistedState = <T>(
  name: string,
  defaultValue: T
): [T | null, React.Dispatch<React.SetStateAction<T | null>>] => {
  const [value, setValue] = React.useState<T | null>(null);
  const nameRef = React.useRef(name);

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps --
     Setting state from this effect is intentional: storage can only be read
     after mount, otherwise the hydration render would not match the server
     HTML. It runs once, so the value is never re-derived from a dependency. */
  React.useEffect(() => {
    const stored = read(name);

    if (stored !== null) {
      // localStorage is an untyped string boundary — there is nothing to
      // validate against, so the stored string is trusted as T.
      setValue(stored as T);
      return;
    }

    write(name, String(defaultValue));
    setValue(defaultValue);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  React.useEffect(() => {
    if (value !== null) write(nameRef.current, String(value));
  }, [value]);

  React.useEffect(() => {
    const lastName = nameRef.current;
    if (name === lastName) return;

    if (value !== null) write(name, String(value));
    nameRef.current = name;
    try {
      localStorage.removeItem(lastName);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
    // Keyed on the storage name changing, not on the value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  return [value, setValue];
};

export { usePersistedState };
