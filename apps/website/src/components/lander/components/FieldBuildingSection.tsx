import { H2, P } from '@bluedot/ui';
import Link from 'next/link';

export type FieldBuildingRole = {
  title: string;
  description: React.ReactNode;
  linkText: string;
  linkUrl: string;
};

export type FieldBuildingSectionProps = {
  id?: string;
  title: string;
  intro: React.ReactNode;
  roles: FieldBuildingRole[];
};

const FieldBuildingSection = ({
  id,
  title,
  intro,
  roles,
}: FieldBuildingSectionProps) => {
  return (
    <section id={id} className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-5 bd-md:px-8 lg:px-12 xl:px-40 py-12 bd-md:py-16 xl:py-24 flex flex-col items-center gap-8 md:gap-10">
        <div className="max-w-[840px] text-center">
          <H2 className="text-[28px] bd-md:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-bluedot-navy tracking-[-0.01em]">
            {title}
          </H2>
          <P className="mt-4 text-[16px] bd-md:text-[17px] leading-[1.6] text-bluedot-navy/70">
            {intro}
          </P>
        </div>

        <div className="w-[calc(100vw-40px)] bd-md:w-[calc(100vw-64px)] lg:w-[928px] xl:w-[1120px] bg-white border border-bluedot-navy/10 rounded-xl flex flex-col overflow-hidden">
          {roles.map((role, index) => (
            <div key={role.title}>
              <div className="flex flex-col md:flex-row gap-3 md:gap-8 px-5 md:px-8 py-5 md:py-6">
                <div className="md:w-[160px] shrink-0">
                  <P className="text-[16px] font-semibold leading-[1.3] text-bluedot-navy">
                    {role.title}
                  </P>
                </div>

                <div className="flex-1 min-w-0">
                  <P className="text-[15px] leading-[1.65] text-bluedot-navy/80">
                    {role.description}
                  </P>
                  <Link
                    href={role.linkUrl}
                    className="mt-3 inline-flex items-center gap-1 text-[15px] font-medium text-bluedot-normal hover:underline"
                  >
                    {role.linkText}
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>

              {index < roles.length - 1 && <div className="w-full h-px bg-bluedot-navy/10" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FieldBuildingSection;
