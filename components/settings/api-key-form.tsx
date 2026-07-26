"use client";

import React, { useId, useMemo, useState } from "react";
import {
  Body1Strong,
  Button,
  Caption1,
  Checkbox,
  Field,
  Input,
  Radio,
  RadioGroup,
  Spinner,
  Switch,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  LEAF_SCOPES,
  SCOPE_DESCRIPTIONS,
  type ApiScope,
  type CreateApiKeyInput,
  type LeafScope,
} from "@/lib/schemas/api-key";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  scopeGroups: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  group: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  // The leaves sit indented under their resource so the grouping is legible
  // without a second border; "Full access" leads the list rather than floating
  // opposite the heading, where it read as unrelated to the checkboxes below it.
  leaves: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    paddingInlineStart: tokens.spacingHorizontalS,
  },
  hint: {
    color: tokens.colorNeutralForeground3,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: tokens.spacingHorizontalS,
  },
});

/** Preset expiries, in days. `null` is the deliberate "never" choice. */
const EXPIRY_PRESETS: { value: string; label: string; days: number | null }[] = [
  { value: "30", label: "30 days", days: 30 },
  { value: "90", label: "90 days", days: 90 },
  { value: "365", label: "1 year", days: 365 },
  { value: "never", label: "No expiry", days: null },
];

/** Resource groups, derived from the scope list so the two cannot drift apart. */
const RESOURCES: string[] = Array.from(
  new Set(LEAF_SCOPES.map((scope) => scope.slice(0, scope.indexOf(":"))))
);

const leavesFor = (resource: string): LeafScope[] =>
  LEAF_SCOPES.filter((scope) => scope.startsWith(`${resource}:`));

const RESOURCE_LABELS: Record<string, string> = {
  posts: "Apps",
  blog: "Blog",
  reviews: "Reviews",
  taxonomy: "Categories, statuses & tags",
  keys: "API keys",
};

interface ApiKeyFormProps {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateApiKeyInput) => void;
}

const ApiKeyForm = ({ isSubmitting, onCancel, onSubmit }: ApiKeyFormProps) => {
  const styles = useStyles();
  const nameId = useId();

  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("90");
  const [selected, setSelected] = useState<Set<ApiScope>>(new Set());
  const [grantEverything, setGrantEverything] = useState(false);

  const toggle = (scope: ApiScope, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(scope);
        // Selecting "full access" for a resource makes its leaves redundant;
        // keeping both would store a set that says the same thing twice.
        if (scope.endsWith(":*")) {
          const resource = scope.slice(0, scope.indexOf(":"));
          leavesFor(resource).forEach((leaf) => next.delete(leaf));
        }
      } else {
        next.delete(scope);
      }

      return next;
    });
  };

  const scopes: ApiScope[] = useMemo(
    () => (grantEverything ? ["admin:*"] : Array.from(selected)),
    [grantEverything, selected]
  );

  const canSubmit = name.trim().length > 0 && scopes.length > 0 && !isSubmitting;

  const submit = () => {
    if (!canSubmit) return;

    const preset = EXPIRY_PRESETS.find((option) => option.value === expiry);
    const expiresAt =
      preset?.days == null
        ? null
        : new Date(Date.now() + preset.days * 86_400_000).toISOString();

    onSubmit({ name: name.trim(), scopes, expires_at: expiresAt });
  };

  return (
    <div className={styles.root}>
      <Field label="Name" hint="Name it after where it runs, so you know what breaks when you revoke it.">
        <Input
          id={nameId}
          value={name}
          onChange={(_event, data) => setName(data.value)}
          placeholder="Release pipeline"
          maxLength={80}
        />
      </Field>

      <Field label="Expires">
        <RadioGroup
          layout="horizontal"
          value={expiry}
          onChange={(_event, data) => setExpiry(data.value)}
        >
          {EXPIRY_PRESETS.map((option) => (
            <Radio
              key={option.value}
              value={option.value}
              label={option.label}
            />
          ))}
        </RadioGroup>
      </Field>

      <Field
        label="Permissions"
        hint="Grant only what this key needs. You can narrow it later, but a leaked key can do everything you gave it."
      >
        <Switch
          checked={grantEverything}
          onChange={(_event, data) => setGrantEverything(data.checked)}
          label="Full access, including capabilities added in future"
        />
      </Field>

      {!grantEverything && (
        <div className={styles.scopeGroups}>
          {RESOURCES.map((resource) => {
            const wildcard = `${resource}:*` as ApiScope;
            const wildcardChecked = selected.has(wildcard);

            return (
              <div key={resource} className={styles.group}>
                <Body1Strong>
                  {RESOURCE_LABELS[resource] ?? resource}
                </Body1Strong>
                <div className={styles.leaves}>
                  <Checkbox
                    label="Full access"
                    checked={wildcardChecked}
                    onChange={(_event, data) =>
                      toggle(wildcard, data.checked === true)
                    }
                  />
                  {leavesFor(resource).map((leaf) => (
                    <Checkbox
                      key={leaf}
                      label={SCOPE_DESCRIPTIONS[leaf]}
                      disabled={wildcardChecked}
                      checked={wildcardChecked || selected.has(leaf)}
                      onChange={(_event, data) =>
                        toggle(leaf, data.checked === true)
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {scopes.length === 0 && (
        <Caption1 className={styles.hint}>
          Choose at least one permission to create the key.
        </Caption1>
      )}

      <div className={styles.actions}>
        <Button appearance="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button appearance="primary" onClick={submit} disabled={!canSubmit}>
          {isSubmitting ? <Spinner size="tiny" /> : "Create key"}
        </Button>
      </div>
    </div>
  );
};

export default ApiKeyForm;
