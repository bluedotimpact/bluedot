import { ErrorSection, ProgressDots } from '@bluedot/ui';
import { PageListGroup, PageListRow } from '../PageListRow';
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

  const buildHref = (program: { slug: string | null; applicationForm: string | null }) => {
    const base = program.slug ? `/programs/${program.slug}` : (program.applicationForm ?? '#');
    if (!utmCampaign || base === '#') return base;
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}utm_source=website&utm_campaign=${utmCampaign}`;
  };

  return (
    <PageListGroup>
      {programs.map((program) => (
        <PageListRow
          key={program.id}
          href={buildHref(program)}
          title={program.name}
          summary={program.description}
          ctaLabel="Explore program"
        />
      ))}
      <PageListRow
        key={AI_SECURITY_BOOTCAMP.url}
        href={AI_SECURITY_BOOTCAMP.url}
        title={AI_SECURITY_BOOTCAMP.title}
        summary={AI_SECURITY_BOOTCAMP.description}
        ctaLabel="Visit program website"
        external
      />
    </PageListGroup>
  );
};
