import { CTALinkOrButton, H2, P } from '@bluedot/ui';
import Link from 'next/link';
import { GRANT_PROGRAMS } from '../grants/grantPrograms';
import { ROUTES } from '../../lib/routes';

const PROGRAMS_OVERVIEW_URL = `${ROUTES.programs.url}?utm_source=website&utm_campaign=homepage-programs`;

const GrantsSection = () => {
  const activePrograms = GRANT_PROGRAMS.filter((p) => p.status === 'Active');

  return (
    <section className="w-full bg-white py-[48px] px-5 min-[680px]:py-[64px] min-[680px]:px-8 min-[1024px]:py-[80px] lg:px-12 min-[1280px]:py-[96px] xl:px-16 2xl:px-20">
      <div className="mx-auto max-w-screen-xl flex flex-col items-center">
        <div className="max-w-[700px] text-center">
          <H2 className="text-[28px] min-[680px]:text-[36px] min-[1024px]:text-[40px] min-[1280px]:text-[48px] leading-tight tracking-[-1px] font-medium text-bluedot-navy">
            Go beyond a course
          </H2>
          <P className="mt-6 text-[16px] min-[680px]:text-[18px] leading-[1.6] text-bluedot-navy/80">
            Funding, structured sprints, or a bigger launchpad for the next stage of your work on making AI go well.
          </P>
        </div>

        <ul className="list-none mt-10 min-[680px]:mt-12 grid gap-4 w-full max-w-[1120px] grid-cols-1 min-[680px]:grid-cols-2 min-[1024px]:grid-cols-3">
          {activePrograms.map((program) => (
            <li key={program.slug}>
              <Link
                href={`${program.href}?utm_source=website&utm_campaign=homepage-programs`}
                className="group flex h-full flex-col gap-3 rounded-xl border border-bluedot-navy/10 bg-white p-6 transition-colors hover:border-bluedot-navy/20"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-bluedot-normal">
                  {program.track}
                </p>
                <h3 className="text-[18px] min-[680px]:text-[20px] font-semibold leading-tight text-bluedot-navy">
                  {program.title}
                </h3>
                <p className="text-[15px] leading-[1.55] text-bluedot-navy/70">
                  {program.goal}
                </p>
                <span className="mt-auto pt-2 inline-flex items-center gap-1 text-[14px] font-medium text-bluedot-normal">
                  <span className="transition-transform group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5">
                    Learn more
                  </span>
                  <span aria-hidden="true" className="opacity-60 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 min-[680px]:mt-12">
          <CTALinkOrButton url={PROGRAMS_OVERVIEW_URL} variant="secondary" withChevron>
            See all programs
          </CTALinkOrButton>
        </div>
      </div>
    </section>
  );
};

export default GrantsSection;
