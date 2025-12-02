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
  title: 'Running versions of our courses',
  url: '/running-versions-of-our-courses',
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
## Running versions of our courses

_To take part in our facilitated courses instead, see the courses linked on [our homepage](https://bluedot.org/)._

_Let us know how you're using our courses [here](https://web.mini.extensions.com/UdXLJKhY463CAI0Th2cj), so we can potentially offer more support in the future._

We’re thrilled you’re excited to run an independent version of our course! This page sets out guidance for branding your course, as well as explains what support we can offer local groups.

It's great when friends, workplace groups, student societies and other local organizations run versions of our courses. This helps further our mission of accelerating driven individuals to develop the knowledge, skills and connections needed to have a significant positive impact.

To support this, you can share and adapt our course materials including resource lists, exercises, sample answers and discussion docs, provided that you:

* **Brand it distinctly:** Market the course in a way that it’s clear who’s running the course. Don’t use our names like "AI Safety Fundamentals" or "BlueDot Impact" in a way that could confuse people as to who is offering the course.
* **Give appropriate credit:** When presenting these materials, please give credit to the source, for example "AI Safety Fundamentals" or "BlueDot Impact".
* **Don’t hold us liable for errors:** While we try our best to ensure the accuracy and relevancy of our course materials, they’re provided solely on an “as is” basis, without warranty of any kind.

Note that we don’t own many of linked-to resources themselves, so you might need permission from their original owners if you want to copy or translate them.

### Example

Here’s an example of how you might market your course, following the guidelines above:

> Calling all students interested in the future of AI safety and alignment!
>
> 🤖 The Greendale Community College AI Society is excited to be hosting a AI alignment course this semester, based on the popular AI Safety Fundamentals courses developed by BlueDot Impact.
>
> We’ll be following [their curriculum](https://bluedot.org/courses/alignment). You should do the readings and exercises beforehand, and then each week we’ll host a facilitated group discussion adapted for our university setting.
>
> The discussions will run every Wednesday from 6-8pm in Group Study Room F starting on 17 September. To join the seminar series, RSVP at https://greendale.edu/ai-soc/ai-alignment.
>
> If you have any other questions, email ai.soc@greendale.edu. Looking forward to some fascinating discussions! 🙂

Examples of things that would not be okay:

*   "GCC AI Society is launching a round of the AI Safety Fundamentals course".
*   "We're running the AI Safety Fundamentals course in Greendale, Colorado".
*   "Apply to AI Safety Fundamentals", linking to your version of the course.
*   "Run in collaboration with BlueDot Impact", unless we've explicitly agreed this.
*   Issuing certificates "for completing the AI Safety Fundamentals course". But it's fine to issue certificates "for completing GCC AI Society's AI Alignment course, based on the AI Safety Fundamentals curriculum".

This similarly applies to the names AISF, AGISF, AGI Safety Fundamentals, Biosecurity Fundamentals. We're fine with people using the generic course names: AI alignment, AI governance, and pandemics.

### FAQs

**Can local groups get copies of the discussion docs?**

Yes! These are linked on the individual course webpages.

**Can local groups use BlueDot’s infrastructure for running courses?**

Yes, almost all our software and corresponding documentation is available [on GitHub](https://github.com/bluedotimpact/). You can raise issues there if you get stuck. We aren't currently able to provide hosted versions of our software, or technical support beyond this. Local groups are also welcome to direct users to our course hub to help learners track their own reading completions and exercises.

**Can we use your facilitator training program?**

Yes! The resources and exercises for our facilitator training course are [available online](https://bluedot.org/courses/facilitator-training) for self-study.

**I’m planning to run a local group / previously participated in a local group run version. Could I join the BlueDot facilitated course?**

Yes, please apply in the normal way and mention this in your application. Note that this does not guarantee you a place on our course.

If you have any other questions, feel free to [contact us](https://bluedot.org/contact)!
`}
        </MarkdownExtendedRenderer>
      </Section>
    </div>
  );
};

export default ContentPage;
