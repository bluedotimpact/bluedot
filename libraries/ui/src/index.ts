// Alphabetized by file name
// Updated Components - 2025

export { Banner } from './Banner';
export type { BannerProps } from './Banner';

export { Breadcrumbs, type BluedotRoute } from './Breadcrumbs';
export type { BreadcrumbsProps } from './Breadcrumbs';

export { Card } from './Card';
export type { CardProps } from './Card';

export { Collapsible } from './Collapsible';
export type { CollapsibleProps } from './Collapsible';

export { CookieBanner } from './CookieBanner';
export type { CookieBannerProps } from './CookieBanner';

export { CourseCard } from './CourseCard';
export type { CourseCardProps } from './CourseCard';

export { CTALinkOrButton } from './CTALinkOrButton';
export type { CTALinkOrButtonProps } from './CTALinkOrButton';

export { ErrorSection } from './ErrorSection';
export type { ErrorSectionProps } from './ErrorSection';

export {
  HeroSection, HeroH1, HeroH2, HeroCTAContainer,
} from './HeroSection';
export type { HeroSectionProps, HeroCTAContainerProps } from './HeroSection';

export { FaceTiles } from './FaceTiles';
export type { FaceTilesProps } from './FaceTiles';

export { Footer } from './Footer';
export type { FooterProps } from './Footer';

export { Modal } from './Modal';
export type { ModalProps } from './Modal';

export { ProgressDots } from './ProgressDots';

export { Section, SectionHeading } from './Section';
export type { SectionProps } from './Section';

export { SlideList } from './SlideList';
export type { SlideListProps } from './SlideList';

export { Tag } from './Tag';
export type { TagProps } from './Tag';

// This will eventually be exported directly, but for now it's namespaced as NewText to avoid mistakes in the migration from LegacyText
export * as NewText from './Text';

export { UnitCard } from './UnitCard';
export type { UnitCardProps } from './UnitCard';

// Utils

export { addQueryParam } from './utils/addQueryParam';
export { maybePlural } from './utils';
export { asError } from './utils/asError';
export { useAuthStore, withAuth, type Auth } from './utils/auth';
export { EXTERNAL_LINK_PROPS } from './utils/externalLinkProps';
export {
  makeMakeApiRoute, StreamingResponseSchema, type Handler, type MakeMakeApiRouteEnv, type RouteOptions,
} from './utils/makeMakeApiRoute';
export { slackAlert } from './utils/slackAlert';
export { validateEnv } from './utils/validateEnv';
export * as constants from './constants';

export { Navigate } from './legacy/Navigate';
export type { NavigateProps } from './legacy/Navigate';

export { loggedOutStory, loggedInStory } from './utils/storybook';

// Legacy Components

export { Box } from './legacy/Box';
export type { BoxProps } from './legacy/Box';

export { Button } from './legacy/Button';
export type { ButtonProps } from './legacy/Button';

export { CardButton } from './legacy/CardButton';

export { Input } from './legacy/Input';
export type { InputProps } from './legacy/Input';

export { Link } from './legacy/Link';
export type { LinkProps } from './legacy/Link';

export { LoginRedirectPage, LoginOauthCallbackPage, loginPresets } from './legacy/Login';
export type { LoginPageProps, LoginOauthCallbackPageProps } from './legacy/Login';

export * as LegacyText from './legacy/Text';
export type { TextProps } from './legacy/Text';

export { ShareButton } from './ShareButton';
export type { ShareButtonProps } from './ShareButton';

export { Textarea } from './legacy/Textarea';
export type { TextareaProps } from './legacy/Textarea';
