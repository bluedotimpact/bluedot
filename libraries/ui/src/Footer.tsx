import clsx from 'clsx';
import React from 'react';
import {
  FaXTwitter, FaYoutube, FaLinkedin,
} from 'react-icons/fa6';
import { EXTERNAL_LINK_PROPS } from './utils/externalLinkProps';
import { COURSES } from './constants';

export type FooterProps = React.PropsWithChildren<{
  // Optional
  className?: string,
  logo?: string
}>;

type FooterSectionProps = {
  title?: string;
  links?: { url: string; label: string }[];
  className?: string;
};

const FooterLinksSection: React.FC<FooterSectionProps> = ({ title, links, className }) => (
  <div className={clsx('footer__section', className)}>
    {title && <h3 className="footer__heading font-[650] text-on-dark mb-4 text-size-md bluedot-h3">{title}</h3>}
    {links && (
      <ul className="footer__list space-y-4 mb-auto list-none p-0">
        {links.map((link) => (
          <li key={link.url} className="footer__item leading-tight">
            <a href={link.url} className="footer__link text-bluedot-lighter hover:text-white hover:cursor-pointer bluedot-a no-underline">
              {link.label}
            </a>
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
  <div className={clsx('footer__social flex gap-6', className)}>
    <a href="https://twitter.com/BlueDotImpact" {...EXTERNAL_LINK_PROPS} className="footer__social-link link-on-dark bluedot-a" aria-label="Twitter">
      <FaXTwitter className="size-6" />
    </a>
    <a href="https://youtube.com/@bluedotimpact" {...EXTERNAL_LINK_PROPS} className="footer__social-link link-on-dark bluedot-a" aria-label="YouTube">
      <FaYoutube className="size-6" />
    </a>
    <a href="https://www.linkedin.com/company/bluedotimpact/" {...EXTERNAL_LINK_PROPS} className="footer__social-link link-on-dark bluedot-a" aria-label="LinkedIn">
      <FaLinkedin className="size-6" />
    </a>
  </div>
);

export const Footer: React.FC<FooterProps> = ({ className, logo }) => (
  <footer className={clsx('footer bg-bluedot-darker py-10', className)}>
    <div className="footer__container section-base">
      <nav className="footer__nav grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-4">
        <div className="footer__brand flex flex-row lg:flex-col justify-between">
          <a href="/" className="footer__logo">
            {logo ? (
              <img className="h-8" src={logo} alt="BlueDot Impact Logo" />
            ) : (
              <p className="h-8 text-size-lg text-white bluedot-p">BlueDot Impact</p>
            )}
          </a>
          <FooterSocial className="hidden sm:flex" />
        </div>

        <div className="footer__links grid grid-cols-1 sm:grid-cols-[auto_auto] gap-spacing-x">
          <FooterLinksSection
            title="BlueDot Impact"
            links={[
              { url: '/about', label: 'About us' },
              { url: 'https://donate.stripe.com/5kA3fpgjpdJv6o89AA', label: 'Support us', ...EXTERNAL_LINK_PROPS },
              { url: '/careers', label: 'Join us' },
              { url: '/contact', label: 'Contact us' },
              { url: '/privacy-policy', label: 'Privacy Policy' },
            ]}
            className="min-w-0 whitespace-nowrap"
          />

          <FooterLinksSection
            title="Explore"
            links={COURSES.map((course) => ({ url: course.url, label: course.title }))}
            className="min-w-0 flex-1"
          />
        </div>
        <FooterSocial className="sm:hidden" />
      </nav>
      <p className="footer__copyright text-size-sm text-center text-bluedot-lighter mt-12 lg:mt-24 mb-8 bluedot-p">
        &copy; {new Date().getFullYear()} <a href="https://bluedot.org/" className="footer__link text-bluedot-lighter hover:text-white hover:cursor-pointer bluedot-a">BlueDot Impact</a> is primarily funded by <a href="https://www.openphilanthropy.org/" {...EXTERNAL_LINK_PROPS} className="footer__link text-bluedot-lighter hover:text-white hover:cursor-pointer bluedot-a">Open Philanthropy</a>, and is a non-profit based in the UK (company number <a href="https://find-and-update.company-information.service.gov.uk/company/14964572" {...EXTERNAL_LINK_PROPS} className="footer__link text-bluedot-lighter hover:text-white hover:cursor-pointer bluedot-a">14964572</a>).
      </p>
    </div>
  </footer>
);

export default Footer;
