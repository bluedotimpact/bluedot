import { Section } from '@bluedot/ui';
import Head from 'next/head';
import FirstContactSection from '../components/welcome/FirstContactSection';
import { pageMetaTags } from '../lib/linkPreviewMetaTags';

// Unlisted page for new hires, linked from their welcome email
const WelcomePage = () => (
  <div>
    <Head>
      {pageMetaTags({ title: 'Welcome | BlueDot Impact' })}
      <meta name="robots" content="noindex" />
    </Head>
    <Section className="min-h-[50vh]">
      <FirstContactSection />
    </Section>
  </div>
);

export default WelcomePage;
