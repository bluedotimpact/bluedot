import { trpc } from '../../utils/trpc';

/**
 * Renders "a team of N" (or "a <adjective> team of N"), where N is the number of Active rows
 * in the Team table. Use this instead of hard-coding the staff count in public copy.
 */
const TeamSize = ({ adjective }: { adjective?: string }) => {
  const team = adjective ? `${adjective} team` : 'team';
  const { data: count, isError } = trpc.teamMembers.getActiveCount.useQuery();

  if (isError) {
    return <>{adjective ? `a ${team}` : 'a small team'}</>;
  }

  if (count === undefined) {
    // Reserve roughly the right width while loading so the sentence doesn't jump
    return <span className="invisible">a {team} of 20</span>;
  }

  return <>a {team} of {count}</>;
};

export default TeamSize;
