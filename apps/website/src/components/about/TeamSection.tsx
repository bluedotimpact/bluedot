import { H3, H4 } from '@bluedot/ui';
import { trpc } from '../../utils/trpc';

const TeamSectionShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <section aria-label="Our team" className="section section-body !border-b-0">
      <H3 className="mb-6">Our team</H3>
      {children}
    </section>
  );
};

const TeamSection = () => {
  const { data: teamMembers, isLoading, error } = trpc.teamMembers.getAll.useQuery();

  if (error) {
    return (
      <TeamSectionShell>
        <p className="text-red-600">Failed to load team members.</p>
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

  return (
    <TeamSectionShell>
      <ul
        aria-label="Team members"
        className="grid grid-cols-1 gap-x-space-between gap-y-spacing-y min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
      >
        {teamMembers.map((member) => (
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
              <div className="w-full p-4">
                <H4 className="text-size-lg mb-1">{member.name}</H4>
                <p className="text-gray-600">{member.jobTitle}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </TeamSectionShell>
  );
};

export default TeamSection;
