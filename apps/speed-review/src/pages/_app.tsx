import '../globals.css';
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
