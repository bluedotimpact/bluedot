import '@bluedot/ui/src/shared.css';
import '../globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { CookieBanner, Footer, Nav } from '@bluedot/ui';

// TODO: 01/27 add routing to courses when AISafetyFundamentals course is integrated, i.e.'/courses/intro-transformative-ai
const courses = [
  { title: 'Intro to Transformative AI', href: 'https://aisafetyfundamentals.com/intro-to-tai/' },
  { title: 'AI Alignment Fast-Track', href: 'https://aisafetyfundamentals.com/alignment-fast-track/' },
  { title: 'AI Alignment In-Depth', href: 'https://aisafetyfundamentals.com/alignment/' },
  { title: 'AI Governance Fast-Track', href: 'https://aisafetyfundamentals.com/governance-fast-track/' },
  { title: 'Economics of Transformative AI Fast-Track', href: 'https://aisafetyfundamentals.com/economics-of-tai-fast-track/', isNew: true },
];

const App: React.FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>BlueDot Impact</title>
        <link rel="icon" type="image/png" href="images/logo/favicon/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="images/logo/favicon/favicon.svg" />
        <link rel="shortcut icon" href="images/logo/favicon/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="images/logo/favicon/apple-touch-icon.png" />
        <link rel="manifest" href="images/logo/favicon/site.webmanifest" />
      </Head>
      <Nav
        logo="/images/logo/BlueDot_Impact_Logo.svg"
        courses={courses}
      >
        <a href="/about">About</a>
        <a href="/careers">Join us</a>
        <a href="https://bluedot.org/blog/">Blog</a>
      </Nav>
      <main className="bluedot-base">
        <Component {...pageProps} />
      </main>
      <CookieBanner />
      <Footer logo="/images/logo/BlueDot_Impact_Logo_White.svg" />
    </>
  );
};

const AppWithNoSsr = dynamic(
  () => Promise.resolve(App),
  { ssr: false },
);

export default AppWithNoSsr;
