import { ClickTarget, cn } from '@bluedot/ui';
import type { HTMLAttributeAnchorTarget, ReactNode } from 'react';
import { FaArrowRight } from 'react-icons/fa6';
import { FiLock } from 'react-icons/fi';

export type SidebarActionTone = 'solid' | 'success' | 'subtle' | 'outline' | 'locked';

// Figma ".Course Sidebar Action Button" Tone axis. Which certificate status yields which tone is
// decided by SidebarCertificatePanel / SidebarFacilitateAgainPanel; this component only draws it.
const TONE_STYLES: Record<SidebarActionTone, string> = {
  solid: 'border-accent bg-accent text-on-dark hover:bg-accent-hover',
  success: 'border-success-border bg-success-bg text-success-fg hover:opacity-90',
  subtle: 'border-accent bg-accent-subtle text-accent hover:opacity-90',
  outline: 'border-accent bg-transparent text-accent hover:bg-accent-subtle',
  locked: 'border-transparent bg-tint text-secondary',
};

export type SidebarActionCardProps = {
  tone: SidebarActionTone;
  title: string;
  subtitle?: ReactNode;
  /** Link destination. Omit for the non-interactive `locked` tone. */
  href?: string;
  target?: HTMLAttributeAnchorTarget;
};

export const SidebarActionCard = ({
  tone, title, subtitle, href, target,
}: SidebarActionCardProps) => {
  const cardClassName = cn(
    'flex items-center gap-3 rounded-surface border px-3 py-4 text-left no-underline transition',
    TONE_STYLES[tone],
  );
  const content = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-size-sm font-semibold leading-normal">{title}</span>
        {subtitle && <span className="text-size-xs leading-normal">{subtitle}</span>}
      </span>
      {tone === 'locked'
        ? <FiLock aria-hidden="true" className="size-5 shrink-0" />
        : <FaArrowRight aria-hidden="true" className="size-5 shrink-0" />}
    </>
  );

  if (href) {
    return (
      <ClickTarget url={href} target={target} className={cardClassName}>
        {content}
      </ClickTarget>
    );
  }

  return <div className={cardClassName}>{content}</div>;
};
