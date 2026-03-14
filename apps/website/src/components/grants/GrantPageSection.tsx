import clsx from 'clsx';
import type React from 'react';

type GrantPageSectionProps = React.PropsWithChildren<{
  eyebrow?: string;
  title?: string;
  intro?: string;
  tone?: 'plain' | 'muted' | 'canvas';
  className?: string;
  contentClassName?: string;
  dividerTop?: boolean;
}>;

const GrantPageSection = ({
  eyebrow,
  title,
  intro,
  tone = 'plain',
  className,
  contentClassName,
  dividerTop = false,
  children,
}: GrantPageSectionProps) => {
  const hasHeadingContent = [eyebrow, title, intro].some((value) => value !== undefined);
  let backgroundClassName = 'bg-white';

  if (tone === 'muted') {
    backgroundClassName = 'bg-[#FAFBFD]';
  } else if (tone === 'canvas') {
    backgroundClassName = 'bg-color-canvas';
  }

  return (
    <section
      className={clsx(
        'w-full',
        dividerTop && 'border-t border-color-divider',
        backgroundClassName,
        className,
      )}
    >
      <div className="max-w-max-width mx-auto px-5 min-[680px]:px-8 lg:px-spacing-x py-8 min-[680px]:py-10 min-[1280px]:py-12">
        <div className="max-w-[1120px] mx-auto">
          {hasHeadingContent && (
            <div className="max-w-[860px]">
              {eyebrow && (
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-bluedot-navy/46">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2 className="mt-2 text-[28px] min-[680px]:text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] text-bluedot-navy">
                  {title}
                </h2>
              )}
              {intro && (
                <p className="mt-3 text-[16px] min-[680px]:text-[18px] leading-[1.7] text-bluedot-navy/72">
                  {intro}
                </p>
              )}
            </div>
          )}

          <div className={clsx(hasHeadingContent ? 'mt-6' : '', contentClassName)}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GrantPageSection;
