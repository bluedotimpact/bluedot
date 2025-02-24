import { Section } from '@bluedot/ui';

const IntroSection = () => {
  return (
    <Section className="intro-section" title="Our story">
      <div className="intro-section__container flex lg:flex-row flex-col gap-space-between">
        <div className="intro-section__text-container flex flex-col gap-5">
          <p>In 2021, we and others around us wanted to learn about emerging technologies and how they might reshape the world – but nobody knew where to start. It was hard to find what to read, people to discuss it with, and ways to direct our careers to making a difference. The field of AI was moving so fast, and most of the key literature was in blog posts and arXiv pre-prints, rather than textbooks and peer-reviewed journals. Traditional education institutions were struggling to keep up.</p>
          <p>What started as small study groups at the University of Cambridge has grown into something much bigger: courses designed with some of the world's leading experts that have helped thousands of people understand and work on these challenges.</p>
          <p>As technology continues to advance rapidly, we're constantly adapting what we do. We work closely with leading organisations to understand what skills they need, quickly build new courses, and help talented people find roles where they can make a real difference.</p>
          <span className="intro-section__signature">
            <p>Dewi and Will,</p>
            <p>BlueDot Impact Co-Founders</p>
          </span>
        </div>
        <img className="intro-section__image max-w-[570px] w-full h-auto rounded-radius-md mt-6 sm:mt-0" src="/images/culture/About-Us_v1.jpg" alt="BlueDot Impact team" />
      </div>
    </Section>
  );
};

export default IntroSection;
