import { P, Section } from '@bluedot/ui';

const WhyUsSection = () => {
  return (
    <Section title="Why us">
      <div className="flex flex-col gap-5">
        <P>We&apos;re 7 people. We just raised $25M. We&apos;re expanding from London to San Francisco in 2026 and scaling to 20 team members. If you join now, you&apos;ll shape how the organisation works, what we build, and who we become.</P>
        <P>On any given day you might be shipping a new course, redesigning a placements pipeline, or figuring out how to reach ten times more people. We delete bureaucracy: our expense policy is &quot;act in BlueDot&apos;s best interest.&quot; We&apos;re a non-profit, but our salaries are benchmarked on SF tech salaries.</P>
        <P>If this sounds exciting rather than exhausting, you&apos;ll fit right in.</P>
      </div>
    </Section>
  );
};

export default WhyUsSection;
