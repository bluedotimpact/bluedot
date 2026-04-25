import type React from 'react';
import { CTALinkOrButton } from '@bluedot/ui';
import { RAPID_GRANT_APPLICATION_URL } from '../grants/grantPrograms';
import { formatAmountUsd } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

const StatsStripSection = () => {
  const { data: stats } = trpc.grants.getRapidGrantStats.useQuery();

  const grantsMadeLabel = stats ? String(stats.count) : '—';
  const fundingGivenOutLabel = stats ? formatAmountUsd(stats.totalAmountUsd) : '—';

  const scrollToGrantees = (e: React.BaseSyntheticEvent) => {
    e.preventDefault();

    const granteesSection = document.getElementById('grants-made');
    if (!granteesSection) {
      return;
    }

    const navOffset = 96;
    const targetTop = granteesSection.getBoundingClientRect().top + window.scrollY - navOffset;

    window.history.replaceState(null, '', '#grants-made');
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

  return (
    <section className="section section-body rapid-grants-stats-strip">
      <div className="w-full min-[680px]:max-w-[840px] min-[680px]:mx-auto flex flex-col gap-6 min-[1024px]:flex-row min-[1024px]:items-center min-[1024px]:justify-between">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 min-[680px]:grid-cols-4 min-[680px]:gap-x-10">
          <Stat label="Typical grants" value="Up to $10k" />
          <Stat label="Decision time" value="~5 working days" />
          <Stat label="Grants made" value={grantsMadeLabel} />
          <Stat label="Funding given" value={fundingGivenOutLabel} />
        </div>
        <div className="flex flex-wrap gap-3">
          <CTALinkOrButton
            variant="primary"
            withChevron
            url={RAPID_GRANT_APPLICATION_URL}
          >
            Apply now
          </CTALinkOrButton>
          <CTALinkOrButton
            variant="secondary"
            withChevron
            url="#grants-made"
            onClick={scrollToGrantees}
          >
            See funded projects
          </CTALinkOrButton>
        </div>
      </div>
    </section>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-bluedot-navy/60">
        {label}
      </p>
      <p className="text-[18px] min-[680px]:text-[20px] font-medium leading-tight text-bluedot-navy">
        {value}
      </p>
    </div>
  );
};

export default StatsStripSection;
