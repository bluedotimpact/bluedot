import { CTALinkOrButton, P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

type Props = {
  applicationUrl: string | undefined;
  applicationDeadline: string;
};

const AboutBlueDotSection = ({ applicationUrl, applicationDeadline }: Props) => {
  return (
    <section className="section section-body incubator-week-about-bluedot-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>About BlueDot</h3>
        <P>
          BlueDot Impact is a nonprofit based in London and SF, building the workforce and organisations needed to safely navigate AGI. We&apos;ve raised over $35M and trained over 8,000 people since 2022.
        </P>
        {applicationUrl && (
          <CTALinkOrButton
            variant="primary"
            withChevron
            url={applicationUrl}
            target="_blank"
          >
            Apply by {applicationDeadline}
          </CTALinkOrButton>
        )}
      </div>
    </section>
  );
};

export default AboutBlueDotSection;
