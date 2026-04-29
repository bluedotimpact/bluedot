import { trpc } from '../../utils/trpc';
import { pageSectionHeadingClass } from '../PageListRow';

const AdvisorsSection = () => {
  const { data: advisors, isLoading, error } = trpc.teamMembers.getOneOnOneAdvisors.useQuery();

  if (error) {
    return (
      <section className="section section-body advising-advisors-section">
        <h3 className={pageSectionHeadingClass}>Advisors</h3>
        <p className="text-red-600">Failed to load advisors.</p>
      </section>
    );
  }

  if (isLoading || !advisors) {
    return (
      <section className="section section-body advising-advisors-section">
        <h3 className={pageSectionHeadingClass}>Advisors</h3>
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
        <h3 className={pageSectionHeadingClass}>Advisors</h3>

        <ul className="list-none grid gap-6 grid-cols-2 bd-md:grid-cols-3 lg:grid-cols-5">
          {advisors.map((advisor) => {
            const card = (
              <div className="flex flex-col gap-3">
                <img
                  src={advisor.imageUrl}
                  alt={`${advisor.name}${advisor.jobTitle ? ` - ${advisor.jobTitle}` : ''}`}
                  className="aspect-square w-full rounded-lg object-cover"
                  loading="lazy"
                />
                <div className="flex flex-col gap-1">
                  <h4 className="text-size-sm font-semibold leading-tight text-bluedot-navy">
                    {advisor.name}
                  </h4>
                  {advisor.jobTitle && (
                    <p className="text-size-xs leading-[1.4] text-bluedot-navy/68">
                      {advisor.jobTitle}
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
