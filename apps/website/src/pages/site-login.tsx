import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { inter } from '../lib/fonts';

const SiteLoginPage = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const rawReturnTo = (router.query.returnTo as string) ?? '/';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const isSafeRelativePath = rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//');
  const isSameSiteAbsoluteUrl = siteUrl && rawReturnTo.startsWith(siteUrl);
  const returnTo = isSafeRelativePath || isSameSiteAbsoluteUrl ? rawReturnTo : '/';

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      try {
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
      } catch {
        setError('Something went wrong. Please try again.');
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
        <h1 className="text-2xl font-semibold mb-2 text-center">Site Access</h1>
        <p className="text-size-sm text-gray-500 text-center mb-6">
          <a href="https://start.1password.com/open/i?a=HTUBIRRURRGNNAKFHX5DU3YWRI&v=stgchk2vz4wbectnrh4v7gdsmu&i=aledjayhetmqgd4h64fg4kn3hy&h=bluedotimpact.1password.com" className="underline hover:text-gray-700" target="_blank" rel="noopener noreferrer">Here in 1Password</a> if you have access.
        </p>
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              autoComplete="current-password"
              autoFocus
              className="flex-1 p-3 border border-gray-300 rounded text-[16px] outline-none focus:border-blue-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="px-4 border border-gray-300 rounded text-[14px] text-gray-600 hover:bg-gray-50"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
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
