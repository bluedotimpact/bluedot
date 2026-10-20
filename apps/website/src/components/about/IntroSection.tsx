import { H3, P } from '@bluedot/ui';
import TeamSize from '../shared/TeamSize';

const steps = [
  {
    title: 'Courses',
    description: 'Free courses in AI safety, AI governance and biosecurity. Over 10,000 people have taken them.',
  },
  {
    title: 'Grants',
    description: 'Funding for people to change careers or start new projects.',
  },
  {
    title: 'Programs',
    description: 'In-person programs that give people the context and connections to get started.',
  },
] as const;

const IntroSection = () => {
  return (
    <section className="intro-section section section-body">
      <H3 className="mb-6">What we do</H3>
      <div className="intro-section__text-container flex flex-col gap-5 max-w-prose">
        <P>AI is moving fast, and too few people are working to make it go well. We find people who could help and get them working on it full-time.</P>
        <ul className="flex flex-col gap-3 list-disc pl-5">
          {steps.map((step) => (
            <li key={step.title}>
              <P><strong>{step.title}.</strong> {step.description}</P>
            </li>
          ))}
        </ul>
        <P>Our alumni work at Anthropic, Google DeepMind, the UK AI Security Institute and many other organisations.</P>
        <P>We started in 2021 as reading groups in Cambridge. Today we&apos;re <TeamSize /> in San Francisco, London and remotely, and we&apos;ve raised $71M.</P>
      </div>
    </section>
  );
};

export default IntroSection;
