import { Section, SlideList } from '@bluedot/ui';
import { trpc } from '../../utils/trpc';

const TeamSection = () => {
  const { data: teamMembers, isLoading, error } = trpc.teamMembers.getAll.useQuery();

  if (error) {
    return (
      <Section title="Our team" className="team-section !border-b-0">
        <p className="text-red-600">Failed to load team members.</p>
      </Section>
    );
  }

  if (isLoading || !teamMembers) {
    return (
      <Section title="Our team" className="team-section !border-b-0">
        <p>Loading...</p>
      </Section>
    );
  }

  return (
    <Section title="Our team" className="team-section !border-b-0">
      <SlideList
        maxItemsPerSlide={4}
        maxRows={3}
        className="team-section__team"
      >
        {teamMembers.map((member) => (
          <div key={member.name} className="team-section__card">
            <div className="card flex items-start flex-col transition-transform duration-200">
              <div className="card__image-container w-full">
                {member.url ? (
                  <a
                    href={member.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block cursor-pointer hover:opacity-90 transition-opacity duration-200"
                  >
                    <img
                      className="team-section__card-image size-[300px] object-cover"
                      src={member.imageUrl}
                      alt={`${member.name} - ${member.jobTitle}`}
                    />
                  </a>
                ) : (
                  <img
                    className="team-section__card-image size-[300px] object-cover"
                    src={member.imageUrl}
                    alt={`${member.name} - ${member.jobTitle}`}
                  />
                )}
              </div>
              <div className="card__content w-full p-4">
                <h3 className="card__title font-bold text-size-lg mb-1">{member.name}</h3>
                <p className="card__subtitle text-gray-600">{member.jobTitle}</p>
              </div>
            </div>
          </div>
        ))}
      </SlideList>
    </Section>
  );
};

export default TeamSection;
