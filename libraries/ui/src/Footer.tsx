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
      <h3 className="text-white text-size-sm leading-[19px] mb-[15px] font-semibold">
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
              className="text-size-sm leading-[19px] text-[#CCD7FF] hover:text-white no-underline font-normal"
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
    { url: 'mailto:team@bluedot.org', label: 'Contact us' },
  ];

  const resourceLinks = [
    { url: 'https://blog.bluedot.org', label: 'Blog', target: '_blank' },
    { url: 'https://luma.com/bluedotevents?utm_source=website&utm_campaign=footer', label: 'Events', target: '_blank' },
    { url: '/privacy-policy', label: 'Privacy Policy' },
  ];

  const exploreLinks = courses.map((course) => ({ url: course.path, label: course.title }));

  return (
    <footer className={clsx('w-full bg-[#02051E]', className)}>
      {loading ? (
        <ProgressDots className="w-full py-16" />
      ) : (
        <div className="w-full py-8 px-5 min-[680px]:pt-10 min-[680px]:pb-[72px] min-[680px]:px-8 lg:pt-10 lg:pb-[72px] lg:px-12 xl:pt-10 xl:pb-[72px] xl:px-16 2xl:py-16 2xl:px-20">
          <div className="max-w-screen-xl mx-auto">

            {/* Logo (mobile and tablet only) */}
            <div className="lg:hidden mb-12">
              <ClickTarget url="/">
                {logo ? (
                  <img className="w-48 h-6" src={logo} alt="BlueDot Impact Logo" />
                ) : (
                  <p className="w-48 h-6 text-size-lg text-white bluedot-p">BlueDot Impact</p>
                )}
              </ClickTarget>
            </div>

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

            {/* Tablet: 2x2 grid (680px-1023px) */}
            <div className="hidden min-[680px]:grid min-[680px]:grid-cols-2 min-[680px]:gap-12 lg:hidden">
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

            {/* Desktop: 4 columns with logo+social on left (1024px+) */}
            <div className="hidden lg:flex lg:flex-row lg:justify-between lg:gap-8">
              {/* Logo + Social column */}
              <div className="flex flex-col justify-between shrink-0">
                <ClickTarget url="/">
                  {logo ? (
                    <img className="w-48 h-6" src={logo} alt="BlueDot Impact Logo" />
                  ) : (
                    <p className="w-48 h-6 text-size-lg text-white bluedot-p">BlueDot Impact</p>
                  )}
                </ClickTarget>
                <FooterSocial />
              </div>

              {/* Navigation columns */}
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

            {/* Social Icons (mobile and tablet only) */}
            <div className="lg:hidden my-12">
              <FooterSocial />
            </div>

            {/* Copyright */}
            <div className="text-size-sm text-[#CCD7FF] leading-[26px] min-[680px]:mt-0 lg:mt-12 2xl:mt-[64px]">
              <p className="mb-2">
                &copy; {new Date().getFullYear()}. BlueDot Impact operates as a UK CLG (<A href="https://find-and-update.company-information.service.gov.uk/company/14964572" target="_blank" rel="noopener noreferrer" className="text-[#CCD7FF] hover:text-white">14964572</A>) and a US 501(c)3 (<A href="https://projects.propublica.org/nonprofits/organizations/994885308" target="_blank" rel="noopener noreferrer" className="text-[#CCD7FF] hover:text-white">99-4885308</A>).
              </p>
              <p className="mb-2">
                US Address: 1680 Mission St. Suite 411, San Francisco, CA 94103
              </p>
              <p>
                Funded by <A href="https://www.coefficientgiving.org/" target="_blank" rel="noopener noreferrer" className="text-[#CCD7FF] hover:text-white">Coefficient Giving</A>.
              </p>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
