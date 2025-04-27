import clsx from 'clsx';
import { ReactNode } from 'react';
import { H3, P } from '../Text';

type FeatureProps = {
  iconSrc?: string;
  id?: string;
  className?: string;
  iconClassName?: string;
  children: ReactNode;
};

/**
 * Feature component - container for a single feature
 */
const Feature = ({
  iconSrc,
  children,
  className,
  iconClassName,
  id,
}: FeatureProps) => (
  <div className={clsx('text-center', className)} id={id}>
    {iconSrc && (
      <div className="size-32 bg-bluedot-lighter rounded-full mx-auto mb-4 flex items-center justify-center">
        <img src={iconSrc} alt="" className={clsx('size-16', iconClassName)} />
      </div>
    )}
    {children}
  </div>
);

type TitleProps = {
  className?: string;
  children: ReactNode;
};

/**
 * Title component - title for a feature
 */
const Title = ({
  children,
  className = '',
}: TitleProps) => (
  <H3 className={`font-semibold mb-2 ${className}`}>{children}</H3>
);

type SubtitleProps = {
  className?: string;
  children: ReactNode;
};

/**
 * Subtitle component - subtitle/description for a feature
 */
const Subtitle = ({
  children,
  className = '',
}: SubtitleProps) => (
  <P className={`text-gray-600 text-size-md mx-4 ${className}`}>{children}</P>
);

type FeaturesProps = {
  children: ReactNode;
};

/**
 * Component for displaying course features using compound component pattern
 */
const Features = ({ children }: FeaturesProps) => {
  return (
    <div className="grid md:grid-cols-3 gap-16">
      {children}
    </div>
  );
};

// Attach subcomponents
Features.Feature = Feature;
Features.Title = Title;
Features.Subtitle = Subtitle;

// Export the component
export default Features;
