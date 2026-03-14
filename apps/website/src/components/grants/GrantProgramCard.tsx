import Link from 'next/link';
import clsx from 'clsx';
import { CTALinkOrButton } from '@bluedot/ui';
import {
  type GrantProgramSlug,
  type GrantProgramStatus,
  getGrantProgramViewTransitionStyle,
  STATUS_CLASS_MAP,
  STATUS_DOT_CLASS_MAP,
  SURFACE_CLASS_MAP,
} from './grantPrograms';

type GrantProgramCardProps = {
  slug: GrantProgramSlug;
  title: string;
  goal: string;
  scope: string;
  scopeLabel?: string;
  href: string;
  learnMoreText?: string;
  applyUrl?: string;
  applyText?: string;
  status: GrantProgramStatus;
  emphasis?: 'primary' | 'secondary';
  className?: string;
  example?: {
    label?: string;
    title: string;
    summary: string;
    meta?: string;
    url?: string;
  };
};

const GrantProgramCard = ({
  slug,
  title,
  goal,
  scope,
  scopeLabel = 'Scope',
  href,
  learnMoreText = 'Learn more',
  applyUrl,
  applyText = 'Apply now',
  status,
  emphasis = 'secondary',
  className,
  example,
}: GrantProgramCardProps) => {
  const surfaceClasses = SURFACE_CLASS_MAP[status];
  const surfaceTransitionStyle = getGrantProgramViewTransitionStyle(slug, 'surface');
  const titleTransitionStyle = getGrantProgramViewTransitionStyle(slug, 'title');
  const statusTransitionStyle = getGrantProgramViewTransitionStyle(slug, 'status');

  return (
    <article
      className={clsx(
        'group relative overflow-hidden rounded-[28px] border border-bluedot-navy/10 shadow-[0_16px_50px_rgba(8,28,68,0.06)] transition-all duration-200',
        'hover:border-bluedot-navy/14 hover:shadow-[0_24px_70px_rgba(8,28,68,0.10)]',
        surfaceClasses.panel,
        emphasis === 'primary' ? 'min-[960px]:min-h-[440px]' : 'min-[960px]:min-h-[390px]',
        className,
      )}
      style={surfaceTransitionStyle}
    >
      <div className={clsx('absolute inset-0 pointer-events-none', surfaceClasses.glow)} />
      <div className={clsx('absolute inset-y-0 left-0 w-px pointer-events-none', surfaceClasses.line)} />

      <div className="relative flex h-full flex-col p-6 min-[680px]:p-8 min-[960px]:p-9">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href={href} className="block">
              <h3
                className={clsx(
                  'max-w-[18ch] font-semibold leading-[1.02] tracking-[-0.04em] text-bluedot-navy transition-transform duration-200 group-hover:translate-x-0.5',
                  emphasis === 'primary'
                    ? 'text-[34px] min-[680px]:text-[40px]'
                    : 'text-[28px] min-[680px]:text-[32px]',
                )}
                style={titleTransitionStyle}
              >
                {title}
              </h3>
            </Link>
          </div>

          <span
            className={clsx('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold tracking-[0.02em]', STATUS_CLASS_MAP[status])}
            style={statusTransitionStyle}
          >
            <span className={clsx('size-2 rounded-full', STATUS_DOT_CLASS_MAP[status])} />
            {status}
          </span>
        </div>

        <div
          className={clsx(
            'mt-8 grid gap-4',
            emphasis === 'primary'
              ? 'min-[900px]:grid-cols-[1.1fr_1.1fr_0.95fr]'
              : 'min-[900px]:grid-cols-2',
          )}
        >
          <div className="rounded-2xl border border-white/70 bg-white/72 px-5 py-5 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-bluedot-navy/46">
              Objective
            </p>
            <p className="mt-3 text-[15px] min-[680px]:text-[16px] leading-[1.65] text-bluedot-navy/76">
              {goal}
            </p>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/72 px-5 py-5 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-bluedot-navy/46">
              {scopeLabel}
            </p>
            <p className="mt-3 text-[15px] min-[680px]:text-[16px] leading-[1.65] text-bluedot-navy/76">
              {scope}
            </p>
          </div>

          {example && (
            <div className="rounded-2xl border border-[#D8E4F3] bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(244,248,254,0.96)_100%)] px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5D789D]">
                {example.label ?? 'Example grant'}
              </p>
              <div className="mt-3">
                {example.url ? (
                  <a href={example.url} target="_blank" rel="noopener noreferrer" className="text-[18px] font-semibold leading-[1.25] tracking-[-0.02em] text-bluedot-navy hover:underline">
                    {example.title}
                  </a>
                ) : (
                  <p className="text-[18px] font-semibold leading-[1.25] tracking-[-0.02em] text-bluedot-navy">
                    {example.title}
                  </p>
                )}
                {example.meta && (
                  <p className="mt-2 text-[13px] font-medium text-[#4E6486]">
                    {example.meta}
                  </p>
                )}
                <p className="mt-3 text-[14px] leading-[1.6] text-bluedot-navy/70">
                  {example.summary}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-8">
          <CTALinkOrButton url={href} variant="secondary" withChevron>
            {learnMoreText}
          </CTALinkOrButton>

          {applyUrl && (
            <CTALinkOrButton url={applyUrl}>
              {applyText}
            </CTALinkOrButton>
          )}
        </div>
      </div>
    </article>
  );
};

export default GrantProgramCard;
