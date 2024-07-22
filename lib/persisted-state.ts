import React from "react";

const usePersistedState = (name: string, defaultValue: any) => {
  const [value, setValue] = React.useState<any>(null);
  const nameRef = React.useRef(name);

  React.useEffect(() => {
    try {
      const storedValue = localStorage.getItem(name);
      if (storedValue !== null) {
        setValue(storedValue);
      } else {
        localStorage.setItem(name, defaultValue);
        setValue(defaultValue);
      }
    } catch {
      setValue(defaultValue);
    }
  }, []);

  React.useEffect(() => {
    if (value !== null) {
      try {
        localStorage.setItem(nameRef.current, value);
      } catch {}
    }
  }, [value]);

  React.useEffect(() => {
    const lastName = nameRef.current;
    if (name !== lastName) {
      try {
        localStorage.setItem(name, value);
        nameRef.current = name;
        localStorage.removeItem(lastName);
      } catch {}
    }
  }, [name]);

  return [value, setValue];
};

export { usePersistedState };
