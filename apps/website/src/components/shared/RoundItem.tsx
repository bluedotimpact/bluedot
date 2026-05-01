export function buildRoundApplyUrl(baseUrl: string, roundId: string): string {
  if (!baseUrl) return '';
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}prefill_Round=${roundId}`;
}

type RoundItemProps = {
  /** Primary bold line, e.g. "AI Governance \u00b7 5 May \u2013 20 Jun" or just "5 May \u2013 20 Jun" */
  title: string;
  /** Dimmed secondary line, e.g. "Application closes 28 Apr" */
  subtitle: string;
  /** Full CTA URL \u2014 caller is responsible for building it */
  href: string;
  /** CTA button text. Defaults to "Apply now" */
  ctaText?: string;
  /** Left accent bar color. Defaults to var(--bluedot-normal) */
  accentColor?: string;
  /** CTA text color. Defaults to var(--bluedot-normal). Pass accentColor here when the page is course-themed (e.g. lander pages) */
  ctaColor?: string;
};

export const RoundItem = ({
  title,
  subtitle,
  href,
  ctaText = 'Apply now',
  accentColor,
  ctaColor,
}: RoundItemProps) => {
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const barColor = accentColor || 'var(--bluedot-normal)';
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const resolvedCtaColor = ctaColor || 'var(--bluedot-normal)';

  const dateContent = (
    <div>
      <p className="text-size-sm leading-[1.6] font-semibold text-bluedot-navy">{title}</p>
      <p className="text-size-sm leading-[1.6] text-bluedot-navy/50">{subtitle}</p>
    </div>
  );

  if (!href) return null;

  return (
    <>
      {/* Mobile: only CTA link is clickable */}
      <div className="flex flex-col gap-2 bd-md:hidden">
        <div className="flex items-stretch gap-3">
          <div className="w-1 flex-shrink-0 rounded-sm" style={{ backgroundColor: barColor }} />
          <div className="flex flex-col gap-3">
            {dateContent}
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${ctaText} (opens in a new tab)`}
              className="text-size-sm leading-[1.6] font-medium"
              style={{ color: resolvedCtaColor }}
            >
              {ctaText}
            </a>
          </div>
        </div>
      </div>

      {/* Desktop: entire card is clickable */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${ctaText} (opens in a new tab)`}
        className="group hidden flex-row items-center justify-between gap-4 bd-md:flex"
      >
        <div className="flex items-stretch gap-4">
          <div
            className="w-1 flex-shrink-0 rounded-sm opacity-30 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            style={{ backgroundColor: barColor }}
          />
          <div className="flex flex-col">{dateContent}</div>
        </div>

        <div className="ml-auto flex items-center text-size-sm leading-[1.6] font-medium" style={{ color: resolvedCtaColor }}>
          <span className="transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1">
            {ctaText}
          </span>
          <span className="ml-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            &rarr;
          </span>
        </div>
      </a>
    </>
  );
};
