import {
  A, Avatar, H2, P,
} from '@bluedot/ui';
import { trpc } from '../../utils/trpc';

const TEAM_NAMES = ['Joshua Landes', 'Harry Waterman'];

const SpecialProjectsTeam = () => {
  const { data: teamMembers } = trpc.teamMembers.getAll.useQuery();
  const members = TEAM_NAMES.flatMap((name) => {
    const member = teamMembers?.find((person) => person.name === name);
    return member ? [{ ...member, name }] : [];
  });

  if (!members.length) return null;

  return (
    <section aria-label="Special Projects team" className="flex flex-col gap-6 border-t border-subtle pt-8">
      <H2 className="text-size-md">The team</H2>
      <ul className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        {members.map((member) => (
          <li key={member.name} className="flex flex-1 items-center gap-3">
            <Avatar name={member.name} imageSrc={member.imageUrl} size="medium" />
            <div className="flex flex-col gap-1">
              <P className="text-size-sm">
                {member.url ? <A href={member.url} className="inline-flex min-h-11 items-center">{member.name}</A> : member.name}
              </P>
              <P className="text-size-xs text-secondary">{member.jobTitle}</P>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default SpecialProjectsTeam;
