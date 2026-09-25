import {
  H2, H3, H4, P,
} from '@bluedot/ui';
import clsx from 'clsx';
import Link from 'next/link';
import { useId, type ReactNode } from 'react';
import {
  LuArrowRight, LuArrowUpRight, LuBlocks, LuComponent, LuRoute, LuShield,
} from 'react-icons/lu';

// Each opportunity keeps the same visual identity on the homepage and directories.
const OPPORTUNITY_STYLES = {
  funding: {
    icon: LuBlocks,
    gradient: 'radial-gradient(ellipse at 100% 110%, var(--marketing-hero-blue) 0%, var(--marketing-hero-indigo) 42%, var(--marketing-hero-midnight) 85%)',
  },
  careerTransition: {
    icon: LuRoute,
    gradient: 'radial-gradient(ellipse at 100% 0%, color-mix(in srgb, var(--marketing-hero-sky) 65%, var(--marketing-hero-indigo)) 0%, var(--marketing-hero-blue) 50%, var(--marketing-hero-indigo) 100%)',
  },
  programs: {
    icon: LuComponent,
    gradient: 'linear-gradient(130deg, var(--marketing-hero-indigo) 0%, var(--marketing-hero-blue) 62%, color-mix(in srgb, var(--marketing-hero-sky) 35%, var(--marketing-hero-blue)) 100%)',
  },
  securityBootcamp: {
    icon: LuShield,
    gradient: 'radial-gradient(ellipse at 0% 100%, color-mix(in srgb, var(--marketing-hero-sky) 55%, var(--marketing-hero-indigo)) 0%, var(--marketing-hero-indigo) 35%, var(--marketing-hero-midnight) 90%)',
  },
} as const;

export type OpportunityCardTone = keyof typeof OPPORTUNITY_STYLES;

type OpportunityCardProps = {
  title: string;
  description: string | null;
  href: string;
  tone: OpportunityCardTone;
  external?: boolean;
  compact?: boolean;
  headingLevel?: 2 | 3 | 4;
  details?: ReactNode;
  ctaLabel?: string;
};

const OpportunityCard = ({
  title, description, href, tone, external = false, compact = false, headingLevel = 2, details, ctaLabel,
}: OpportunityCardProps) => {
  const titleId = useId();
  const { icon: Icon, gradient } = OPPORTUNITY_STYLES[tone];
  const Arrow = external ? LuArrowUpRight : LuArrowRight;
  const Heading = { 2: H2, 3: H3, 4: H4 }[headingLevel];
  const className = clsx(
    'opportunity-card group relative flex h-full min-h-56 flex-col overflow-hidden rounded-surface border border-bluedot-navy/10 text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bluedot-normal',
    compact ? 'action-cards__card p-6 md:p-7' : 'p-6 md:p-8',
  );
  const arrowClassName = 'size-6 shrink-0 opacity-70 transition-[transform,opacity] duration-200 group-hover:translate-x-1 group-hover:opacity-100 group-focus-visible:translate-x-1 group-focus-visible:opacity-100 motion-reduce:transform-none motion-reduce:transition-none';

  const content = (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-30"
        style={{
          backgroundImage: 'url(/images/agi-strategy/noise.webp)',
          backgroundRepeat: 'repeat',
          backgroundSize: '464.64px 736.56px',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" />
      <div className={clsx('relative flex items-start justify-between gap-4', compact ? 'mb-7' : 'mb-8 md:mb-10')}>
        <Icon aria-hidden="true" className="size-7" strokeWidth={1.4} />
        {!ctaLabel && <Arrow aria-hidden="true" className={arrowClassName} />}
      </div>
      <div className={clsx('relative flex flex-col gap-3', compact && 'mt-auto')}>
        <Heading className="text-size-lg font-medium leading-snug tracking-tight text-white">
          <span id={titleId}>
            {title}
            {external && <span className="sr-only"> (opens in a new tab)</span>}
          </span>
        </Heading>
        {description && <P className="text-white/85">{description}</P>}
      </div>
      {(Boolean(details) || Boolean(ctaLabel)) && (
        <div className="relative mt-auto pt-8">
          <div className="flex flex-col gap-6 border-t border-white/20 pt-6">
            {details}
            {ctaLabel && (
              <span className="flex items-center justify-between gap-4 text-size-sm font-medium">
                {ctaLabel}
                <Arrow aria-hidden="true" className={arrowClassName} />
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-labelledby={titleId} className={className} style={{ background: gradient }}>
      {content}
    </a>
  ) : (
    <Link href={href} aria-labelledby={titleId} className={className} style={{ background: gradient }}>
      {content}
    </Link>
  );
};

export default OpportunityCard;
