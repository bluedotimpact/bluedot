import { CTALinkOrButton, H3, P } from '@bluedot/ui';

type Props = {
  applicationUrl: string | undefined;
  applicationDeadline?: string;
  ctaLabel?: string;
  contactEmail?: string;
};

const AboutBlueDotSection = ({
  applicationUrl,
  applicationDeadline,
  ctaLabel,
  contactEmail,
}: Props) => {
  const label = ctaLabel ?? (applicationDeadline ? `Apply by ${applicationDeadline}` : 'Apply now');
  return (
    <section className="section section-body incubator-week-about-bluedot-section">
      <div className="w-full flex flex-col gap-6">
        <H3>About BlueDot</H3>
        <P>
          BlueDot Impact is a nonprofit building the workforce and organisations needed to safely navigate AGI. We&apos;ve raised over $35M and trained over 8,000 people since 2022.
        </P>
        {contactEmail && (
          <P className="text-bluedot-navy/80">
            For questions, reach out to{' '}
            <a href={`mailto:${contactEmail}`} className="underline hover:no-underline">{contactEmail}</a>
            .
          </P>
        )}
        {applicationUrl && (
          <CTALinkOrButton
            variant="primary"
            withChevron
            url={applicationUrl}
            target="_blank"
          >
            {label}
          </CTALinkOrButton>
        )}
      </div>
    </section>
  );
};

export default AboutBlueDotSection;
