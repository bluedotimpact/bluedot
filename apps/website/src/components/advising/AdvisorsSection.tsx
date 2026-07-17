import { H3, H4 } from '@bluedot/ui';
import { trpc } from '../../utils/trpc';

const AdvisorsSection = () => {
  const { data: advisors, isLoading, error } = trpc.teamMembers.getOneOnOneAdvisors.useQuery();

  if (error) {
    return (
      <section className="section section-body advising-advisors-section">
        <H3>Advisors</H3>
        <p className="text-red-600">Failed to load advisors.</p>
      </section>
    );
  }

  if (isLoading || !advisors) {
    return (
      <section className="section section-body advising-advisors-section">
        <H3>Advisors</H3>
        <p>Loading...</p>
      </section>
    );
  }

  if (advisors.length === 0) {
    return null;
  }

  return (
    <section className="section section-body advising-advisors-section">
      <div className="w-full flex flex-col gap-6">
        <H3>Advisors</H3>

        <ul className="list-none grid gap-8 grid-cols-1 bd-md:grid-cols-2 min-[1120px]:grid-cols-3">
          {advisors.map((advisor) => {
            const card = (
              <div className="flex flex-col gap-3">
                <img
                  src={advisor.imageUrl}
                  alt={`${advisor.name}${advisor.jobTitle ? ` - ${advisor.jobTitle}` : ''}`}
                  className="aspect-square w-full rounded-lg object-cover"
                  loading="lazy"
                />
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <H4 className="text-size-sm">
                      {advisor.name}
                    </H4>
                    {advisor.jobTitle && (
                      <p className="text-size-xs leading-normal text-bluedot-navy/68">
                        {advisor.jobTitle}
                      </p>
                    )}
                  </div>
                  {advisor.advisorProfileDescription && (
                    <p className="text-size-xs leading-[1.5] text-bluedot-navy/80">
                      {advisor.advisorProfileDescription}
                    </p>
                  )}
                </div>
              </div>
            );

            return (
              <li key={advisor.name}>
                {advisor.url ? (
                  <a
                    href={advisor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:opacity-90 transition-opacity duration-200"
                  >
                    {card}
                  </a>
                ) : (
                  card
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default AdvisorsSection;
