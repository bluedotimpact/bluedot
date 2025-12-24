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
import { TECHNICAL_AI_SAFETY_PROJECT_APPLICATION_URL } from '../components/lander/course-content/TechnicalAiSafetyProjectContent';

const CURRENT_ROUTE: BluedotRoute = {
  title: 'Mentoring our projects',
  url: '/mentor',
  parentPages: [ROUTES.home],
};

const ContentPage = () => {
  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="description" content="Excellent mentors are key to accelerating people into high-impact AI safety work. With the pace of AI development, we want to help people gain the skills and expertise they need as quickly as possible." />
      </Head>
      <HeroSection>
        <HeroH1>{CURRENT_ROUTE.title}</HeroH1>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section className="max-w-3xl">
        <MarkdownExtendedRenderer>{`
Excellent mentors are key to accelerating people into high-impact AI safety work. With the pace of AI development, we want to help people gain the skills and expertise they need as quickly as possible.

As a mentor, you'll be shaping the public artefacts participants use to launch their careers. This requires deep expertise, effective coaching, and commitment to the mission.

## What we look for in mentors

- Have completed and published several AI safety research or engineering projects
- Have experience mentoring others (whether in AI safety or beyond)
- Have enough expertise in AI safety to guide people on which ideas to pursue and how their projects can become stepping stones to impactful work
- Are excited to teach others what you've learned about how to get good at this work
- Care deeply about helping others succeed

## What we're not looking for

- Seeing this as low-effort passive income
- No direct experience in AI safety research or engineering
- Unable to challenge participants or push thinking forward
- Unwilling to proactively follow-up with participants

## What you'll do

**Your mission is to ensure everyone in your group publishes their project by the end of the sprint.** Projects have more impact when they're discovered, so support them in publishing on their blog, Twitter, GitHub and LinkedIn.

**You're their guide.** Participants will have the technical skills but less sense of the landscape. They'll lean on you for what's worth working on, what tools will help, what goals to set, and who to talk to.

**The best mentors ask lots of questions** to help identify the core issue and empower participants to work through it themselves. Here's some actionable [advice on coaching](https://medium.com/@hannahpixels/12-top-takeaways-from-the-coaching-habit-e2ea3028ec34).

**Be proactive in following up.** We have a Slack group set up by default, but we encourage you to experiment with what works best for your group. Some groups find it easier to provide regular updates over Telegram or WhatsApp instead.

**You'll lead a weekly 1-hour group check-in** to keep everyone accountable. The check-ins are also a good opportunity for participants to learn from each other. If attendance drops, talk to your participants about how to make these more valuable, and let us know if it becomes an issue.

## Compensation

We'll pay you **$250 per session**, which works out to $50/hour for approximately 5 hours per session (4 hours individual support + 1 hour check-in).

The Technical AI Safety Project sprint runs for 4 sessions.

We sometimes disband or re-shuffle groups due to attendance. You may also volunteer to cover other mentor's discussions. In either of these cases, we will update your compensation accordingly.

## Payment methods

We can pay mentors in countries supported by [Wise](https://wise.com/help/articles/2571942/what-countriesregions-can-i-send-to) or PayPal UK. This means we are unable to send payments to sanctioned countries.
`}
        </MarkdownExtendedRenderer>
      </Section>

      <Section className="max-w-3xl bg-gray-50 rounded-lg">
        <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-center">Apply to mentor our projects</h2>
        <p className="text-center mb-8 text-size-lg opacity-80">
          Choose the project you'd like to mentor and apply through the application form:
        </p>
        <div>
          <CTALinkOrButton
            url={`${TECHNICAL_AI_SAFETY_PROJECT_APPLICATION_URL}?prefill_%5Ba%5D%20Role=Facilitator`}
            variant="primary"
            className="mx-auto"
          >
            Technical AI Safety Project
          </CTALinkOrButton>
        </div>
        <p className="text-center mt-6 text-size-sm opacity-70">
          More projects coming soon. Check back regularly for updates.
        </p>
      </Section>

      <Section className="max-w-3xl">
        <MarkdownExtendedRenderer>{`
## Any other questions?

We're really keen to hear from people interested in facilitating our courses. If you have any questions please contact [anglilian@bluedot.org](mailto:anglilian@bluedot.org) or reach out at [team@bluedot.org](mailto:team@bluedot.org)!
`}
        </MarkdownExtendedRenderer>
      </Section>
    </div>
  );
};

export default ContentPage;
