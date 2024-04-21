import '../globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const App: React.FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>BlueDot Impact Availability</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
};

const AppWithNoSsr = dynamic(
  () => Promise.resolve(App),
  { ssr: false },
);

export default AppWithNoSsr;
