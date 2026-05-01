import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';
import { RAPID_GRANT_APPLICATION_URL } from '../grants/grantPrograms';

const PROCESS_STEPS = [
  {
    number: '01',
    title: 'Apply',
    url: RAPID_GRANT_APPLICATION_URL,
    body: 'Tell us what you\'re doing, what you need, and how much it costs. Takes five minutes.',
  },
  {
    number: '02',
    title: 'Get a decision',
    body: 'We usually reply within five working days.',
  },
  {
    number: '03',
    title: 'Get paid',
    body: 'We pay upfront by default; sometimes we reimburse instead. We\'ll let you know which when we approve.',
  },
  {
    number: '04',
    title: 'Do the work',
    body: 'Use the funding for what we agreed on. If your plan shifts, tell us.',
  },
  {
    number: '05',
    title: 'Share your impact',
    body: 'A short update when you\'re done. What you did, what came of it. No formal report.',
  },
];

const COMMUNITY_CARD = {
  eyebrow: 'Beyond the grant',
  title: 'Community',
  body: 'Grantees join our community: intros, event invites, and follow-on opportunities as they come up.',
};

const cardBaseClass = 'rapid-grants-step-card relative overflow-hidden rounded-lg border px-5 py-5 min-h-[188px]';
const defaultCardClass = `${cardBaseClass} border-bluedot-navy/10 bg-white`;
const accentCardClass = `${cardBaseClass} border-bluedot-lighter bg-bluedot-lighter/20`;

const StepCardBody = ({ number, title, body, eyebrowClass }: {
  number: string;
  title: string;
  body: string;
  eyebrowClass: string;
}) => {
  return (
    <div className="flex h-full flex-col gap-6">
      <p className={`text-size-xxs font-semibold uppercase tracking-[0.12em] ${eyebrowClass}`}>
        {number}
      </p>
      <div className="flex flex-col gap-3">
        <h4 className="text-size-md bd-md:text-size-lg font-medium tracking-[-0.04em] text-bluedot-navy">
          {title}
        </h4>
        <P className="text-size-sm leading-[1.7] text-bluedot-navy/70">
          {body}
        </P>
      </div>
    </div>
  );
};

const HowItWorksSection = () => {
  return (
    <section className="section section-body rapid-grants-how-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>How it works</h3>

        <div className="grid gap-4 bd-md:grid-cols-2 min-[960px]:grid-cols-3">
          {PROCESS_STEPS.map((step) => (
            step.url ? (
              <a
                key={step.title}
                href={step.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${accentCardClass} block cursor-pointer`}
              >
                <StepCardBody
                  number={step.number}
                  title={step.title}
                  body={step.body}
                  eyebrowClass="text-bluedot-dark"
                />
              </a>
            ) : (
              <div key={step.title} className={defaultCardClass}>
                <StepCardBody
                  number={step.number}
                  title={step.title}
                  body={step.body}
                  eyebrowClass="text-bluedot-navy/40"
                />
              </div>
            )
          ))}

          <div className={accentCardClass}>
            <StepCardBody
              number={COMMUNITY_CARD.eyebrow}
              title={COMMUNITY_CARD.title}
              body={COMMUNITY_CARD.body}
              eyebrowClass="text-bluedot-dark"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
