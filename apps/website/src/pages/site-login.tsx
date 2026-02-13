import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { inter } from '../lib/fonts';

const SiteLoginPage = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const returnTo = (router.query.returnTo as string) ?? '/';

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      const formData = new FormData(e.currentTarget);
      const password = formData.get('password');

      const res = await fetch('/api/site-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(returnTo);
      } else {
        const data = await res.json();
        setError(data.error ?? 'Incorrect password');
        setLoading(false);
      }
    },
    [router, returnTo],
  );

  return (
    <div className={`${inter.className} min-h-screen flex items-center justify-center bg-gray-100`}>
      <Head>
        <title>Site Access | BlueDot Impact</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="bg-white p-8 rounded shadow-md w-[400px] max-w-full">
        <h1 className="text-2xl font-semibold mb-6 text-center">Site Access</h1>
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            name="password"
            type="password"
            placeholder="Enter password"
            autoComplete="current-password"
            autoFocus
            className="w-full p-3 border border-gray-300 rounded text-[16px] outline-none focus:border-blue-600"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-blue-900 text-white rounded text-[16px] font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
          {error && (
            <p className="text-red-600 text-center text-size-sm">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
};

SiteLoginPage.rawLayout = true;

export default SiteLoginPage;
