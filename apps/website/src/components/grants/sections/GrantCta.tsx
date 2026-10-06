import { Button } from '@bluedot/ui';
import { FaChevronRight } from 'react-icons/fa6';
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
      <Button
        variant="primary"
        url={applicationUrl}
        target="_blank"
      >
        Apply now
        <FaChevronRight aria-hidden className="size-4" />
      </Button>
    </div>
  );
};

export default GrantCta;
