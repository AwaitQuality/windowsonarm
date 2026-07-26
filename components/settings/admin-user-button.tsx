"use client";

import React from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { KeyMultipleRegular } from "@fluentui/react-icons";
import ApiKeysPanel from "@/components/settings/api-keys-panel";

const ADMIN_ROLE = "admin";

/**
 * The account menu, with an "API keys" page added to the profile modal for
 * admins.
 *
 * Two separate returns rather than a conditional child: Clerk walks
 * `UserButton`'s children looking for its own component types, so feeding it a
 * `false` where a `<UserButton.UserProfilePage>` is expected is not worth
 * relying on.
 *
 * The role is read from public metadata, which is client-visible — this only
 * decides whether the tab is rendered. Every endpoint behind it re-checks the
 * role server-side, so a user who forges the flag still gets 403s.
 */
const AdminUserButton = () => {
  const { user } = useUser();

  if (user?.publicMetadata?.role !== ADMIN_ROLE) {
    return <UserButton />;
  }

  return (
    <UserButton>
      <UserButton.UserProfilePage
        label="API keys"
        url="api-keys"
        labelIcon={<KeyMultipleRegular />}
      >
        <ApiKeysPanel />
      </UserButton.UserProfilePage>
    </UserButton>
  );
};

export default AdminUserButton;
