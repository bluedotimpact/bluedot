import { cn } from '@bluedot/ui';
import type React from 'react';

type GrantPageSectionProps = React.PropsWithChildren<{
  title?: string;
  contentClassName?: string;
}>;

const GrantPageSection = ({
  title,
  contentClassName,
  children,
}: GrantPageSectionProps) => {
  return (
    <section className="w-full">
      <div className="max-w-max-width mx-auto px-5 min-[680px]:px-8 lg:px-spacing-x py-8 min-[680px]:py-10 min-[1280px]:py-12">
        <div className="max-w-[1120px] mx-auto">
          {title && (
            <div className="max-w-[760px]">
              <h2 className="mt-2 text-[28px] min-[680px]:text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] text-bluedot-navy">
                {title}
              </h2>
            </div>
          )}

          <div className={cn(title ? 'mt-6' : '', contentClassName)}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GrantPageSection;
