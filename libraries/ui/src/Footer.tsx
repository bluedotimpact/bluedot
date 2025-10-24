import clsx from 'clsx';
import React from 'react';
import {
  FaXTwitter, FaYoutube, FaLinkedin,
} from 'react-icons/fa6';
import { A } from './Text';
import { ClickTarget } from './ClickTarget';
import { ProgressDots } from './ProgressDots';

export type FooterProps = React.PropsWithChildren<{
  // Optional props (including children from PropsWithChildren)
  className?: string;
  logo?: string;
  courses?: { path: string; title: string }[];
  loading?: boolean;
}>;

type FooterSectionProps = {
  title?: string;
  links?: { url: string; label: string; target?: string }[];
  className?: string;
};

const FooterLinksSection: React.FC<FooterSectionProps> = ({ title, links, className }) => (
  <div className={clsx('flex flex-col', className)}>
    {title && (
      <h3 className="text-white text-size-sm leading-[19px] mb-[15px] font-[Roobert,sans-serif] font-semibold">
        {title}
      </h3>
    )}
    {links && (
      <ul className="flex flex-col gap-[15px] list-none p-0">
        {links.map((link) => (
          <li key={link.url}>
            <A
              href={link.url}
              target={link.target}
              rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
              className="text-size-sm leading-[19px] text-[#CCD7FF] hover:text-white no-underline font-[Roobert,sans-serif] font-normal"
            >
              {link.label}
            </A>
          </li>
        ))}
      </ul>
    )}
  </div>
);

type FooterSocialProps = {
  className?: string;
};

const FooterSocial: React.FC<FooterSocialProps> = ({ className }) => (
  <div className={clsx('flex gap-6', className)}>
    <A href="https://twitter.com/BlueDotImpact" className="link-on-dark" aria-label="Twitter">
      <FaXTwitter className="size-6" />
    </A>
    <A href="https://youtube.com/@bluedotimpact" className="link-on-dark" aria-label="YouTube">
      <FaYoutube className="size-6" />
    </A>
    <A href="https://www.linkedin.com/company/bluedotimpact/" className="link-on-dark" aria-label="LinkedIn">
      <FaLinkedin className="size-6" />
    </A>
  </div>
);

export const Footer: React.FC<FooterProps> = ({
  className, logo, courses = [], loading,
}) => {
  const bluedotLinks = [
    { url: '/about', label: 'About us' },
    { url: 'https://donate.stripe.com/5kA3fpgjpdJv6o89AA', label: 'Support us' },
    { url: '/join-us', label: 'Join us' },
    { url: '/contact', label: 'Contact us' },
  ];

  const resourceLinks = [
    { url: '/blog', label: 'Blog' },
    { url: 'https://luma.com/bluedotevents?utm_source=website&utm_campaign=footer', label: 'Events', target: '_blank' },
    { url: '/privacy-policy', label: 'Privacy Policy' },
  ];

  const exploreLinks = courses.map((course) => ({ url: course.path, label: course.title }));

  return (
    <footer className={clsx('w-full', className)} style={{ background: '#13132E' }}>
      {loading ? (
        <div className="w-full flex items-center justify-center py-16">
          <ProgressDots />
        </div>
      ) : (
        <div className="w-full py-8 px-5 min-[680px]:py-10 min-[680px]:pb-[72px] min-[680px]:px-8 lg:px-12 xl:px-20 2xl:pt-10 2xl:pb-8 2xl:px-40">
          <div className="max-w-[280px] min-[680px]:max-w-[616px] lg:max-w-screen-lg xl:w-[1120px] xl:max-w-[1120px] 2xl:w-[1120px] 2xl:max-w-[1120px] mx-auto">

            {/* Logo (visible on all layouts except 2xl) */}
            <div className="2xl:hidden mb-12">
              <ClickTarget url="/">
                {logo ? (
                  <img className="w-48 h-6" src={logo} alt="BlueDot Impact Logo" />
                ) : (
                  <p className="w-48 h-6 text-size-lg text-white bluedot-p">BlueDot Impact</p>
                )}
              </ClickTarget>
            </div>

            {/* Main Content Layout - 12 column grid on 2xl */}
            <div className="2xl:grid 2xl:grid-cols-12 2xl:gap-8 2xl:items-stretch">

              {/* Brand Column - Logo and Social (2xl layout only) */}
              <div className="hidden 2xl:flex 2xl:flex-col 2xl:justify-between 2xl:col-span-4">
                <ClickTarget url="/">
                  {logo ? (
                    <img className="w-48 h-6" src={logo} alt="BlueDot Impact Logo" />
                  ) : (
                    <p className="w-48 h-6 text-size-lg text-white bluedot-p">BlueDot Impact</p>
                  )}
                </ClickTarget>

                <FooterSocial className="ml-2" />
              </div>

              {/* Navigation Columns (2xl) */}
              <div className="2xl:col-span-8 2xl:grid 2xl:grid-cols-3 2xl:gap-8">
                <div className="flex flex-col gap-12 min-[680px]:gap-0 lg:flex-row lg:gap-8 mt-12 min-[680px]:mt-0 2xl:mt-0 2xl:contents">

                  {/* Mobile: All sections stacked (320px-679px) */}
                  <div className="flex flex-col gap-12 min-[680px]:hidden">
                    <FooterLinksSection
                      title="BlueDot Impact"
                      links={bluedotLinks}
                    />

                    <FooterLinksSection
                      title="Explore"
                      links={exploreLinks}
                    />

                    <FooterLinksSection
                      title="Resources"
                      links={resourceLinks}
                    />
                  </div>

                  {/* Tablet: Custom layout for 680px-1023px */}
                  <div className="hidden min-[680px]:block lg:hidden">
                    <div className="grid grid-cols-[1fr_1fr] gap-x-[100px]">
                      <FooterLinksSection
                        title="BlueDot Impact"
                        links={bluedotLinks}
                      />

                      <FooterLinksSection
                        title="Explore"
                        links={exploreLinks}
                      />
                    </div>

                    <div className="mt-[73px]">
                      <FooterLinksSection
                        title="Resources"
                        links={resourceLinks}
                      />
                    </div>
                  </div>

                  {/* Desktop+: Row layout */}
                  <div className="hidden lg:flex lg:flex-row lg:justify-between lg:gap-8 lg:w-full 2xl:contents">
                    <FooterLinksSection
                      title="BlueDot Impact"
                      links={bluedotLinks}
                      className="flex-1 2xl:flex-initial"
                    />

                    <FooterLinksSection
                      title="Explore"
                      links={exploreLinks}
                      className="flex-1 2xl:flex-initial"
                    />

                    <FooterLinksSection
                      title="Resources"
                      links={resourceLinks}
                      className="flex-1 2xl:flex-initial"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Icons (visible on all layouts except 2xl) */}
            <div className="2xl:hidden my-12">
              <FooterSocial />
            </div>

            {/* Copyright */}
            <div className="text-size-sm text-[#CCD7FF] leading-[26px] min-[680px]:mt-0 lg:mt-12 2xl:mt-[64px]">
              <span>&copy; {new Date().getFullYear()}. <A href="https://bluedot.org/" className="text-[#CCD7FF] hover:text-white">BlueDot Impact</A> is primarily funded by <A href="https://www.openphilanthropy.org/" className="text-[#CCD7FF] hover:text-white">Open Philanthropy</A>, and is a non-profit based in the UK (company number <A href="https://find-and-update.company-information.service.gov.uk/company/14964572" className="text-[#CCD7FF] hover:text-white">14964572</A>).</span>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
