import { CTALinkOrButton } from '@bluedot/ui';
import { CAREER_TRANSITION_GRANT_APPLICATION_URL } from '../grants/grantPrograms';
import { formatAmountUsd } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

const StatsStripSection = () => {
  const { data: stats } = trpc.grants.getCareerTransitionGrantStats.useQuery();

  const grantsMadeLabel = stats ? String(stats.count) : '—';
  const fundingAwardedLabel = stats ? formatAmountUsd(stats.totalAmountUsd) : '—';

  return (
    <section className="section section-body career-transition-grant-stats-strip">
      <div className="w-full min-[680px]:max-w-[1120px] min-[680px]:mx-auto flex flex-col gap-6 min-[680px]:flex-row min-[680px]:items-center min-[680px]:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-10 gap-y-3">
          <Stat label="Grants made" value={grantsMadeLabel} />
          <Stat label="Funding awarded" value={fundingAwardedLabel} />
        </div>
        <CTALinkOrButton
          variant="primary"
          withChevron
          url={CAREER_TRANSITION_GRANT_APPLICATION_URL}
        >
          Apply now
        </CTALinkOrButton>
      </div>
    </section>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-bluedot-navy/60">
        {label}
      </p>
      <p className="text-[24px] min-[680px]:text-[28px] font-medium leading-tight text-bluedot-navy">
        {value}
      </p>
    </div>
  );
};

export default StatsStripSection;
