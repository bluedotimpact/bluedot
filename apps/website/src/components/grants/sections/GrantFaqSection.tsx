import FAQSection from '../../lander/components/FAQSection';
import {
  GRANT_PROGRAM_SECTIONS,
  type ConfigurableGrantProgramSlug,
} from '../grantPrograms';

type Props = {
  program: ConfigurableGrantProgramSlug;
};

const GrantFaqSection = ({ program }: Props) => {
  const { faqItems } = GRANT_PROGRAM_SECTIONS[program];

  return (
    <FAQSection
      id={`${program}-faq`}
      title="Frequently asked questions"
      items={faqItems}
      background="canvas"
    />
  );
};

export default GrantFaqSection;
