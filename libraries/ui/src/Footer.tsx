import clsx from 'clsx';
import React from 'react';
import {
  FaXTwitter, FaYoutube, FaLinkedin,
} from 'react-icons/fa6';
import { A } from './Text';
import { ClickTarget } from './ClickTarget';
import { ProgressDots } from './ProgressDots';

export type FooterProps = React.PropsWithChildren<{
  // Optional
  className?: string;
  logo?: string;
  courses?: { path: string; title: string }[];
  loading?: boolean;
}>;

type FooterSectionProps = {
  title?: string;
  links?: { url: string; label: string }[];
  className?: string;
};

const FooterLinksSection: React.FC<FooterSectionProps> = ({ title, links, className }) => (
  <div className={clsx('footer__section', className)}>
    {title && <h3 className="footer__heading font-[650] text-color-text-on-dark mb-4 text-size-md bluedot-h3">{title}</h3>}
    {links && (
      <ul className="footer__list space-y-4 mb-auto list-none p-0">
        {links.map((link) => (
          <li key={link.url} className="footer__item leading-tight">
            <A href={link.url} className="footer__link text-bluedot-lighter hover:text-white no-underline">
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
  <div className={clsx('footer__social flex gap-6', className)}>
    <A href="https://twitter.com/BlueDotImpact" className="footer__social-link link-on-dark" aria-label="Twitter">
      <FaXTwitter className="size-6" />
    </A>
    <A href="https://youtube.com/@bluedotimpact" className="footer__social-link link-on-dark" aria-label="YouTube">
      <FaYoutube className="size-6" />
    </A>
    <A href="https://www.linkedin.com/company/bluedotimpact/" className="footer__social-link link-on-dark" aria-label="LinkedIn">
      <FaLinkedin className="size-6" />
    </A>
  </div>
);

export const Footer: React.FC<FooterProps> = ({
  className, logo, courses = [], loading,
}) => (
  <footer className={clsx('footer bg-bluedot-darker py-10', className)}>
    {loading ? (
      <div className="footer__container section-base">
        <ProgressDots />
      </div>
    ) : (
      <div className="footer__container section-base">
        <nav className="footer__nav grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-4">
          <div className="footer__brand flex flex-row lg:flex-col justify-between">
            <ClickTarget url="/" className="footer__logo">
              {logo ? (
                <img className="h-8" src={logo} alt="BlueDot Impact Logo" />
              ) : (
                <p className="h-8 text-size-lg text-white bluedot-p">BlueDot Impact</p>
              )}
            </ClickTarget>
            <FooterSocial className="hidden sm:flex" />
          </div>

          <div className="footer__links grid grid-cols-1 sm:grid-cols-[auto_auto] gap-spacing-x">
            <FooterLinksSection
              title="BlueDot Impact"
              links={[
                { url: '/about', label: 'About us' },
                { url: 'https://donate.stripe.com/5kA3fpgjpdJv6o89AA', label: 'Support us' },
                { url: '/join-us', label: 'Join us' },
                { url: '/contact', label: 'Contact us' },
                { url: '/privacy-policy', label: 'Privacy Policy' },
              ]}
              className="min-w-0 whitespace-nowrap"
            />

            <FooterLinksSection
              title="Explore"
              links={courses.map((course) => ({ url: course.path, label: course.title }))}
              className="min-w-0 flex-1"
            />
          </div>
          <FooterSocial className="sm:hidden" />
        </nav>
        <p className="footer__copyright text-size-sm text-center text-bluedot-lighter mt-12 lg:mt-24 mb-8 bluedot-p">
          &copy; {new Date().getFullYear()} <A href="https://bluedot.org/" className="footer__link text-bluedot-lighter hover:text-white">BlueDot Impact</A> is funded by <A href="https://www.openphilanthropy.org/" className="footer__link text-bluedot-lighter hover:text-white">Open Philanthropy</A>, and is a non-profit based in the UK (company number <A href="https://find-and-update.company-information.service.gov.uk/company/14964572" className="footer__link text-bluedot-lighter hover:text-white">14964572</A>).
        </p>
      </div>
    )}
  </footer>
);

export default Footer;
