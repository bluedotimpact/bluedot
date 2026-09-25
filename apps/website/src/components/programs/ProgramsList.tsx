import { addQueryParam, ErrorSection, ProgressDots } from '@bluedot/ui';
import OpportunityCard from '../OpportunityCard';
import { trpc } from '../../utils/trpc';
import { AI_SECURITY_BOOTCAMP } from '../../lib/publicPrograms';

type ProgramsListProps = {
  utmCampaign?: string;
};

export const ProgramsList = ({ utmCampaign }: ProgramsListProps) => {
  const { data: programs, isLoading, error } = trpc.programs.getInPerson.useQuery();

  if (error) return <ErrorSection error={error} />;
  if (isLoading) return <ProgressDots />;
  if (!programs) return null;

  const appendUtmCampaign = (base: string) => (utmCampaign
    ? addQueryParam(addQueryParam(base, 'utm_source', 'website'), 'utm_campaign', utmCampaign)
    : base);

  return (
    <ul className="grid list-none gap-5 bd-md:grid-cols-2 lg:gap-6">
      {programs.map((program) => {
        const href = program.slug ? `/programs/${program.slug}` : program.applicationForm;
        if (!href) return null;
        const external = /^https?:\/\//.test(href);

        return (
          <li key={program.id} className="min-w-0">
            <OpportunityCard
              href={appendUtmCampaign(href)}
              title={program.name}
              description={program.description}
              tone="programs"
              ctaLabel={external ? 'Visit program website' : 'Explore program'}
              external={external}
            />
          </li>
        );
      })}
      <li className="min-w-0">
        <OpportunityCard
          href={appendUtmCampaign(AI_SECURITY_BOOTCAMP.url)}
          title={AI_SECURITY_BOOTCAMP.title}
          description={AI_SECURITY_BOOTCAMP.description}
          tone="securityBootcamp"
          ctaLabel="Visit program website"
          external
        />
      </li>
    </ul>
  );
};
