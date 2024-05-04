import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import BlogHeader from '../components/BlogHeader';
import ProsePage from '../components/ProsePage';
import SiteHeader from '../components/SiteHeader';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] });

if (typeof window !== 'undefined') { // checks that we are client-side
  posthog.init('phc_yZ6zilX74HsRDdqv4JXMzF3o0fEtQvvSGHEfrONN5MH', {
    api_host: 'https://eu.i.posthog.com',
  });
}

const App: React.FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  const common = (
    <>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{`:root { --font-inter: ${inter.style.fontFamily}; }`}</style>
      {/* Cloudflare analytics */}
      <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "211b612bd6db41308a0d09319d6a408a"}' />
    </>
  );

  if (Component.displayName === 'MDXContent') {
    if ('frontmatter' in Component && typeof Component.frontmatter === 'object' && Component.frontmatter !== null && 'title' in Component.frontmatter) {
      return (
        <PostHogProvider>
          {common}
          <ProsePage>
            <SiteHeader />
            <article itemScope itemType="https://schema.org/BlogPosting">
              <BlogHeader frontmatter={Component.frontmatter} />
              <div itemProp="articleBody">
                <Component {...pageProps} />
              </div>
            </article>
          </ProsePage>
        </PostHogProvider>
      );
    }

    return (
      <PostHogProvider>
        {common}
        <ProsePage>
          <SiteHeader />
          <Component {...pageProps} />
        </ProsePage>
      </PostHogProvider>
    );
  }

  return (
    <PostHogProvider>
      {common}
      <Component {...pageProps} />
    </PostHogProvider>
  );
};

export default App;
