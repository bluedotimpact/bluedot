import '../globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { BaseLayout } from '../components/BaseLayout';

const App: React.FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      <Head>
        <title>BlueDot Editor</title>
      </Head>
      <main className="bluedot-base">
        <BaseLayout>
          <Component {...pageProps} />
        </BaseLayout>
      </main>
    </>
  );
};

const AppWithNoSsr = dynamic(
  () => Promise.resolve(App),
  { ssr: false },
);

export default AppWithNoSsr;
