import {
  HeroSection,
  HeroH1,
  Section,
  Breadcrumbs,
  type BluedotRoute,
} from '@bluedot/ui';
import Head from 'next/head';
import { ROUTES } from '../lib/routes';
import MarkdownExtendedRenderer from '../components/courses/MarkdownExtendedRenderer';

const CURRENT_ROUTE: BluedotRoute = {
  title: 'AI Safety Fundamentals Community',
  url: '/our-community',
  parentPages: [ROUTES.home],
};

const ContentPage = () => {
  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      </Head>
      <HeroSection>
        <HeroH1>{CURRENT_ROUTE.title}</HeroH1>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section className="max-w-3xl">
        <MarkdownExtendedRenderer>{`
When you participate in or facilitate our courses, you'll also be gaining access to our AI Safety Fundamentals Community.

We curate the community to admit people with relevant skills and backgrounds to contribute to AI safety.

### What does community membership offer?

**We make it easy to find who you're looking for.** You can search through a directory of current and previous course participants who have opted-in to being contacted by members of the community. You're encouraged to reach out to course participants and alumni to find the advice or expertise you need on our AI Safety Connect platform.

**You can answer your questions, hear about new opportunities, and engage in discussion** about AI safety with a curated, active community even after the course ends. Years of running our courses have resulted in a community platform with hundreds of community members selected to care about AI safety. You can start discussions, read previous entries, hear about job and internship opportunities, and organise whatever you can think of on our Slack workspace.

**We facilitate connections between you and other community members.** We'll run a series of Q&A sessions, networking and speaker sessions. By participating in these community-based activities, you'll get to continually discover new people and opportunities. These events are open to all members of the community, including current and previous course participants.

### Who joins our community?

Safely navigating a transition to advanced artificial intelligence will require shared context and coordination between people with a range of skills and backgrounds. We thus invite members in both our technical and governance courses in addition to strong external contributors to our shared community platforms.

We will continue to ensure our community is a space for you and other members to find project collaborators, mentees, mentors, and support in their plans to contribute to AI safety.`}
        </MarkdownExtendedRenderer>
      </Section>
    </div>
  );
};

export default ContentPage;
