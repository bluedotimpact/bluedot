import { P, Section } from '@bluedot/ui';
import { RAPID_GRANT_APPLICATION_URL } from '../grants/grantPrograms';

const PROCESS_STEPS = [
  {
    number: '01',
    title: 'Apply',
    url: RAPID_GRANT_APPLICATION_URL,
    body: 'Tell us what you are doing, what you need, and how much it costs. Five minutes, no lengthy proposals.',
  },
  {
    number: '02',
    title: 'Get a decision',
    body: 'We usually reply within five working days.',
  },
  {
    number: '03',
    title: 'Get paid',
    body: 'We pay upfront by default. In some cases we reimburse after - we will tell you which.',
  },
  {
    number: '04',
    title: 'Do the work',
    body: 'Use the funding for what we agreed on. If your plans change materially, let us know.',
  },
  {
    number: '05',
    title: 'Share your impact',
    body: 'A short update when the work is done - what you did, what came of it. No formal report, just close the loop.',
  },
];

const COMMUNITY_CARD = {
  eyebrow: 'Beyond the grant',
  title: 'Community',
  body: 'We keep a community of grantees, and depending on the work and timing, we may invite grant recipients into programming, events, or other opportunities.',
};

const cardBaseClass = 'rapid-grants-step-card relative overflow-hidden rounded-lg border px-5 py-5 min-h-[188px]';
const defaultCardClass = `${cardBaseClass} border-bluedot-darker/10 bg-white`;
const accentCardClass = `${cardBaseClass} border-bluedot-lighter bg-bluedot-lighter/20`;

const StepCardBody = ({ number, title, body, eyebrowClass }: {
  number: string;
  title: string;
  body: string;
  eyebrowClass: string;
}) => {
  return (
    <div className="flex h-full flex-col gap-6">
      <p className={`text-[12px] font-semibold uppercase tracking-[0.12em] ${eyebrowClass}`}>
        {number}
      </p>
      <div className="flex flex-col gap-3">
        <h3 className="text-[20px] min-[680px]:text-[22px] font-medium tracking-[-0.04em] text-bluedot-darker">
          {title}
        </h3>
        <P className="text-[15px] min-[680px]:text-[16px] leading-[1.7] text-bluedot-darker/70">
          {body}
        </P>
      </div>
    </div>
  );
};

const HowItWorksSection = () => {
  return (
    <Section className="rapid-grants-how-section" title="How it works">
      <div className="grid gap-4 min-[960px]:grid-cols-3">
        {PROCESS_STEPS.map((step) => (
          step.url ? (
            <a
              key={step.title}
              href={step.url}
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
                eyebrowClass="text-bluedot-darker/40"
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
    </Section>
  );
};

export default HowItWorksSection;
