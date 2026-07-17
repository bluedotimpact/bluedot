import { H3, P } from '@bluedot/ui';

const WhyUsSection = () => {
  return (
    <section className="section section-body">
      <H3 className="mb-6">
        Why us
      </H3>
      <div className="flex flex-col gap-5">
        <P>We&apos;re a small team. We just raised an additional $25M. We&apos;re expanding from London to San Francisco in 2026 and scaling to 20 team members. If you join now, you&apos;ll shape how the organisation works, what we build, and who we become.</P>
        <P>On any given day you might be shipping a new course, redesigning a placements pipeline, or figuring out how to reach ten times more people. We delete bureaucracy: our expense policy is &quot;act in BlueDot&apos;s best interest.&quot; We&apos;re a non-profit, but our salaries are benchmarked on SF tech salaries.</P>
      </div>
    </section>
  );
};

export default WhyUsSection;
