import { CTALinkOrButton } from '@bluedot/ui';
import {
  GRANT_PROGRAM_SECTIONS,
  type ConfigurableGrantProgramSlug,
} from '../grantPrograms';

type Props = {
  program: ConfigurableGrantProgramSlug;
};

const GrantCta = ({ program }: Props) => {
  const { applicationUrl } = GRANT_PROGRAM_SECTIONS[program];

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
