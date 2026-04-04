import Head from 'next/head';

const SITE_URL = 'https://bluedot.org';
const PAGE_TITLE = 'BIOSECURITY HACKATHON - 24-26 April 2026';
const ONLINE_SIGN_UP_URL = 'https://apartresearch.com/sprints/aixbio-hackathon-2026-04-24-to-2026-04-26?utm_source=bluedot&utm_medium=event_page&utm_campaign=biosecurity_hackathon_2026&utm_content=online';
const SIGN_UP_OPTIONS = [
  { label: 'Sign up to participate online', url: ONLINE_SIGN_UP_URL, isLive: true },
  { label: '[tbc] Boston', isLive: false },
  { label: '[tbc] SF', isLive: false },
  { label: '[tbc] London', isLive: false },
  { label: '[tbc] Cambridge', isLive: false },
] as const;
const FLASHES = [
  {
    top: '20%',
    left: '30%',
    delay: '0.4s',
    size: '74px',
  },
  {
    top: '34%',
    left: '72%',
    delay: '1.6s',
    size: '92px',
  },
  {
    top: '66%',
    left: '18%',
    delay: '2.7s',
    size: '86px',
  },
  {
    top: '77%',
    left: '78%',
    delay: '1s',
    size: '70px',
  },
] as const;

const BiosecHackathonPage = () => {
  return (
    <>
      <Head>
        <title>{PAGE_TITLE} | BlueDot Impact</title>
        <meta name="description" content={PAGE_TITLE} />
        <link rel="canonical" href={`${SITE_URL}/biosechackathon`} />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_TITLE} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BlueDot Impact" />
        <meta property="og:url" content={`${SITE_URL}/biosechackathon`} />
      </Head>

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,255,120,0.08),transparent_34%),linear-gradient(180deg,#000_0%,#020403_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:44px_44px]" />

        {FLASHES.map((flash) => (
          <span
            key={`${flash.top}-${flash.left}`}
            className="signal-flash pointer-events-none absolute rounded-full"
            style={{
              top: flash.top,
              left: flash.left,
              animationDelay: flash.delay,
              width: flash.size,
              height: flash.size,
            }}
          />
        ))}

        <div className="relative z-10 max-w-[1100px]">
          <h1 className="text-[34px] font-semibold uppercase leading-[0.95] tracking-[-0.06em] text-white min-[680px]:text-[64px] lg:text-[96px]">
            BIOSECURITY HACKATHON
          </h1>
          <p className="mt-4 text-[14px] font-medium uppercase tracking-[0.32em] text-white/60 min-[680px]:text-[18px] lg:text-[22px]">
            24-26 April 2026
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {SIGN_UP_OPTIONS.map((option) => {
              if (option.isLive) {
                return (
                  <a
                    key={option.label}
                    href={option.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#72ffb8]/60 bg-[rgba(114,255,184,0.08)] px-5 py-3 text-[14px] font-medium uppercase tracking-[0.14em] text-[#d9ffe9] shadow-[0_0_28px_rgba(114,255,184,0.14)] transition-all duration-200 hover:border-[#9dffd1] hover:bg-[rgba(114,255,184,0.14)] hover:shadow-[0_0_36px_rgba(114,255,184,0.2)]"
                  >
                    {option.label}
                  </a>
                );
              }

              return (
                <button
                  key={option.label}
                  type="button"
                  disabled
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/14 bg-white/[0.03] px-5 py-3 text-[14px] font-medium uppercase tracking-[0.14em] text-white/48"
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.24em] text-white/46 min-[680px]:text-[12px] lg:text-[13px]">
            In collaboration with
            {' '}
            <a
              href="https://apartresearch.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
            >
              Apart Research
            </a>
            {' '}
            &amp;
            {' '}
            <a
              href="https://www.cambiohub.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
            >
              Cambridge Biosecurity Hub
            </a>
          </p>
        </div>
      </main>

      <style>{`
        .signal-flash {
          background: radial-gradient(circle, rgba(95, 255, 164, 0.3) 0%, rgba(95, 255, 164, 0.12) 28%, transparent 68%);
          filter: blur(8px);
          animation: flicker 4.2s ease-in-out infinite;
        }

        @keyframes flicker {
          0%, 100% {
            opacity: 0;
          }
          10% {
            opacity: 0.2;
          }
          16% {
            opacity: 0.55;
          }
          24% {
            opacity: 0.1;
          }
          34% {
            opacity: 0.42;
          }
          42% {
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .signal-flash {
            animation: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default BiosecHackathonPage;
