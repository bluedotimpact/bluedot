import FAQSection from '../../lander/components/FAQSection';
import { type GrantTypeSlug } from '../../../lib/grantTypes';
import { GRANT_TYPE_FAQS } from '../grantTypeFaqs';

type Props = {
  grantType: GrantTypeSlug;
  variant?: 'cards' | 'plain';
};

const GrantFaqSection = ({ grantType, variant }: Props) => (
  <FAQSection
    id={`${grantType}-faq`}
    title="Frequently asked questions"
    items={GRANT_TYPE_FAQS[grantType]}
    background="canvas"
    variant={variant}
  />
);

export default GrantFaqSection;
