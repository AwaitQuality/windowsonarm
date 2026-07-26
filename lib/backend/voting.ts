import type { PrismaClient } from "@prisma/client";

/** Status id used for posts that have not been reviewed by an admin yet. */
export const PENDING_STATUS_ID = -1;

/** Number of votes a single status needs before the community decides it. */
export const COMMUNITY_VOTE_THRESHOLD = 2;

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

export const tallyVotes = (
  votes: VoteRow[],
  submitterId: string | null,
  statusHint: number | null
): VoteTally[] => {
  const counts = new Map<number, number>();

  for (const vote of votes) {
    counts.set(vote.status_id, (counts.get(vote.status_id) ?? 0) + 1);
  }

  // The submitter's initial status_hint counts as their implicit vote, unless
  // they have since cast an explicit one.
  if (statusHint != null && submitterId) {
    const hasExplicitVote = votes.some((v) => v.user_id === submitterId);
    if (!hasExplicitVote) {
      counts.set(statusHint, (counts.get(statusHint) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([status_id, count]) => ({ status_id, count }))
    .sort((a, b) => b.count - a.count);
};

export const submitterHasImplicitVote = (
  post: { user_id: string | null; status_hint: number | null },
  votes: VoteRow[]
): boolean => {
  if (post.status_hint == null || !post.user_id) return false;
  return !votes.some((v) => v.user_id === post.user_id);
};

export interface EffectiveStatusResult {
  effective_status_id: number | null;
  community_voted: boolean;
  winning?: VoteTally;
}

export const computeEffectiveStatus = (
  post: PostForRecompute,
  votes: VoteRow[]
): EffectiveStatusResult => {
  const tallies = tallyVotes(votes, post.user_id, post.status_hint);
  const winning = tallies.find((t) => t.count >= COMMUNITY_VOTE_THRESHOLD);

  // A community-decided status wins when it disagrees with the stored status.
  if (winning && winning.status_id !== post.status_id) {
    return {
      effective_status_id: winning.status_id,
      community_voted: true,
      winning,
    };
  }

  // No qualifying community vote, or the community agrees with the admin.
  // Pending posts stay pending, which keeps them out of the public listing.
  return { effective_status_id: post.status_id, community_voted: false };
};

export const recomputeEffectiveStatus = async (
  prisma: PrismaClient,
  postId: string
): Promise<EffectiveStatusResult> => {
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
    return { effective_status_id: null, community_voted: false };
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
