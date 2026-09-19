import '../globals.css';
import '../features/candidate-sourcing/workbench.css';
import '../lib/client/api';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { PortalLayout } from '../components/PortalLayout';
import dynamic from 'next/dynamic';

const App: React.FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>BlueDot Apps</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" sizes="128x128" href="/apple-touch-icon.png" />
      </Head>
      <PortalLayout>
        <Component {...pageProps} />
      </PortalLayout>
    </>
  );
};

const AppWithNoSsr = dynamic(
  () => Promise.resolve(App),
  { ssr: false },
);

export default AppWithNoSsr;
