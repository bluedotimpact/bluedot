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
  title: 'Course Attendance Policy',
  url: '/attendance-policy',
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
## Course Attendance Policy

We’re thrilled to have you onboard one of our courses. We’ve meticulously crafted the curriculum with experts, recruited awesome facilitators, and selected you – yes, you – as a stand-out applicant to join us.

We’re keen for you to have a brilliant learning experience that equips you to tackle the world’s most pressing problems. Facilitated group discussions are a hugely important part of the learning experience, and both you and your fellow participants will get the most from the course if you engage deeply with the group discussions.

This policy explains our expectations around group discussion attendance to ensure we support each other towards this shared goal.

**1. Preparation 📚**

Before you jump into facilitated group discussions, make sure to complete any mandatory readings and exercises. They’ll help you navigate and engage with group discussions and activities. We don’t want you feeling like you’re trying to solve a Rubik’s Cube in the dark (unless you’re weirdly good at that)!

You should also double-check that your internet connection works and you have the appropriate equipment to attend the online group discussions. Need help? Ask in the logistics questions channel of the community Slack.

**2. Attendance 🕒**

There’s no way around it – you’ve got to be at each group discussion every week. Your presence makes the discussions come alive, and the group activities reach their full potential – both for you and your fellow participants. So, please mark your calendars, set reminders, and make it a habit! Also, we know life can be chaotic, but do your best to plan ahead and switch to a different group discussion if you can’t make your original one.

**3. Absences 🔀**

Life can sometimes be unpredictable. If you can’t make it to your regular discussion, use the switch group link in the Course Hub to join another group that week. Where possible, do this in advance so your facilitators can better plan their group discussions.

If you miss a week, contact your facilitator to catch up on what you missed. They’re there to support you with your learning!

**4. Active participation 🙌**

We’re not looking for spectators; we want you to actively participate in the facilitated group discussions with your full attention. Engage wholeheartedly in discussions, fire away your curious questions, and shower us with your invaluable feedback. You’ll learn more and help your fantastic group peers learn more too!

**5. Enforcement 🧑‍⚖️**

If you miss two consecutive discussions, we’ll consider you inactive and remove you from future group discussions until we hear from you again. This is because we want to ensure that the expected attendees for each group discussion are accurate so each discussion has between 4-8 participants in the discussion.

If you miss four or more group discussions, we will remove you from the course and ask that you reapply for the next round of the course. It will be challenging to catch up with the course material at this stage and detract from potentially productive discussions.

We reserve the right to remove participants from the course who consistently disrupt the learning environment or demonstrate behaviour that negatively impacts their group. This includes repeated instances of being unprepared, disrespecting other participants or facilitators, or otherwise hindering the collaborative learning atmosphere we strive to maintain.

Note that to receive a certificate of completion at the end of the course, you need to attend >80% of the group discussions and submit a project!

If you feel like poor attendance or disruptive behaviour from others in your group is disrupting your learning, please mention this to your facilitator or [our team](mailto:team@bluedot.org).
`}
        </MarkdownExtendedRenderer>
      </Section>
    </div>
  );
};

export default ContentPage;
