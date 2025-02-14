import '../globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
  CookieBanner, Footer, isCurrentPath, Nav, constants,
} from '@bluedot/ui';
import clsx from 'clsx';
import { Analytics } from '../components/Analytics';

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
        courses={constants.COURSES}
      >
        <a href="/about" className={clsx('hover:text-bluedot-normal', isCurrentPath('/about') && 'font-bold')}>About us</a>
        <a href="/careers" className={clsx('hover:text-bluedot-normal', isCurrentPath('/careers') && 'font-bold')}>Join us</a>
        <a href="https://bluedot.org/blog/" className="hover:text-bluedot-normal">Blog</a>
      </Nav>
      <main className="bluedot-base">
        <Component {...pageProps} />
      </main>
      <CookieBanner />
      <Footer logo="/images/logo/BlueDot_Impact_Logo_White.svg" />
      <Analytics />
    </>
  );
};

const AppWithNoSsr = dynamic(
  () => Promise.resolve(App),
  { ssr: false },
);

export default AppWithNoSsr;
