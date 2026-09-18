import Head from 'next/head';
import Link from 'next/link';
import { H1 } from '@bluedot/ui';
import { apps } from '../lib/apps';
import { PortalIcon } from '../components/PortalIcon';

const Home = () => {
  return (
    <>
      <Head><title>Apps | BlueDot</title></Head>
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-14">
        <H1 className="text-size-xl">Apps</H1>
        <p className="mt-3 max-w-prose text-size-sm leading-relaxed text-secondary">Tools for the BlueDot team.</p>
        <div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {apps.map((app) => (
            <Link key={app.id} href={app.href} target={app.external ? '_blank' : undefined} rel={app.external ? 'noopener noreferrer' : undefined} aria-label={app.external ? `${app.name} (opens in a new tab)` : undefined} className="group flex min-w-0 flex-col rounded-overlay border border-subtle bg-raised p-6 transition-colors hover:border-strong hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus">
              <span className="flex size-11 items-center justify-center rounded-surface bg-info-bg text-info-fg"><PortalIcon name={app.icon} /></span>
              <h2 className="mt-6 text-size-md font-semibold">{app.name}</h2>
              <p className="mt-2 text-size-xs leading-relaxed text-secondary">{app.description}</p>
              <span className="mt-auto flex items-center justify-between pt-7 text-size-xs font-medium text-accent">{app.external ? 'Open in new tab' : 'Open app'}<PortalIcon name={app.external ? 'external' : 'arrow'} className="transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default Home;
