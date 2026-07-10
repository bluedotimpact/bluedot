import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

const REFERRAL_FORM_URL = 'https://airtable.com/appnJbsG1eWbAdEvf/pagzDBxQxLCuU2A1i/form';

const AboutYouSection = () => {
  return (
    <section className="section section-body incubator-week-about-you-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>About you</h3>
        <ul className="list-disc pl-6 flex flex-col gap-2">
          <li>Technically serious</li>
          <li>Working in or adjacent to AI safety, biosecurity, cyber, or other catastrophic-risk fields</li>
          <li>Ready to leave whatever you&apos;re doing now to build</li>
          <li>You don&apos;t need a polished idea - we will help you find one here</li>
        </ul>
        <P className="text-size-sm leading-relaxed text-bluedot-navy/80">
          Know someone who should be there?{' '}
          <a href={REFERRAL_FORM_URL} target="_blank" rel="noreferrer" className="underline hover:no-underline">Refer them here</a>
          {', '}and we&apos;ll send you $2,000 for each person accepted after your referral.
        </P>
      </div>
    </section>
  );
};

export default AboutYouSection;
