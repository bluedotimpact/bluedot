import {
  HeroSection,
  HeroH1,
  Section,
  Breadcrumbs,
  BluedotRoute,
} from '@bluedot/ui';
import Head from 'next/head';
import { ROUTES } from '../lib/routes';
import MarkdownExtendedRenderer from '../components/courses/MarkdownExtendedRenderer';

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
      </Head>
      <HeroSection>
        <HeroH1>{CURRENT_ROUTE.title}</HeroH1>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section className="max-w-3xl">
        <MarkdownExtendedRenderer>{`
## Join us as a facilitator to expand the field and support up-and-coming talent.

_Applications are open and can be accessed via designated course application pages._

Excellent facilitators are critical for us to deliver a high-quality experience to course participants, and ultimately get more top talent working on the world's most pressing issues.

## What we look for in facilitators

This isn't just facilitation — you're identifying and developing the talent that will determine whether humanity successfully navigates AGI. This requires a rare combination of deep expertise, pedagogical excellence, and commitment to the mission.

### Core Requirements

**1. Deep Domain Expertise**
* Knowledge in AI safety/governance that goes well beyond our curriculum
* Experience doing relevant things (research, fieldbuilding, governance)
* The ambition and ability to challenge and guide participants who may themselves become leaders in the field

**2. Discussion Leadership, Not Lecturing**
* Masters of the Socratic method — you ask penetrating questions and inspire rather than deliver content
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

* Public writing on AI safety/governance
* Experience at AI labs, policy organizations, AI safety institutes or fellowships
* Track record of mentoring or teaching complex topics
* Active in AI safety community with strong network
* Other people ask for your takes or recommendations
* Growth mindset — you're excited to develop your skills with our support

### What Doesn't Work

* Sees this as "just facilitation" or low-effort passive income
* Prefers lecture-style teaching over discussion
* No direct experience in AI safety/governance
* Unable to challenge participants or push thinking forward
* Treats this as low-stakes side gig rather than the high-impact role it is

The right candidates see these positions as either:
* A way to multiply their existing impact (adjuncts)
* A complementary path to their research (fellow-researchers)
* A high-leverage, high-impact career move (dedicated educators)

## Compensation

Facilitators are paid at a rate of $50/hour. For one cohort, we expect approximately 30 hours of commitment, totaling $1,500. This includes:

* Pre-course facilitation training
* Icebreaker unit
* Weekly discussion sessions (units 1-8)
* Project sprint check-ins
* Preparation, admin, and follow-ups

If you facilitate more than one group, we'll pay you at the same hourly rate for the additional time commitment.

We sometimes disband or re-shuffle groups due to attendance. You may also volunteer to cover other facilitator's group discussions. In either of these cases, we will update your compensation accordingly.

We can pay facilitators in countries supported by [Wise](https://wise.com/help/articles/2571942/what-countriesregions-can-i-send-to) or PayPal UK. This means we are unable to send payments to sanctioned countries.

## How to apply

_Applications are open and can be accessed via designated course application pages._

#### Any other questions?

We're really keen to hear from people interested in facilitating our courses. If you have any questions please contact [joshua@bluedot.org](mailto:joshua@bluedot.org) or reach out via our [contact page](https://bluedot.org/contact)!
`}
        </MarkdownExtendedRenderer>
      </Section>
    </div>
  );
};

export default ContentPage;
