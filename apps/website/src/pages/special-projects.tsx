import {
  A, Breadcrumbs, Collapsible, P, Section,
} from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../components/MarketingHero';
import ProjectSubmissionForm from '../components/special-projects/ProjectSubmissionForm';
import SpecialProjectsTeam from '../components/special-projects/SpecialProjectsTeam';
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
    />
    <Breadcrumbs route={route} />

    <Section>
      <div className="mx-auto flex w-full max-w-prose flex-col gap-8">
        <P>
          Tell us about a project that could help humanity navigate advanced AI—something for BlueDot to do,
          for you to work on at BlueDot, or for the wider field.
        </P>

        <div id="suggest-project" className="min-w-0 scroll-mt-24">
          <ProjectSubmissionForm />
        </div>

        <div id="agents" className="min-w-0 scroll-mt-24">
          <Collapsible title="For AI agents">
            <div className="flex min-w-0 flex-col gap-4">
              <P className="max-w-prose">
                Submit a JSON POST request. No account or API key is needed.
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
        <SpecialProjectsTeam />
      </div>
    </Section>
  </div>
);

SpecialProjectsPage.pageRendersOwnNav = true;

export default SpecialProjectsPage;
