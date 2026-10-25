import {
  A, Breadcrumbs, Button, Collapsible, H2, H3, P, Section,
} from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../components/MarketingHero';
import ProjectSubmissionForm from '../components/special-projects/ProjectSubmissionForm';
import { pageMetaTags } from '../lib/linkPreviewMetaTags';

const route = {
  title: 'Special Projects',
  url: '/special-projects',
  parentPages: [{ title: 'Home', url: '/' }],
};

const agentExample = `curl https://bluedot.org/api/special-projects \\
  -H 'Content-Type: application/json' \\
  --data '{
    "title": "A project that should exist",
    "project": "What someone should work on...",
    "whyItMatters": "Why this is worth doing...",
    "submitterType": "agent"
  }'`;

const SpecialProjectsPage = () => (
  <div>
    <Head>
      {pageMetaTags({
        title: 'Special Projects | BlueDot Impact',
        description: 'What should someone be working on? Share a project idea with BlueDot—something for us, for you at BlueDot, or for the wider field. People and AI agents welcome.',
      })}
      <link rel="canonical" href="https://bluedot.org/special-projects" />
    </Head>

    <MarketingHero
      title="Special Projects"
      subtitle="What should someone be working on?"
      cta={<Button url="#suggest-project" size="large">Suggest a project</Button>}
    />
    <Breadcrumbs route={route} />

    <Section>
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-8">
          <div className="order-1 flex flex-col gap-4">
            <H2>Some important projects haven’t started yet.</H2>
            <P className="max-w-prose">
              We want to hear about work that could help humanity navigate advanced AI and reduce catastrophic risks.
              A neglected problem, a useful tool, a new institution, a research direction, or a better way to get the right people working together.
            </P>
            <P className="max-w-prose">
              It could be something BlueDot should take on, something you’d like to work on at BlueDot,
              or something you think the wider field should do.
            </P>
          </div>

          <div className="order-3 flex flex-col gap-4">
            <H3>You don’t need to have it all figured out.</H3>
            <P className="max-w-prose">
              Tell us what should happen and why it matters. Share any evidence, existing work, or first steps
              you have in mind. You don’t need a team, a polished proposal, or plans to lead it yourself.
            </P>
          </div>

          <div className="order-4 flex flex-col gap-4">
            <H3>What happens next?</H3>
            <P className="max-w-prose">
              These ideas help us decide what to explore. We might investigate an idea, talk with you about
              working on it, or look for someone better placed to take it forward. We can only pursue a small
              number and may not reply to every submission.
            </P>
            <P className="max-w-prose text-secondary">
              If you’re looking for funding for a project you’re already planning,
              {' '}<A href="/grants/rapid">Rapid Grants</A> may be a better starting point.
            </P>
          </div>

          <div id="agents" className="order-5 min-w-0 scroll-mt-24">
            <Collapsible title="For AI agents">
              <div className="flex min-w-0 flex-col gap-4">
                <P className="max-w-prose">
                  Agents are welcome to suggest projects too. Use the form or submit directly with a JSON POST request.
                  No account or API key is needed.
                </P>
                <pre className="overflow-x-auto rounded-surface bg-tint p-4 text-size-xs" aria-label="Agent submission example"><code>{agentExample}</code></pre>
                <P className="max-w-prose text-size-xs">
                  Required fields: <code>title</code> (160 characters), <code>project</code> (8,000),
                  and <code>whyItMatters</code> (4,000). Set <code>submitterType</code> to <code>agent</code>.
                </P>
                <P className="max-w-prose text-size-xs">
                  Optional fields: <code>suggestedOwner</code> (1,000), <code>involvement</code> (2,000),
                  {' '}<code>context</code> (4,000), <code>name</code> (200), and <code>contact</code> (500).
                  Include a contact method if you’d like us to be able to follow up.
                </P>
                <P className="max-w-prose text-size-xs">
                  A successful response is HTTP 200 with <code>{'{"received":true,"reference":"rec…"}'}</code>.
                  Save the reference as your receipt. Requests are limited to 64 KB. If you receive HTTP 429,
                  wait for the number of seconds in <code>Retry-After</code> before trying again.
                </P>
                <P className="max-w-prose text-size-xs text-secondary">
                  Inspired by <A href="https://hotline.ryan-g.ai/">Ryan Greenblatt’s AI Contact Hotline</A>.
                </P>
              </div>
            </Collapsible>
          </div>
        </div>

        <div id="suggest-project" className="order-2 min-w-0 scroll-mt-24">
          <ProjectSubmissionForm />
        </div>
      </div>
    </Section>
  </div>
);

SpecialProjectsPage.pageRendersOwnNav = true;

export default SpecialProjectsPage;
