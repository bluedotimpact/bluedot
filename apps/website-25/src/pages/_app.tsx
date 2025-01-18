import '@bluedot/ui/src/shared.css';
import '../globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Footer, Nav } from '@bluedot/ui';

const App: React.FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>BlueDot Impact</title>
      </Head>
      <Nav logo="/BlueDot_Impact_Logo.svg" />
      <main className="bluedot-base">
        <Component {...pageProps} />
      </main>
      <Footer logo="/BlueDot_Impact_Logo_White.svg" />
    </>
  );
};

const AppWithNoSsr = dynamic(
  () => Promise.resolve(App),
  { ssr: false },
);

export default AppWithNoSsr;
