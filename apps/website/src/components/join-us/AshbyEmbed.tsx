import { Section } from '@bluedot/ui';
import dynamic from 'next/dynamic';
import Script from 'next/script';

const AshbyEmbed = () => {
  return (
    <Section>
      <div id="ashby_embed" />
      <Script>
        window.__ashbyBaseJobBoardUrl = "https://jobs.ashbyhq.com/bluedot"
      </Script>
      <Script id="ashby-script" src="https://jobs.ashbyhq.com/bluedot/embed" />
    </Section>
  );
};

export default dynamic(
  () => Promise.resolve(AshbyEmbed),
  { ssr: false },
);
