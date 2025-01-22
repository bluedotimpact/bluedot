import clsx from 'clsx';

export type SectionProps = React.PropsWithChildren<{
  className?: string,
  title: string,
  subtitle?: string
}>;

export const Section: React.FC<SectionProps> = ({
  className, title, subtitle, children,
}) => {
  return (
    <div className={clsx('section mx-16 my-8 max-w-full overflow-hidden', className)}>
      <div className="section__heading ml-4">
        <h2 className="section__title text-bluedot-normal text-[48px] mb-4 font-serif font-extrabold leading-none
            relative after:content-[''] after:absolute after:top-1/2 after:ml-3 after:h-[2px] after:w-full after:bg-bluedot-normal"
        >
          {title}
        </h2>
        {subtitle && (
          <p className="section__subtitle text-bluedot-darker text-md mb-4">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
};

export default Section;
