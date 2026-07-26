/**
 * The subset of a Clerk user the API attaches to post, review and blog
 * payloads. Both fields are optional because the Clerk lookup can fail or the
 * user can have no username set.
 */
export interface ClerkUserSummary {
  username?: string;
  imageUrl?: string;
}
