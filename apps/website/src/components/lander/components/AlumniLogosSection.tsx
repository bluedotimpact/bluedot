import { H2 } from '@bluedot/ui';

export type AlumniOrg = {
  name: string;
  logo: string;
  url?: string;
};

export type AlumniLogosSectionProps = {
  title?: string;
  organizations: AlumniOrg[];
};

const AlumniLogosSection = ({
  title = 'Our graduates work at',
  organizations,
}: AlumniLogosSectionProps) => {
  return (
    <section className="w-full bg-[#FAFAFA]">
      <div className="max-w-max-width mx-auto px-5 py-10 min-[680px]:px-8 min-[680px]:py-12 min-[1024px]:px-spacing-x">
        <H2 className="text-[18px] min-[680px]:text-[20px] font-medium leading-[140%] text-[#13132E]/60 text-center mb-8 tracking-[-0.01em]">
          {title}
        </H2>
        <div className="flex flex-wrap justify-center items-center gap-8 min-[680px]:gap-12 lg:gap-16">
          {organizations.map((org) => {
            const LogoImage = (
              <img
                src={org.logo}
                alt={org.name}
                className="h-8 min-[680px]:h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-200"
              />
            );

            if (org.url) {
              return (
                <a
                  key={org.name}
                  href={org.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  {LogoImage}
                </a>
              );
            }

            return (
              <div key={org.name} className="flex-shrink-0">
                {LogoImage}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AlumniLogosSection;
