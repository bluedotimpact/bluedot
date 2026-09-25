import type React from 'react';
import { CTALinkOrButton, Eyebrow } from '@bluedot/ui';
import { type ApplicationSlug, useApplicationUrl } from '../lib/hooks/useApplicationUrl';

export type Stat = {
  label: string;
  value: string;
};

export type StatsAction = {
  label: string;
  url: string | undefined;
  onClick?: (e: React.BaseSyntheticEvent) => void;
};

type Props = {
  /** Airtable `program` slug whose application form the default "Apply now" CTA links to. */
  slug: ApplicationSlug;
  stats: Stat[];
  /** Override the default "Apply now" primary CTA target. */
  primaryAction?: StatsAction;
  secondaryAction?: StatsAction;
  /** Compact: tighter type scale, 2-then-4 grid. Default: roomier scale, single flex row. */
  compact?: boolean;
};

const StatsStrip = ({
  slug,
  stats,
  primaryAction,
  secondaryAction,
  compact = false,
}: Props) => {
  const applicationUrl = useApplicationUrl(slug);
  const primary = primaryAction ?? { label: 'Apply now', url: applicationUrl };

  const outerLayoutClass = compact
    ? 'w-full flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'
    : 'w-full flex flex-col gap-6 bd-md:flex-row bd-md:items-center bd-md:justify-between';

  const statsLayoutClass = compact
    ? 'grid grid-cols-2 gap-x-8 gap-y-4 bd-md:grid-cols-4 bd-md:gap-x-10'
    : 'flex flex-wrap items-baseline gap-x-10 gap-y-3';

  return (
    <section className={`section section-body ${slug}-stats-strip`}>
      <div className={outerLayoutClass}>
        <div className={statsLayoutClass}>
          {stats.map((stat) => (
            <StatItem key={stat.label} label={stat.label} value={stat.value} compact={compact} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {primary.url && (
            <CTALinkOrButton
              variant="primary"
              withChevron
              url={primary.url}
              target="_blank"
              onClick={primary.onClick}
            >
              {primary.label}
            </CTALinkOrButton>
          )}
          {secondaryAction?.url && (
            <CTALinkOrButton
              variant="secondary"
              withChevron
              url={secondaryAction.url}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </CTALinkOrButton>
          )}
        </div>
      </div>
    </section>
  );
};

const StatItem = ({ label, value, compact }: { label: string; value: string; compact: boolean }) => {
  const valueClass = compact
    ? 'text-size-md font-medium leading-tight text-bluedot-navy'
    : 'text-size-lg bd-md:text-[28px] font-medium leading-tight text-bluedot-navy';

  return (
    <div className="flex flex-col gap-1">
      <Eyebrow className="text-secondary">{label}</Eyebrow>
      <p className={valueClass}>{value}</p>
    </div>
  );
};

export default StatsStrip;
