import { pageSectionHeadingClass } from '../PageListRow';

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
      </div>
    </section>
  );
};

export default AboutYouSection;
