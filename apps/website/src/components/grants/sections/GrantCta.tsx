import { CTALinkOrButton } from '@bluedot/ui';
import { type GrantTypeSlug } from '../../../lib/grantTypes';
import { useApplicationUrl } from '../../../lib/hooks/useApplicationUrl';

type Props = {
  grantType: GrantTypeSlug;
};

const GrantCta = ({ grantType }: Props) => {
  const applicationUrl = useApplicationUrl(grantType);

  if (!applicationUrl) return null;

  return (
    <div className={`${grantType}-cta w-full max-w-max-width mx-auto px-spacing-x mt-spacing-y mb-16 flex justify-center`}>
      <CTALinkOrButton
        variant="primary"
        withChevron
        url={applicationUrl}
        target="_blank"
      >
        Apply now
      </CTALinkOrButton>
    </div>
  );
};

export default GrantCta;
