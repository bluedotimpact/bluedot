// TODO: Remove this file once the 301 redirect to /join-us is live
import {
  CTALinkOrButton,
  HeroSection,
  HeroH1,
  HeroH2,
  HeroCTAContainer,
  Section,
  Breadcrumbs,
  BluedotRoute,
} from '@bluedot/ui';
import Head from 'next/head';
import { ROUTES } from '../../lib/routes';

export const CURRENT_ROUTE: BluedotRoute = {
  title: 'AI Safety Teaching Fellow',
  url: `${ROUTES.joinUs.url}/ai-safety-teaching-fellow`,
  parentPages: [...(ROUTES.joinUs.parentPages ?? []), ROUTES.joinUs],
};

const JobPostingPage = () => {
  return (
    <div>
      <Head>
        <title>{CURRENT_ROUTE.title} | BlueDot Impact</title>
        <meta name="canonical" content="https://bluedot.org/join-us/ai-safety-teaching-fellow" />
      </Head>
      <HeroSection>
        <HeroH1>{CURRENT_ROUTE.title}</HeroH1>
        <HeroH2>Lead expert discussions on AI safety</HeroH2>
        <HeroCTAContainer>
          <CTALinkOrButton url="https://forms.bluedot.org/D2vOoKG53VRR4HIedgcz?prefill_Role=recUVhfgJJRZVAQDw">Express interest</CTALinkOrButton>
        </HeroCTAContainer>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      <Section className="prose">
        <h2>Who we are</h2>
        <p>We're a non-profit that runs courses on some of the world's most pressing problems. We're looking for Teaching Fellows to guide discussions with students on our 5-day AI safety courses.</p>
        <p>We currently run the world's largest courses on AI Safety, with a graduate community of over 2,000 individuals working in all the major AI companies, top universities and governments. The course is widely regarded as the go-to location to learn about AI Alignment, and the <a href="https://aisafetyfundamentals.com/">AI Safety Fundamentals website</a> has over 10,000 unique visitors each month.</p>
        <p>You can learn more about BlueDot Impact on <a href="https://bluedot.org/">our website</a>.</p>
        <h2>What you'll do</h2>
        <p>Teaching Fellows will host daily discussions with groups of 5-8 participants for our 5-day AI safety courses:</p>
        <ul>
          <li><a href="https://aisafetyfundamentals.com/intro-to-tai/">Intro to Transformative AI</a></li>
          <li><a href="https://aisafetyfundamentals.com/alignment-fast-track/">AI Alignment Fast-Track</a></li>
          <li><a href="https://aisafetyfundamentals.com/governance-fast-track/">AI Governance Fast-Track</a></li>
          <li><a href="https://aisafetyfundamentals.com/writing">Writing Intensive</a></li>
        </ul>
        <p>We'll support you with <a href="https://docs.google.com/document/d/1w4TBy6noogqGSQnMAnQePY7NnHMmZKW4Dv5eTNlrMb8/edit?tab=t.0#heading=h.hqxsrinp22x8">discussion docs</a>. You'll also gain access to a private Slack channel with other facilitators and the course lead to ask for help and give us feedback.</p>
        <p>Each discussion runs for 1-2 hours, depending on the course. We'll arrange discussion times between Monday to Friday at times that fit with both your and our participant's availability. This is highly flexible, as we have demand at almost all times (including any time of day or night). The times will change week-to-week depending on participants' availability.</p>
        <p>If the initial weeks go well, we'd be open to making this a longer-term role. We aim to run our courses back-to-back, meaning this could be a year-round position.</p>
        <h2>Location and compensation</h2>
        <p>This position is fully remote, and we accept applications from anywhere in the world.</p>
        <p>Compensation is based on the number of discussions you facilitate. For each week:</p>
        <table className="border-collapse my-4">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">Number of groups</th>
              <th className="border border-gray-300 px-4 py-2">Total pay</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2">1</td>
              <td className="border border-gray-300 px-4 py-2">£400</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">2</td>
              <td className="border border-gray-300 px-4 py-2">£800</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">3</td>
              <td className="border border-gray-300 px-4 py-2">£1,200</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">4</td>
              <td className="border border-gray-300 px-4 py-2">£1,600</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">5</td>
              <td className="border border-gray-300 px-4 py-2">£2,000</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-2">6</td>
              <td className="border border-gray-300 px-4 py-2">£2,400</td>
            </tr>
          </tbody>
        </table>
        <p>Based on data from previous Teaching Fellows about how much preparation and other work is required, this corresponds to a rate of £27-40/hour (note this is indicative, and actual pay will be via fixed unit rates). The range depends on how familiar you already are with the material, and how many groups you take.</p>
        <p>We sometimes disband or re-shuffle groups due to attendance. You may also volunteer to cover other facilitator's group discussions. In either of these cases, we will update your compensation in line with our standard facilitator rates.</p>
        <h2>About you</h2>
        <p>We are looking for someone who is passionate about supporting highly motivated and excellent participants contribute to AI safety.</p>
        <p>To apply for this role, you must:</p>
        <ul>
          <li>Be familiar with the materials in our <a href="https://course.aisafetyfundamentals.com/intro-to-tai">curriculum</a>.</li>
          <li>Have previously worked in an area relevant to the course material (e.g. ML research, public policy, corporate governance, etc). You don't need to be currently working in the field.</li>
          <li>Be fluent in English, and have reliable equipment that works well for video calls.</li>
          <li>Be able to ask people good questions, explain technical concepts to learners, and moderate productive discussions.</li>
        </ul>
        <p>You might be particularly good for this role if you:</p>
        <ul>
          <li>Understand the AI safety field beyond our curriculum.</li>
          <li>Have contacts in the field to help participants make further connections.</li>
          <li>Have experience using active learning techniques.</li>
          <li>Have previously conducted research on AI safety.</li>
        </ul>
        <h2>Express interest in this role</h2>
        <p>We are reviewing applications on a rolling basis and will reach out for follow-up information as necessary.</p>
        <div className="not-prose my-8">
          <CTALinkOrButton url="https://forms.bluedot.org/D2vOoKG53VRR4HIedgcz?prefill_Role=recUVhfgJJRZVAQDw">Express interest</CTALinkOrButton>
        </div>
      </Section>
    </div>
  );
};

export default JobPostingPage;
