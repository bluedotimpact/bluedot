import {
  HeroH1,
  HeroH2,
  HeroSection,
  HeroCTAContainer,
  CTALinkOrButton,
} from '@bluedot/ui';
import { IconType } from 'react-icons';
import { ReactNode } from 'react';
import { getCtaUrl } from './getCtaUrl';

// Feature item component
interface FeatureProps {
  icon: IconType;
  children: ReactNode;
}

const Feature = ({ icon: Icon, children }: FeatureProps) => (
  <div className="flex items-center gap-2">
    {/* eslint-disable-next-line @bluedot/custom/no-default-tailwind-tokens */}
    <Icon className="text-2xl" />
    <span>{children}</span>
  </div>
);

// Title component
interface TitleProps {
  children: ReactNode;
  className?: string;
}

const Title = ({ children, className = '' }: TitleProps) => (
  <HeroH1 className={`font-serif text-5xl sm:text-7xl font-normal ${className}`}>
    {children}
  </HeroH1>
);

// Subtitle component
interface SubtitleProps {
  children: ReactNode;
  className?: string;
}

const Subtitle = ({ children, className = '' }: SubtitleProps) => (
  <HeroH2 className={`text-size-md sm:text-size-lg font-light max-w-2xl mx-auto mt-10 ${className}`}>
    {children}
  </HeroH2>
);

// CTA component
interface CTAProps {
  variant: string;
  children: ReactNode;
  className?: string;
}

const CTA = ({ variant, children, className = '' }: CTAProps) => (
  <HeroCTAContainer className={className}>
    <CTALinkOrButton url={getCtaUrl(variant)}>{children}</CTALinkOrButton>
  </HeroCTAContainer>
);

// Features container component
interface FeaturesProps {
  children: ReactNode;
  className?: string;
}

const Features = ({ children, className = '' }: FeaturesProps) => (
  <div className={`flex flex-wrap justify-center gap-6 sm:gap-20 mt-10 uppercase font-bold ${className}`}>
    {children}
  </div>
);

// Main ClassicHero component
interface ClassicHeroProps {
  children: ReactNode;
  className?: string;
}

export const ClassicHero = ({ children, className = '' }: ClassicHeroProps) => {
  return (
    <HeroSection className={`-mt-20 text-white bg-[url('/images/logo/logo_hero_background.svg')] bg-cover ${className}`}>
      {children}
    </HeroSection>
  );
};

// Attach subcomponents
ClassicHero.Title = Title;
ClassicHero.Subtitle = Subtitle;
ClassicHero.CTA = CTA;
ClassicHero.Features = Features;
ClassicHero.Feature = Feature;

export default ClassicHero;
