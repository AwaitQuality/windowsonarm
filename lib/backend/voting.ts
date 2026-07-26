import type { PrismaClient } from "@/lib/generated/prisma/client";
import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { COMMUNITY_VOTE_THRESHOLD } from "@/lib/schemas/post";

export interface VoteTally {
  status_id: number;
  count: number;
}

interface PostForRecompute {
  user_id: string | null;
  status_id: number;
  status_hint: number | null;
}

interface VoteRow {
  user_id: string;
  status_id: number;
}

/**
 * The submitter's initial `status_hint` stands in as their vote until they cast
 * an explicit one. Returns the status it counts towards, or null when there is
 * no implicit vote.
 *
 * This is the single definition of that rule: the tally and the
 * `submitterImplicitVote` flag the API reports must never disagree about it.
 */
export const submitterImplicitVote = (
  post: { user_id: string | null; status_hint: number | null },
  votes: VoteRow[]
): number | null => {
  if (post.status_hint == null || !post.user_id) return null;
  return votes.some((v) => v.user_id === post.user_id) ? null : post.status_hint;
};

export const submitterHasImplicitVote = (
  post: { user_id: string | null; status_hint: number | null },
  votes: VoteRow[]
): boolean => submitterImplicitVote(post, votes) !== null;

export const tallyVotes = (
  votes: VoteRow[],
  submitterId: string | null,
  statusHint: number | null
): VoteTally[] => {
  const counts = new Map<number, number>();

  for (const vote of votes) {
    counts.set(vote.status_id, (counts.get(vote.status_id) ?? 0) + 1);
  }

  const implicit = submitterImplicitVote(
    { user_id: submitterId, status_hint: statusHint },
    votes
  );
  if (implicit !== null) {
    counts.set(implicit, (counts.get(implicit) ?? 0) + 1);
  }

  // status_id breaks ties. Sorting on count alone leaves equal-count tallies in
  // Map insertion order, i.e. whatever order D1 happened to return the vote
  // rows in, which let the effective status flip between recomputes with no new
  // votes cast.
  return Array.from(counts.entries())
    .map(([status_id, count]) => ({ status_id, count }))
    .sort((a, b) => b.count - a.count || a.status_id - b.status_id);
};

export interface EffectiveStatusResult {
  effective_status_id: number;
  community_voted: boolean;
  winning?: VoteTally;
}

export const computeEffectiveStatus = (
  post: PostForRecompute,
  votes: VoteRow[]
): EffectiveStatusResult => {
  const tallies = tallyVotes(votes, post.user_id, post.status_hint);
  const [leader, runnerUp] = tallies;

  // Overriding the admin-set status takes the threshold *and* a strict
  // plurality. A tied leader is not a community decision, and honouring one
  // would make the outcome depend on which side of the tie sorted first.
  const decided =
    leader !== undefined &&
    leader.count >= COMMUNITY_VOTE_THRESHOLD &&
    (runnerUp === undefined || leader.count > runnerUp.count);

  if (decided && leader.status_id !== post.status_id) {
    return {
      effective_status_id: leader.status_id,
      community_voted: true,
      winning: leader,
    };
  }

  // No qualifying community vote, or the community agrees with the admin.
  // Pending posts stay pending, which keeps them out of the public listing.
  return { effective_status_id: post.status_id, community_voted: false };
};

/**
 * Recomputes and persists a post's effective status.
 *
 * Returns null when the post no longer exists, so a caller can tell that apart
 * from a real result instead of being handed a fabricated one.
 */
export const recomputeEffectiveStatus = async (
  prisma: PrismaClient,
  postId: string
): Promise<EffectiveStatusResult | null> => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      user_id: true,
      status_id: true,
      status_hint: true,
      status_votes: { select: { user_id: true, status_id: true } },
    },
  });

  if (!post) {
    return null;
  }

  const result = computeEffectiveStatus(post, post.status_votes);

  await prisma.post.update({
    where: { id: postId },
    data: {
      effective_status_id: result.effective_status_id,
      community_voted: result.community_voted,
    },
  });

  return result;
};


export interface VoteStatusResponse {
  votes: VoteTally[];
  userVote: number | null;
  /** True when the submitter's status_hint is still standing in as their vote. */
  submitterImplicitVote: boolean;
  effective_status_id: number | null;
  community_voted: boolean;
}

/**
 * The vote summary for one post, from the caller's point of view.
 *
 * Shared by /api/v1/posts/[id]/vote-status and the app page, which prefetches it
 * during the server render instead of leaving the browser to request it on
 * mount. Not cached: `userVote` makes the result per-user.
 */
export const getVoteSummary = async (
  postId: string,
  userId: string | null,
  client?: PrismaClient
): Promise<VoteStatusResponse | null> => {
  const prisma =
    client ??
    getPrisma((await getCloudflareContext({ async: true })).env.DB);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      user_id: true,
      status_hint: true,
      effective_status_id: true,
      community_voted: true,
      status_votes: { select: { user_id: true, status_id: true } },
    },
  });

  if (!post) return null;

  return {
    votes: tallyVotes(post.status_votes, post.user_id, post.status_hint),
    userVote:
      post.status_votes.find((vote) => vote.user_id === userId)?.status_id ??
      null,
    submitterImplicitVote: submitterHasImplicitVote(post, post.status_votes),
    effective_status_id: post.effective_status_id,
    community_voted: post.community_voted,
  };
};
