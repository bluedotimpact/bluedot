import { CTALinkOrButton } from '@bluedot/ui';
import { type ConfigurableGrantProgramSlug } from '../grantPrograms';
import { useGrantApplicationUrl } from '../useGrantApplicationUrl';

type Props = {
  program: ConfigurableGrantProgramSlug;
};

const GrantCta = ({ program }: Props) => {
  const applicationUrl = useGrantApplicationUrl(program);

  return (
    <div className={`${program}-cta w-full max-w-max-width mx-auto px-spacing-x mt-spacing-y mb-16 flex justify-center`}>
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
