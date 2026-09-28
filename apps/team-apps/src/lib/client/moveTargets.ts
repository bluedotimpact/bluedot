type NamedRound = { id: string; name: string };

const variantOf = (name: string): string => /- (Part-time|Intensive)$/.exec(name)?.[1] ?? 'other';

// Reviewers move applications to an upcoming round, but only the next few are
// realistic targets. A flat "next 3" can fill up with one schedule variant and
// make the other unreachable (e.g. two October variants plus a November
// intensive hide the next part-time round), so the soonest round of each
// variant is kept first, then the remaining slots go to the soonest rounds
// overall. Expects `rounds` sorted soonest-first, as /api/rounds returns them.
export const pickMoveTargets = <T extends NamedRound>(rounds: T[], limit = 3): T[] => {
  const pickedVariants = new Set<string>();
  const picked = new Set<T>();

  for (const round of rounds) {
    if (picked.size >= limit) break;
    const variant = variantOf(round.name);
    if (!pickedVariants.has(variant)) {
      pickedVariants.add(variant);
      picked.add(round);
    }
  }

  for (const round of rounds) {
    if (picked.size >= limit) break;
    picked.add(round);
  }

  return rounds.filter((round) => picked.has(round));
};
