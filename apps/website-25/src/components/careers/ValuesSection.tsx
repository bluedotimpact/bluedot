import { Section, ValueCard } from '@bluedot/ui';

const ValuesSection = () => {
  return (
    <Section className="values-section" title="Our values">
      <div className="flex gap-8 overflow-y-scroll">
        <ValueCard
          icon="icons/fast.svg"
          title="Think hard, act fast, fail faster"
          description="We think critically about our goals and the best path to achieve them. We learn by building rapid experiments, failing fast, measuring the results, and updating."
        />
        <ValueCard
          icon="icons/care.svg"
          title="Care personally, challenge directly"
          description="We care about our team and our community, and we hold everyone to high standards."
        />
        <ValueCard
          icon="icons/solvers.svg"
          title="Obsessed with empowering problem-solvers"
          description="We exist to support others to solve the world's biggest problems. We go above and beyond to accelerate our community's impact."
        />
      </div>
    </Section>
  );
};

export default ValuesSection;
