import clsx from 'clsx';

export type HeroSectionProps = React.PropsWithChildren<{
  className?: string,
  title?: string,
  subtitle?: string
}>;

export const HeroSection: React.FC<HeroSectionProps> = ({
  className, title, subtitle, children,
}) => {
  return (
    <div className={clsx('hero-section bg-[radial-gradient(circle_at_center,#6687FF_0%,white_100%)] flex flex-row justify-center items-center w-full min-h-[570px]', className)}>
      <div className="hero-section__content max-w-[600px]">
        {children}
        {title && (
          <h1 className="hero-section__title text-bluedot-darker text-[48px] text-center mb-4 font-serif font-extrabold leading-none">{title}</h1>
        )}
        {subtitle && (
          <h2 className="hero-section__subtitle text-bluedot-darker text-xl text-center">{subtitle}</h2>
        )}
      </div>
    </div>
  );
};

export default HeroSection;
