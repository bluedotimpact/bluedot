import React, { ReactNode } from 'react';

interface FeatureProps {
  iconSrc?: string;
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Feature component - container for a single feature
 */
export const Feature: React.FC<FeatureProps> = ({
  iconSrc,
  children,
  className = '',
  id,
}) => (
  <div className={`text-center ${className}`} id={id}>
    {iconSrc && (
      <div className="size-32 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
        <img src={iconSrc} alt="" className="size-16" />
      </div>
    )}
    {children}
  </div>
);

interface FeatureTitleProps {
  className?: string;
  children: ReactNode;
}

/**
 * FeatureTitle component - title for a feature
 */
export const FeatureTitle: React.FC<FeatureTitleProps> = ({
  children,
  className = '',
}) => (
  <h3 className={`font-semibold mb-2 ${className}`}>{children}</h3>
);

interface FeatureSubtitleProps {
  className?: string;
  children: ReactNode;
}

/**
 * FeatureSubtitle component - subtitle/description for a feature
 */
export const FeatureSubtitle: React.FC<FeatureSubtitleProps> = ({
  children,
  className = '',
}) => (
  <p className={`text-gray-600 text-size-md mx-4 ${className}`}>{children}</p>
);

interface FeaturesSectionProps {
  children: ReactNode;
}

/**
 * Section component for displaying course features
 */
const FeaturesSection: React.FC<FeaturesSectionProps> = ({ children }) => {
  return (
    <div className="grid md:grid-cols-3 gap-16">
      {children}
    </div>
  );
};

export default FeaturesSection;
