import type React from 'react';
import { CTALinkOrButton } from '@bluedot/ui';
import {
  GRANT_PROGRAM_SECTIONS,
  type ConfigurableGrantProgramSlug,
} from '../grantPrograms';

export type GrantStat = {
  label: string;
  value: string;
};

export type GrantStatsAction = {
  label: string;
  url: string;
  onClick?: (e: React.BaseSyntheticEvent) => void;
};

type Props = {
  program: ConfigurableGrantProgramSlug;
  stats: GrantStat[];
  /** Override the default "Apply now" primary CTA target. Defaults to the program's applicationUrl. */
  primaryAction?: GrantStatsAction;
  secondaryAction?: GrantStatsAction;
  /** Compact: tighter type scale, 2-then-4 grid. Default: roomier scale, single flex row. */
  compact?: boolean;
};

const GrantStatsStrip = ({
  program,
  stats,
  primaryAction,
  secondaryAction,
  compact = false,
}: Props) => {
  const { applicationUrl } = GRANT_PROGRAM_SECTIONS[program];
  const primary = primaryAction ?? { label: 'Apply now', url: applicationUrl };

  const outerLayoutClass = compact
    ? 'w-full flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'
    : 'w-full flex flex-col gap-6 bd-md:flex-row bd-md:items-center bd-md:justify-between';

  const statsLayoutClass = compact
    ? 'grid grid-cols-2 gap-x-8 gap-y-4 bd-md:grid-cols-4 bd-md:gap-x-10'
    : 'flex flex-wrap items-baseline gap-x-10 gap-y-3';

  return (
    <section className={`section section-body ${program}-stats-strip`}>
      <div className={outerLayoutClass}>
        <div className={statsLayoutClass}>
          {stats.map((stat) => (
            <Stat key={stat.label} label={stat.label} value={stat.value} compact={compact} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <CTALinkOrButton
            variant="primary"
            withChevron
            url={primary.url}
            target="_blank"
            onClick={primary.onClick}
          >
            {primary.label}
          </CTALinkOrButton>
          {secondaryAction && (
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

const Stat = ({ label, value, compact }: { label: string; value: string; compact: boolean }) => {
  const labelClass = compact
    ? 'text-[11px] font-semibold uppercase tracking-[0.14em] text-bluedot-navy/60'
    : 'text-size-xxs font-semibold uppercase tracking-[0.14em] text-bluedot-navy/60';
  const valueClass = compact
    ? 'text-size-md bd-md:text-[20px] font-medium leading-tight text-bluedot-navy'
    : 'text-size-lg bd-md:text-[28px] font-medium leading-tight text-bluedot-navy';

  return (
    <div className="flex flex-col gap-1">
      <p className={labelClass}>{label}</p>
      <p className={valueClass}>{value}</p>
    </div>
  );
};

export default GrantStatsStrip;
