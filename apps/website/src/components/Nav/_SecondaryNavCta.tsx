import clsx from 'clsx';
import { CTALinkOrButton } from '@bluedot/ui';

export const SecondaryNavCta: React.FC<{
  // Optional
  className?: string;
  primaryCtaText?: string;
  primaryCtaUrl?: string;
}> = ({
  className,
  primaryCtaText = 'Support us',
  primaryCtaUrl = 'https://donate.stripe.com/5kA3fpgjpdJv6o89AA',
}) => {
  return (
    <CTALinkOrButton
      className={clsx('nav__secondary-cta', className)}
      variant="secondary"
      url={primaryCtaUrl}
    >
      {primaryCtaText}
    </CTALinkOrButton>
  );
};
