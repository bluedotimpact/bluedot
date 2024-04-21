import Head from 'next/head';

const Home: React.FC = () => {
  return (
    <>
      <Head>
        <title>Time Availability Form</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="my-24 max-w-lg mx-auto">
        <h1 className="text-3xl font-bold my-2">Time availability form</h1>
        <p>This application collects people's availability, primarily for BlueDot Impact related scheduling purposes.</p>
      </main>
    </>
  );
};

export default Home;
