import {
  HeroSection,
  HeroH1,
  Breadcrumbs,
  Section,
} from '@bluedot/ui';
import { HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import Head from 'next/head';
import { COURSE_UNITS } from '@bluedot/ui/src/constants';
import { isMobile } from 'react-device-detect';
import { ROUTES } from '../../../../lib/routes';
import SideBar from '../../../../components/courses/SideBar';

const CURRENT_ROUTE = ROUTES.coursesFutureOfAiUnit1;

const FutureOfAiCourseUnit1Page = () => {
  return (
    <div>
      <Head>
        <title>Future of AI: Unit 1</title>
        <meta name="description" content="Beyond chatbots: the expanding frontier of AI capabilities" />
      </Head>
      <HeroSection>
        <HeroMiniTitle>Future of AI</HeroMiniTitle>
        <HeroH1>Beyond chatbots: the expanding frontier of AI capabilities</HeroH1>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section>
        <div className="unit flex flex-col md:flex-row gap-12">
          {!isMobile && (
            <SideBar units={COURSE_UNITS} currentUnit={COURSE_UNITS[0]} />
          )}
          <div className="unit__content flex flex-col flex-1 gap-4">
            <div className="unit__content-block flex flex-col gap-2">
              <p>Just a few years ago, AI models struggled to form coherent sentences. Today, millions rely on tools like ChatGPT daily for help with work, studying, and creative projects—and these systems now extend far beyond simple chat. AI can create art, write complex code, and even guide robots through real-world tasks.</p>
              <p>This unit explores how AI is evolving from helpful ‘tools’ into capable autonomous ‘agents’ capable of independently setting goals, making decisions, and acting on them.</p>
            </div>
            <div className="unit__content-block flex flex-col gap-2">
              <h3>How current AI systems work</h3>
              <p>Models like ChatGPT operate by predicting the next word in a sequence:</p>
              <blockquote>
                <p><strong>Input:</strong> "The cat sat on the"</p>
                <p><strong>Prediction:</strong> "mat"</p>
              </blockquote>
              <p>Repeatedly doing this allows you to generate long paragraphs:</p>
              <blockquote>
                <p><strong>Input:</strong> "The cat sat on the mat"</p>
                <p><strong>Prediction:</strong> ", watching"</p>
                <p>[… many more times]</p>
                <p><strong>Repeated predictions:</strong> “, watching the world outside with lazy indifference. A faint rustling in the bushes caught its attention, ears twitching, but it made no move to investigate. Instead, it stretched luxuriously, kneading the soft fabric beneath its paws, and let out a slow, satisfied purr.”</p>
              </blockquote>
              <p>Predicting the next word produces astonishingly sophisticated behaviour. Models built on this basic mechanism can write complex code, solve maths problems, and create original stories - a leap so dramatic it has surprised even the experts who built them.</p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default FutureOfAiCourseUnit1Page;
