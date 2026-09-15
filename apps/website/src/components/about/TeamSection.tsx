import { H3, H4, P } from '@bluedot/ui';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../server/routers/_app';
import { trpc } from '../../utils/trpc';

type TeamMembers = inferRouterOutputs<AppRouter>['teamMembers']['getAll'];

const SUBTEAMS: Record<string, string> = {
  Leadership: 'Setting BlueDot’s direction and building the organisation behind our mission.',
  Courses: 'Helping people build the knowledge and connections to contribute to AI safety and biosecurity.',
  'Talent Activation': 'Supporting exceptional people through programs and personal guidance into impactful work.',
  'Special Projects': 'Testing ambitious ideas, launching promising initiatives and finding people to take them forward.',
  Growth: 'Reaching people who could contribute to AI safety and biosecurity.',
  Grants: 'Removing financial barriers to career transitions and early projects.',
  Operations: 'Building the systems and support that help our people and programs succeed.',
  Hiring: 'Finding and recruiting the people BlueDot needs to deliver its mission.',
};

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

  const subteamOrder = Object.keys(SUBTEAMS);
  const namedGroups = [...groups.keys()].filter(Boolean).sort((a, b) => {
    const aIndex = subteamOrder.indexOf(a);
    const bIndex = subteamOrder.indexOf(b);
    return (aIndex === -1 ? subteamOrder.length : aIndex)
      - (bIndex === -1 ? subteamOrder.length : bIndex) || a.localeCompare(b);
  });

  return (
    <TeamSectionShell>
      {namedGroups.length === 0 ? (
        <TeamMemberCards members={teamMembers} />
      ) : (
        <div className="space-y-12 md:space-y-16">
          {namedGroups.map((subteam) => (
            <section key={subteam} aria-label={subteam}>
              <H4 className="mb-2">{subteam}</H4>
              {SUBTEAMS[subteam] && <P className="mb-6 max-w-prose text-secondary">{SUBTEAMS[subteam]}</P>}
              <TeamMemberCards members={groups.get(subteam)!} subteam={subteam} />
            </section>
          ))}
          {groups.has('') && (
            <section aria-label="More of our team">
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
      className="grid grid-cols-2 gap-x-3 gap-y-7 min-[360px]:grid-cols-3 md:gap-x-space-between md:gap-y-spacing-y xl:grid-cols-4"
    >
      {members.map((member) => (
        <li key={member.name}>
          <div className="flex flex-col items-center transition-transform duration-200 md:items-start">
            <div className="w-full">
              {member.url ? (
                <a
                  href={member.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block cursor-pointer hover:opacity-90 transition-opacity duration-200"
                >
                  <img
                    className="aspect-square w-full rounded-full object-cover md:rounded-none"
                    src={member.imageUrl}
                    alt={`${member.name} - ${member.jobTitle}`}
                  />
                </a>
              ) : (
                <img
                  className="aspect-square w-full rounded-full object-cover md:rounded-none"
                  src={member.imageUrl}
                  alt={`${member.name} - ${member.jobTitle}`}
                />
              )}
            </div>
            <div className="w-full pt-2 text-center md:p-4 md:text-left">
              <NameHeading className="bluedot-h4 not-prose text-size-xs mb-1 md:text-size-lg">{member.name}</NameHeading>
              <p className="text-size-xxs text-secondary md:text-size-sm">{member.jobTitle}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};
