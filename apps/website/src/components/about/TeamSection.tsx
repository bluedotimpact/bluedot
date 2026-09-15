import { H3, H4 } from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../server/routers/_app';
import { trpc } from '../../utils/trpc';

type TeamMembers = inferRouterOutputs<AppRouter>['teamMembers']['getAll'];

const SUBTEAM_ORDER = [
  'Leadership',
  'Courses',
  'Talent Activation',
  'Special Projects',
  'Growth',
  'Grants',
  'Operations',
  'Hiring',
];

const FULL_WIDTH_SUBTEAMS = ['Leadership', 'Courses', 'Talent Activation'];

const TeamSection = () => {
  const { data: teamMembers, isLoading, error } = trpc.teamMembers.getAll.useQuery();

  if (error) {
    return (
      <TeamSectionShell>
        <p className="text-error-fg">Failed to load team members.</p>
      </TeamSectionShell>
    );
  }

  if (isLoading || !teamMembers) {
    return (
      <TeamSectionShell>
        <p>Loading...</p>
      </TeamSectionShell>
    );
  }

  const groups = new Map<string, TeamMembers>();
  for (const member of teamMembers) {
    const subteam = member.subteam ?? '';
    const members = groups.get(subteam) ?? [];
    members.push(member);
    groups.set(subteam, members);
  }

  const namedGroups = [...groups.keys()].filter(Boolean).sort((a, b) => {
    const aIndex = SUBTEAM_ORDER.indexOf(a);
    const bIndex = SUBTEAM_ORDER.indexOf(b);
    return (aIndex === -1 ? SUBTEAM_ORDER.length : aIndex)
      - (bIndex === -1 ? SUBTEAM_ORDER.length : bIndex) || a.localeCompare(b);
  });

  return (
    <TeamSectionShell>
      {namedGroups.length === 0 ? (
        <TeamMemberCards members={teamMembers} />
      ) : (
        <div className="grid grid-cols-1 gap-y-12 md:gap-y-16 lg:grid-cols-[21.5rem_minmax(0,1fr)] lg:gap-x-14">
          {namedGroups.map((subteam) => {
            const members = groups.get(subteam)!;
            const canShareRow = members.length <= 2 && !FULL_WIDTH_SUBTEAMS.includes(subteam);

            return (
              <section key={subteam} aria-label={subteam} className={canShareRow ? 'min-w-0' : 'min-w-0 lg:col-span-2'}>
                <H4 className="mb-6">{subteam}</H4>
                <TeamMemberCards members={members} subteam={subteam} />
              </section>
            );
          })}
          {groups.has('') && (
            <section aria-label="More of our team" className="min-w-0 lg:col-span-2">
              <H4 className="mb-6">More of our team</H4>
              <TeamMemberCards members={groups.get('')!} subteam="More of our team" />
            </section>
          )}
        </div>
      )}
    </TeamSectionShell>
  );
};

export default TeamSection;

const TeamSectionShell = ({ children }: React.PropsWithChildren) => {
  return (
    <section aria-label="Our team" className="section section-body !border-b-0">
      <H3 className="mb-6">Our team</H3>
      {children}
    </section>
  );
};

const TeamMemberCards = ({ members, subteam }: { members: TeamMembers; subteam?: string }) => {
  const NameHeading = subteam ? 'h5' : 'h4';

  return (
    <ul
      aria-label={subteam ? `${subteam} team members` : 'Team members'}
      className="grid grid-cols-2 gap-x-3 gap-y-7 min-[360px]:grid-cols-3 md:grid-cols-[repeat(auto-fill,10rem)] md:gap-6"
    >
      {members.map((member) => (
        <li key={member.name}>
          <div className="flex flex-col items-start transition-transform duration-200">
            <div className="w-full">
              {member.url ? (
                <a
                  href={member.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block cursor-pointer hover:opacity-90 transition-opacity duration-200"
                >
                  <img
                    className="aspect-square w-full object-cover"
                    src={member.imageUrl}
                    alt={`${member.name} - ${member.jobTitle}`}
                  />
                </a>
              ) : (
                <img
                  className="aspect-square w-full object-cover"
                  src={member.imageUrl}
                  alt={`${member.name} - ${member.jobTitle}`}
                />
              )}
            </div>
            <div className="w-full pt-2 text-left md:pt-3">
              <NameHeading className="bluedot-h4 not-prose text-size-xs mb-1 md:text-size-sm">{member.name}</NameHeading>
              <p className="text-size-xxs text-secondary md:text-size-xs">{member.jobTitle}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};
