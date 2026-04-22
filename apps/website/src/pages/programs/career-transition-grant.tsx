import {
  P,
  type BluedotRoute,
} from '@bluedot/ui';
import Head from 'next/head';
import {
  PiHandshake,
  PiCompass,
  PiUsersThree,
} from 'react-icons/pi';
import { Nav } from '../../components/Nav/Nav';
import GrantPageSection from '../../components/grants/GrantPageSection';
import GrantProgramHero from '../../components/grants/GrantProgramHero';
import GrantProgramViewTransitions from '../../components/grants/GrantProgramViewTransitions';
import { CAREER_TRANSITION_GRANT_APPLICATION_URL } from '../../components/grants/grantPrograms';
import FAQSection from '../../components/lander/components/FAQSection';
import LandingBanner from '../../components/lander/components/LandingBanner';

const CURRENT_ROUTE: BluedotRoute = {
  title: 'Career Transition Grant',
  url: '/programs/career-transition-grant',
};

const SUPPORT_CARDS = [
  {
    icon: PiHandshake,
    title: 'Introductions',
    description: 'Warm intros to relevant people in the field so you can talk to the right people faster.',
  },
  {
    icon: PiCompass,
    title: 'Advising',
    description: 'Regular check-ins with your BlueDot point of contact to pressure-test your thinking and unblock you.',
  },
  {
    icon: PiUsersThree,
    title: 'Community',
    description: 'Connection to others making similar transitions so you are not figuring this out alone.',
  },
];

const TIMELINE_STEPS = [
  {
    label: 'Start',
    title: 'Full-time commitment',
    body: 'This is not something to do alongside a full or part-time role.',
  },
  {
    label: 'Weekly',
    title: 'Progress updates',
    body: 'Short async updates on what you did, who you talked to, what you learned, and how your thinking is evolving.',
  },
  {
    label: 'Every 3 months',
    title: 'Formal check-in',
    body: 'A more structured conversation to review progress and discuss what support you need.',
  },
  {
    label: 'End',
    title: 'End-of-grant report',
    body: 'A short (1-2 page) summary of what you achieved during the grant and what you will be doing next.',
  },
];

const SUBMISSION_PROMPTS = [
  {
    title: 'Your plans for the grant period',
    body: 'A rough plan for how you would spend your time. Think about this as an active process: talking to people in the field, testing ideas, trying short projects, applying to roles or fellowships. Not six months alone with a laptop.',
  },
  {
    title: 'How much you would need and for how long',
    body: 'Propose a budget and duration that would let you fully commit, including any other resources you might need to support your transition.',
  },
  {
    title: 'How you are thinking about your path into AI safety',
    body: 'You have skills and experiences that are valuable. Lean into them. What is your instinct for where you could contribute? What are you most uncertain about, and how would you use the grant period to resolve those uncertainties?',
  },
  {
    title: 'Why you',
    body: 'A few concrete things you have already done that show you will make good use of this grant (e.g. past projects, relevant experience).',
  },
  {
    title: 'Your current situation',
    body: 'What are you doing now, and what is your timeline for going full-time?',
  },
];

const FAQ_ITEMS = [
  {
    id: 'eligibility',
    question: 'Who is eligible?',
    answer: 'BlueDot course participants, alumni, facilitators, and active community members. If you are in our network and doing excellent work on AI safety, you are likely eligible.',
  },
  {
    id: 'uncertain',
    question: 'I am not sure I have it all figured out. Should I still apply?',
    answer: 'Yes. We do not expect you to have it all figured out. We would rather see a clear-eyed account of what you do not know and a plan for finding out.',
  },
  {
    id: 'circumstances-change',
    question: 'What if I secure a full-time role or my circumstances change during the grant?',
    answer: 'Please let us know. Any remaining funds would be returned to BlueDot.',
  },
];

const CareerTransitionGrantPage = () => {
  return (
    <div className="bg-white">
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="Funding and support for exceptional BlueDot community members ready to work full-time on AI safety."
        />
      </Head>

      <Nav />
      <GrantProgramViewTransitions />

      <GrantProgramHero
        slug="career-transition-grant"
        title="Career Transition Grants"
        description="Funding and support for exceptional people to work full-time on AI safety."
        status="Active"
        primaryCta={{ text: 'Apply now', url: CAREER_TRANSITION_GRANT_APPLICATION_URL }}
      />

      <GrantPageSection title="What this program is for">
        <div className="max-w-[760px] flex flex-col gap-5">
          <P>
            BlueDot&apos;s career transition grant supports exceptional people to work full-time on impactful AI safety work. The grant enables you to fully focus on upskilling, exploring opportunities, building your network, and figuring out where you can have the most impact.
          </P>
          <P>Alongside funding, you also get:</P>
        </div>

        <div className="pt-6 min-[680px]:pt-8 grid gap-8 grid-cols-1 md:grid-cols-3">
          {SUPPORT_CARDS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-5">
              <div
                className="size-14 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#ECF0FF' }}
              >
                <Icon className="text-bluedot-navy" size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-[18px] font-semibold leading-tight text-bluedot-navy">
                  {title}
                </h3>
                <P className="text-size-sm leading-[1.6] text-bluedot-navy/80">
                  {description}
                </P>
              </div>
            </div>
          ))}
        </div>
      </GrantPageSection>

      <GrantPageSection title="What we expect from you">
        <div className="max-w-[1120px]">
          <div className="relative">
            <div className="hidden md:block absolute top-5 left-0 right-0 h-px bg-bluedot-navy/15" aria-hidden="true" />
            <ol className="grid gap-8 md:gap-6 grid-cols-1 md:grid-cols-4">
              {TIMELINE_STEPS.map((step, index) => (
                <li key={step.title} className="relative flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="relative z-10 flex items-center justify-center size-10 rounded-full bg-white border border-bluedot-navy/15 text-[13px] font-semibold text-bluedot-navy"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-bluedot-normal">
                      {step.label}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-[18px] min-[680px]:text-[20px] font-semibold text-bluedot-navy">
                      {step.title}
                    </h3>
                    <P className="text-size-sm leading-[1.6] text-bluedot-navy/80">
                      {step.body}
                    </P>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-10 max-w-[760px] rounded-[12px] border border-bluedot-navy/10 bg-color-canvas px-6 py-5">
            <P className="text-size-sm text-bluedot-navy/80">
              <strong className="text-bluedot-navy">If things change,</strong>
              {' '}let us know. If you no longer need the grant before the end of the grant period (e.g. you secure a full-time role or your circumstances change), any remaining funds would be returned to BlueDot.
            </P>
          </div>
        </div>
      </GrantPageSection>

      <GrantPageSection title="What to submit">
        <div className="max-w-[760px] flex flex-col gap-5">
          <P>
            Put together a 1-2 page Google Doc covering the five prompts below. Be honest about uncertainties and keep it concise &mdash; clear writing is a sign of clear thinking.
          </P>
        </div>

        <div className="pt-6 min-[680px]:pt-8 grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {SUBMISSION_PROMPTS.map((item, index) => (
            <div
              key={item.title}
              className="relative rounded-[8px] border border-bluedot-navy/10 bg-white px-6 py-6 flex flex-col gap-4"
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-bluedot-navy/38">
                {String(index + 1).padStart(2, '0')}
              </p>
              <h3 className="text-[18px] min-[680px]:text-[20px] font-semibold leading-tight text-bluedot-navy">
                {item.title}
              </h3>
              <P className="text-size-sm leading-[1.7] text-bluedot-navy/75">
                {item.body}
              </P>
            </div>
          ))}
        </div>

        <div className="mt-10 max-w-[760px] flex flex-col gap-4 rounded-[16px] border border-bluedot-navy/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,248,254,1)_100%)] px-6 py-6">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-bluedot-navy/70">
            Tips
          </h3>
          <div className="flex flex-col gap-4">
            <P>
              <strong>Be honest about your uncertainties.</strong> We do not expect you to have it all figured out. We would rather see a clear-eyed account of what you do not know and a plan for finding out.
            </P>
            <P>
              <strong>Keep it concise.</strong> Clear writing is a sign of clear thinking. A few well-reasoned pages is better than a long document.
            </P>
          </div>
        </div>

        <div className="mt-8 max-w-[760px]">
          <P>
            Once you submit, we review it and schedule a call to discuss next steps. If we need more information, we book a call within a week. Once approved, we set up the grant in a few days so you can start right away.
          </P>
          <P className="mt-4">
            Questions? Reach out to{' '}
            <a
              href="mailto:anglilian@bluedot.org"
              className="font-medium text-bluedot-navy underline underline-offset-4"
            >
              anglilian@bluedot.org
            </a>
            .
          </P>
        </div>
      </GrantPageSection>

      <FAQSection
        id="career-transition-grant-faq"
        title="Frequently asked questions"
        items={FAQ_ITEMS}
      />

      <LandingBanner
        title="Ready to go full-time on AI safety?"
        ctaText="Apply now"
        ctaUrl={CAREER_TRANSITION_GRANT_APPLICATION_URL}
        imageSrc="/images/courses/courses-gradient.webp"
        imageAlt="Career Transition Grant banner"
        iconSrc="/images/logo/BlueDot_Impact_Icon_White.svg"
        iconAlt="BlueDot icon"
        noiseImageSrc="/images/agi-strategy/noise.webp"
      />
    </div>
  );
};

export default CareerTransitionGrantPage;
