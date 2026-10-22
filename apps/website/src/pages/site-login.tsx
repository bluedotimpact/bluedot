import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Button, ClickTarget, H1, Input,
} from '@bluedot/ui';
import { inter } from '../lib/fonts';
import { pageMetaTags } from '../lib/linkPreviewMetaTags';

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
    <div className={`${inter.className} min-h-screen flex items-center justify-center bg-tint`}>
      <Head>
        {pageMetaTags({ title: 'Site Access | BlueDot Impact' })}
        <meta name="robots" content="noindex" />
      </Head>
      <div className="bg-raised p-8 rounded shadow-md w-[400px] max-w-full">
        <H1 className="text-size-lg mb-2 text-center">Site Access</H1>
        <p className="text-size-sm text-secondary text-center mb-6">
          <a href="https://start.1password.com/open/i?a=HTUBIRRURRGNNAKFHX5DU3YWRI&v=stgchk2vz4wbectnrh4v7gdsmu&i=aledjayhetmqgd4h64fg4kn3hy&h=bluedotimpact.1password.com" className="underline hover:text-primary" target="_blank" rel="noopener noreferrer">Here in 1Password</a> if you have access.
        </p>
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter password"
            autoComplete="current-password"
            autoFocus
            trailing={(
              <ClickTarget onClick={() => setShowPassword((prev) => !prev)} className="text-size-sm font-medium text-secondary hover:text-primary">
                {showPassword ? 'Hide' : 'Show'}
              </ClickTarget>
            )}
          />
          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Checking...' : 'Enter'}
          </Button>
          {error && (
            <p className="text-error-fg text-center text-size-sm">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
};

SiteLoginPage.rawLayout = true;

export default SiteLoginPage;
