import type React from 'react';
import { cn, CTALinkOrButton, H1 } from '@bluedot/ui';
import {
  type GrantProgramSlug,
  type GrantProgramStatus,
  getGrantProgramViewTransitionStyle,
  STATUS_CLASS_MAP,
  STATUS_DOT_CLASS_MAP,
  SURFACE_CLASS_MAP,
} from './grantPrograms';

type HeroCta = {
  text: string;
  url: string;
  onClick?: (e: React.BaseSyntheticEvent) => void;
};

type HeroFact = {
  label: string;
  value: string;
};

type GrantProgramHeroProps = {
  slug: GrantProgramSlug;
  title: string;
  description: string;
  status: GrantProgramStatus;
  primaryCta: HeroCta;
  secondaryCta?: HeroCta;
  facts?: HeroFact[];
};

const GrantProgramHero = ({
  slug,
  title,
  description,
  status,
  primaryCta,
  secondaryCta,
  facts,
}: GrantProgramHeroProps) => {
  const surfaceClasses = SURFACE_CLASS_MAP[status];
  const surfaceTransitionStyle = getGrantProgramViewTransitionStyle(slug, 'surface');
  const titleTransitionStyle = getGrantProgramViewTransitionStyle(slug, 'title');
  const statusTransitionStyle = getGrantProgramViewTransitionStyle(slug, 'status');

  return (
    <section className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 min-[680px]:px-8 lg:px-spacing-x py-6 min-[680px]:py-8 min-[1280px]:py-10">
        <div
          className={cn(
            'relative overflow-hidden rounded-[28px] border border-bluedot-navy/10 shadow-[0_16px_50px_rgba(8,28,68,0.06)]',
            surfaceClasses.panel,
          )}
          style={surfaceTransitionStyle}
        >
          <div className={cn('absolute inset-0 pointer-events-none', surfaceClasses.glow)} />
          <div className={cn('absolute inset-y-0 left-0 w-px pointer-events-none', surfaceClasses.line)} />

          <div className="relative p-6 min-[680px]:p-8 min-[1024px]:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold tracking-[0.02em]', STATUS_CLASS_MAP[status])}
                style={statusTransitionStyle}
              >
                <span className={cn('size-2 rounded-full', STATUS_DOT_CLASS_MAP[status])} />
                {status}
              </span>
            </div>

            <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-8 xl:gap-12 lg:items-start">
              <div className="max-w-[760px]">
                <div style={titleTransitionStyle}>
                  <H1 className="text-[34px] min-[680px]:text-[42px] min-[1024px]:text-[48px] leading-tight font-medium tracking-[-1px] text-bluedot-navy">
                    {title}
                  </H1>
                </div>

                <p className="mt-5 max-w-[640px] text-size-sm min-[680px]:text-[18px] min-[1024px]:text-[20px] leading-[1.6] tracking-[-0.1px] text-bluedot-navy/74">
                  {description}
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <CTALinkOrButton url={primaryCta.url} onClick={primaryCta.onClick}>
                    {primaryCta.text}
                  </CTALinkOrButton>
                  {secondaryCta && (
                    <CTALinkOrButton
                      url={secondaryCta.url}
                      onClick={secondaryCta.onClick}
                      variant="secondary"
                      withChevron
                    >
                      {secondaryCta.text}
                    </CTALinkOrButton>
                  )}
                </div>
              </div>

              {!!facts?.length && (
                <div className="mt-10 grid gap-4 min-[680px]:grid-cols-2 lg:mt-0 lg:self-stretch">
                  {facts.map((fact) => (
                    <div key={fact.label} className="rounded-[20px] border border-white/70 bg-white/72 px-5 py-5 backdrop-blur-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-bluedot-navy/44">
                        {fact.label}
                      </p>
                      <p className="mt-2 text-[18px] min-[680px]:text-[19px] font-medium leading-[1.35] text-bluedot-navy">
                        {fact.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default GrantProgramHero;
