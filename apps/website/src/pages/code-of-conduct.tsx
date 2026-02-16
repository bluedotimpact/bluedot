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
  title: 'Code of Conduct',
  url: '/code-of-conduct',
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
We want everyone on this course to be able to focus their full attention on having good conversations, getting to know people, learning interesting things, and generally having fun.

Accordingly, all course participants are expected to show respect and courtesy to each other in all interactions, whether in person or online.

By participating in this course, you agree to abide by the following code of conduct.

## Conversation Norms

- **Be kind.**
  - Stay civil, at the minimum. Don't sneer or be snarky. In general, assume good faith. We may delete unnecessary rudeness and issue warnings or bans for it.
  - Substantive disagreements are fine and expected. Disagreements help us find the truth and are part of healthy communication.

- **Stay on topic.**
  - No spam. Each channel in this Slack workspace has a clearly defined topic to help keep conversation focused and productive. Please endeavour to stick to these and keep conversations in the appropriate channels.
  - Don't derail conversations in irrelevant directions.

- **Be honest.**
  - Don't mislead or manipulate.
  - Communicate your uncertainty and the true reasons behind your beliefs as much as you can.
  - Be willing to change your mind.

## Unacceptable Behaviour

The following types of behaviour are unacceptable during course events and discussions, and constitute code of conduct violations.

### Abusive behaviour

- **Harassment** – this includes offensive verbal comments related to gender, sexual orientation, disability, physical appearance, body size, race, or religion, as well as sexual images in public spaces, deliberate intimidation, stalking, following, harassing photography or recording, inappropriate physical contact, and unwelcome sexual or romantic attention.
- **Threats** – threatening someone physically or verbally. For example, threatening to publicize sensitive information about someone's personal life.

### Unwelcoming and inappropriate behaviour

- **Blatant -isms**—saying things that are explicitly racist, sexist, homophobic, etc. For example, arguing that some people are less intelligent because of their gender, race or religion. Subtle -isms and small mistakes made in conversation are not code of conduct violations. However, repeating something after you have been asked to stop, it has been pointed out to you that you broke a social rule, or antagonizing or arguing with someone who has pointed out your subtle -ism is considered unwelcoming behavior, would be considered violations.
- **Maliciousness towards other participants** —deliberately attempting to make others feel bad, name-calling, singling out others for derision or exclusion. For example, telling someone they're not good enough to be on the programme, etc.

## Reporting

If you see a violation of our code of conduct, please report it by [contacting us](mailto:team@bluedot.org), to a facilitator, or to someone you trust who can inform us on your behalf.

## Credits

This Code of Conduct is heavily based on that provided by [the Recurse Center](https://www.recurse.com/code-of-conduct).`}
        </MarkdownExtendedRenderer>
      </Section>
    </div>
  );
};

export default ContentPage;
