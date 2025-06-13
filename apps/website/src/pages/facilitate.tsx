import {
  HeroSection,
  HeroH1,
  Section,
  Breadcrumbs,
  BluedotRoute,
} from '@bluedot/ui';
import Head from 'next/head';
import { ROUTES } from '../lib/routes';
import TestimonialSubSection from '../components/homepage/CommunitySection/TestimonialSubSection';
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
## Join us as a facilitator to expand the field and support up and coming talent.

_Applications are not currently open for facilitators._

Excellent facilitators are critical for us to deliver a high-quality experience to course participants, and ultimately get more top talent working on the world's most pressing issues.

## What participants had to say about their facilitators`}
        </MarkdownExtendedRenderer>
        <br />
        <TestimonialSubSection testimonials={[
          {
            quote: 'Vojta provided useful insights into how AI systems worked when we were confused-- he was particularly helpful in sharing his technical understanding. I also feel like he had an apt firmness in implementing the structure of the session; he moved us on promptly but naturally if we were pushing on time, which allowed us to get through all the material.',
            name: 'Janvi Ahuja',
            role: 'PhD student at the University of Oxford',
            imageSrc: '/images/facilitate/janvi.jpg',
          },
          {
            quote: 'What James did really well was to add value to the reading materials rather than just repeat them. Our discussions would tease out the complexity of some of the topics really well, and really force us to think and challenge our assumptions.',
            name: "Denis O'Sullivan",
            role: 'Senior Consultant',
            imageSrc: '/images/facilitate/denis.jpg',
          },
          {
            quote: "Dewi was really fantastic and I'm grateful to them for taking the time to facilitate this course. I really learned a lot and I think this will help me do my job more effectively going forward.",
            name: 'Paige Henchen',
            role: 'Chief of Staff at GiveWell',
            imageSrc: '/images/facilitate/paige.jpg',
          },
          {
            quote: 'David was a phenomenal facilitator, he was always on time and well versed in the resources, enriched discussion with important extracurricular insights, moderated and led the activities to *only* productive spaces, and made everyone feel heard. I think he has this natural aptitude for a confident and competence-based leadership/teaching role. I was super impressed with both his intellect, knowledge of the subject and social skills.',
            name: 'Marta Bienkiewicz',
            role: 'Research Fellow at EuroMov',
            imageSrc: '/images/facilitate/marta.jpg',
          },
        ]}
        />
        <MarkdownExtendedRenderer>{`## Why facilitate?

<Collapsible title="Support participants">
You'll be doing hugely valuable and important work. Participants tell us again and again that they really appreciate what facilitators add to our courses, and that facilitation supports them with their learning.

As well as helping people develop the knowledge and skills they need to contribute to the field, you'll also be giving them the confidence that they are at the level where they can start exploring impactful opportunities.

You'll also help participants become much more well rounded learners by encouraging them to think through concepts deeply, debate with others, and consider more points of view.
</Collapsible>

<Collapsible title="Better understand the subject area yourself">
Despite facilitators already being knowledgeable in the subject area, most still end up learning a lot by helping us run the course!

You'll find that participants often bring in new ideas to debates, ask insightful questions that require deep thought, and perform novel research during the project sprint. Facilitators have also often gained new insights by researching questions asked by participants that they couldn't answer immediately.
</Collapsible>

<Collapsible title="Developing leadership, teaching and social skills">
You'll be the voice of the discussion. We'll provide you with resources to prepare for this, including providing facilitator training units before the course starts, and structured guides for running each week's activities (you're not expected to come up with unit plans yourself, although you're welcome to adapt ours to better suit your group!).

Additionally, you'll be engaging with many people who are new to the field. This is a good opportunity to pick up on newcomers' understandings and what people are currently interested in.

Finally, you'll also get lots of experience explaining complex topics. This is great practice for people considering going into policy, where you'll often need to explain things in simple language to non-experts.
</Collapsible>

<Collapsible title="Meet great people">
We'll introduce you to other facilitators, who you might collaborate with or get feedback on your ideas from. We also do work to match participants with appropriate facilitators, so that you are likely to be paired with participants you might consider as future collaborators or colleagues. You'll gain a lot of context on each participant's potential and knowledge, to help inform if you'd like to continue working with them.
</Collapsible>

## What we look for in facilitators

To apply for this role, you must:
* Be familiar with the materials in our curriculum.
* Have previously worked in an area relevant to the course material. You don't need to be currently working in the field.
* Be fluent in English, and have reliable equipment that works well for video calls.

You might be particularly good for this role if you:
* Understand the field beyond our curriculum.
* Have contacts in the field to help participants make further connections.
* Can ask people good questions, explain technical concepts to learners, and moderate productive discussions.
* Have experience using active learning techniques.
* Have previously conducted research in the field.

## What facilitation looks like

Facilitation lasts 14 weeks in total, and the time commitment is about 5 hours per week. It can be done alongside other full-time work or study. Your experience is important to us, and we value your time very highly.

Before the course, you'll have two weeks of pre-course facilitation training. This focuses on facilitation skill, rather than subject knowledge. Each week, this involves 2 hours of independent learning and a 2 hour facilitated group discussion (hosted by the BlueDot team).

The course begins with an icebreaker unit to get to know your group.

During weeks 1 to 8 of the course, you'll be facilitating online group discussion based on the curriculum. We'll give you a step-by-step guide to follow for each unit, to facilitate a fun and engaging experience for you and your participants. You can adapt those plans if you have particular things you want to try with your group. We expect each week will include 2 hours to refresh your knowledge of the curriculum, a 2 hour facilitated group discussion, and 1 hour for other prep, admin or follow-ups.

For the project sprint in weeks 8 to 12, you'll host online check-ins. This is generally more relaxed, with each week including a 1-2 hour facilitated group discussion, and 1 hour for other prep, admin or follow-ups.

At all times we'll be here to support you, and ensure things are going smoothly. We'll invite you to optional facilitator check-ins, have a shared Slack channel for facilitators, and at all times are just a Slack message away!

## Compensation

After the course we will pay you for your support with the course.

Current rates for facilitators are £80 per learning unit of the course and facilitator training, and £60 for icebreaker and project sprint units (due to the lower time requirement). If you facilitate one group, this comes to £1,180:

* 3 facilitator training units (£240)
* 1 icebreaker unit (£60)
* 8 discussion units (£640)
* 4 project sprint units (£240)

If you facilitate more than one group, we'll pay you in line with these rates. This works out as:

* 1 group: £1,180
* 2 groups: £2,120
* 3 groups: £3,060
* 4 groups: £4,000
* 5 groups: £4,940
* 6 groups: £5,880
* 7 groups: £6,820
* 8 groups: £7,760
* 9 groups: £8,700
* 10 groups: £9,640

Based on data from previous facilitators about how much preparation and other work is required, this corresponds to a rate of £27-40/hour (note this is indicative, and all pay will only be via the rates above). The range depends on how familiar you already are with the material, and how many groups you take.

We sometimes disband or re-shuffle groups due to attendance. You may also volunteer to cover other facilitator's group discussions. In either of these cases, we will update your compensation in line with our rates above.

We can pay facilitators in countries supported by [Wise](https://wise.com/help/articles/2571942/what-countriesregions-can-i-send-to) or PayPal UK. This means we are unable to send payments to sanctioned countries.

## How to apply

_Applications are not currently open for facilitators._

#### Any other questions?

We're really keen to hear from people interested in facilitating our courses. If you have any questions please do [contact us](https://bluedot.org/contact)!
`}
        </MarkdownExtendedRenderer>
      </Section>
    </div>
  );
};

export default ContentPage;
