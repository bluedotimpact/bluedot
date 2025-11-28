import {
  HeroSection,
  HeroH1,
  Section,
  Breadcrumbs,
  BluedotRoute,
  CTALinkOrButton,
} from '@bluedot/ui';
import Head from 'next/head';
import { ROUTES } from '../lib/routes';
import MarkdownExtendedRenderer from '../components/courses/MarkdownExtendedRenderer';
import { AGI_STRATEGY_APPLICATION_URL } from '../components/lander/course-content/AgiStrategyContent';
import { BIOSECURITY_APPLICATION_URL } from '../components/lander/course-content/BioSecurityContent';
import { TECHNICAL_AI_SAFETY_APPLICATION_URL } from '../components/lander/course-content/TechnicalAiSafetyContent';

const CURRENT_ROUTE: BluedotRoute = {
  title: 'Facilitating our courses',
  url: '/facilitate',
  parentPages: [ROUTES.home],
};

const ContentPage = () => {
  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="description" content="Join us as a facilitator to expand the field and support up-and-coming talent. Excellent facilitators are critical for us to deliver a high-quality experience to course participants." />
      </Head>
      <HeroSection>
        <HeroH1>{CURRENT_ROUTE.title}</HeroH1>
        <p className="text-center text-size-lg md:text-xl opacity-80 mt-6 max-w-3xl mx-auto">
          Join us as a facilitator to expand the field and support up-and-coming talent.
        </p>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section className="max-w-3xl">
        <MarkdownExtendedRenderer>{`
Excellent facilitators are critical for us to deliver a high-quality experience to course participants, and ultimately get more top talent working on the world's most pressing issues.

## What we look for in facilitators

As a facilitator you will be identifying and developing the talent that will determine whether humanity successfully navigates AGI. This requires a rare combination of deep expertise, pedagogical excellence, and commitment to the mission.

### Core Requirements

**1. Deep Domain Expertise**
* Knowledge in AI safety/governance, Biosecurity that goes well beyond our curriculum
* Experience doing relevant things (research, fieldbuilding, governance)
* The ambition and ability to challenge and guide participants who may themselves become leaders in the field

**2. Discussion Leadership, Not Lecturing**
* Masters of the Socratic method — you ask penetrating questions, uncover insights, and inspire rather than deliver content
* Ability to foster productive debate and peer-to-peer learning
* Real-time adaptability to participant needs
* Creating intimate, high-engagement environments (6-10 person cohorts)

**3. Mission-Driven, Impact First**
* Understanding that this is about building and directing talent for a better future
* Seeing this as a high-leverage way to shape AI's trajectory
* Motivated by the fact that participants will go on to shape AI policy, lead safety research, or found new organizations

**4. Career Catalyst, Talent Scout**
* Ability to accelerate participants into opportunities beyond the course
* 1:1 mentorship, scouting for top talent, good taste

### Strong Signals We Look For

* Public writing on AI safety/governance or Biosecurity
* Experience at relevant organizations or fellowships
* Track record of mentoring or teaching complex topics
* Active in the AI safety or Biosecurity community with strong network
* Other people ask for your takes or recommendations
* Growth mindset — you're excited to further develop your skills with our support

### What Doesn't Work

* Sees this as "just facilitation" or low-effort passive income
* Prefers lecture-style teaching over discussion
* No direct experience in AI safety/governance
* Unable to challenge participants or push thinking forward

The right candidates see these positions as either:
* A way to multiply their existing impact (adjuncts)
* A complementary path to their research (fellow-researchers)
* A high-leverage, high-impact career move (dedicated educators)

## Compensation

We pay **$250 per session**, which works out to **$50/hour** for approximately 5 hours per session (3 hours preparation + 2 hours discussion).

If you are facilitating more than 1 group, we will pay $150 per session for every additional group, given the reduced time required to prepare for each session.

### What counts as a session?

A "session" includes both:
* **Preparation time** – reviewing materials, exercise responses and preparing activities
* **Discussion time** – the actual facilitated group discussion with participants

The AGI Strategy course runs for 5 sessions, while the Technical AI Safety and Biosecurity courses run for 6 sessions.

### Additional compensation

We also pay for **1:1 mentoring and talent development activities** at the value of 1 session ($250). This recognizes the high-leverage impact of individualized support in helping participants launch careers in AI safety.

If you facilitate more than one group, we'll pay you at the same rate for the additional time commitment.

We sometimes disband or re-shuffle groups due to attendance. You may also volunteer to cover other facilitator's group discussions. In either of these cases, we will update your compensation accordingly.

### Payment methods

We can pay facilitators in countries supported by [Wise](https://wise.com/help/articles/2571942/what-countriesregions-can-i-send-to) or PayPal UK. This means we are unable to send payments to sanctioned countries.
`}
        </MarkdownExtendedRenderer>
      </Section>

      <Section className="max-w-3xl bg-gray-50 rounded-lg">
        <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-center">Apply to facilitate a course</h2>
        <p className="text-center mb-8 text-size-lg opacity-80">
          Choose the course you'd like to facilitate and apply through the application form:
        </p>
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <CTALinkOrButton
            url={AGI_STRATEGY_APPLICATION_URL}
            variant="primary"
            className="w-full text-center"
          >
            AGI Strategy
          </CTALinkOrButton>
          <CTALinkOrButton
            url={BIOSECURITY_APPLICATION_URL}
            variant="primary"
            className="w-full text-center"
          >
            Biosecurity
          </CTALinkOrButton>
          <CTALinkOrButton
            url={TECHNICAL_AI_SAFETY_APPLICATION_URL}
            variant="primary"
            className="w-full text-center"
          >
            Technical AI Safety
          </CTALinkOrButton>
        </div>
        <p className="text-center mt-6 text-size-sm opacity-70">
          More courses coming soon. Check back regularly for updates.
        </p>
      </Section>

      <Section className="max-w-3xl">
        <MarkdownExtendedRenderer>{`
## Any other questions?

We're really keen to hear from people interested in facilitating our courses. If you have any questions please contact [joshua@bluedot.org](mailto:joshua@bluedot.org) or reach out via our [contact page](https://bluedot.org/contact)!
`}
        </MarkdownExtendedRenderer>
      </Section>
    </div>
  );
};

export default ContentPage;
