import clsx from 'clsx';
import React from 'react';
import {
  FaXTwitter, FaYoutube, FaFacebook, FaInstagram, FaLinkedin,
} from 'react-icons/fa6';
import { EXTERNAL_LINK_PROPS } from './utils';

export type FooterProps = React.PropsWithChildren<{
  // Optional
  className?: string,
  logo?: string
}>;

type FooterSectionProps = {
  title?: string;
  links?: { href: string; label: string }[];
};

const FooterLinksSection: React.FC<FooterSectionProps> = ({ title, links }) => (
  <div className="footer__section">
    {title && <h3 className="footer__heading text-on-dark mb-4 text-size-m">{title}</h3>}
    {links && (
      <ul className="footer__list space-y-2 mb-auto font-normal list-none p-0">
        {links.map((link) => (
          <li key={link.href} className="footer__item">
            <a href={link.href} className="footer__link text-bluedot-lighter hover:text-white hover:cursor-pointer">
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
    <a href="https://twitter.com/BlueDotImpact" className="footer__social-link link-on-dark" aria-label="Twitter">
      <FaXTwitter className="size-6" />
    </a>
    <a href="https://youtube.com/@bluedotimpact" className="footer__social-link link-on-dark" aria-label="YouTube">
      <FaYoutube className="size-6" />
    </a>
    <a href="https://www.facebook.com/bluedotimpact" className="footer__social-link link-on-dark" aria-label="Facebook">
      <FaFacebook className="size-6" />
    </a>
    <a href="#" className="footer__social-link link-on-dark" aria-label="Instagram">
      <FaInstagram className="size-6" />
    </a>
    {/* TODO: 01/27 Add Instagram link */}
    <a href="https://www.linkedin.com/company/bluedotimpact/" className="footer__social-link link-on-dark" aria-label="LinkedIn">
      <FaLinkedin className="size-6" />
    </a>
  </div>
);

export const Footer: React.FC<FooterProps> = ({ className, logo }) => {
  // Footer links are styled differently than default `.link-on-dark`
  const footerLinkClassNames = 'footer__link text-bluedot-lighter hover:text-white hover:cursor-pointer';

  return (
    <div className="footer">
      <footer className={clsx('footer__main bg-bluedot-darker text-white min-h-[397] p-12 flex flex-col', className)}>
        <div className="footer__content flex flex-col mb-24">
          <nav className="footer__nav flex flex-col justify-between lg:flex-row gap-24 lg:gap-4">
            <div className="footer__section footer__section--brand flex flex-row lg:flex-col justify-between">
              {logo ? (
                <img className="footer__logo h-6 mr-auto" src={logo} alt="BlueDot Impact Logo" />
              ) : (
                <p className="footer__logo h-8 text-xl text-white">BlueDot Impact</p>
              )}
              <FooterSocial className="hidden sm:flex" />
            </div>

            <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-5">
              <FooterLinksSection
                title="BlueDot Impact"
                links={[
                  { href: '/about', label: 'About us' },
                  { href: '/support-us', label: 'Support us' },
                  { href: '/careers', label: 'Join us' },
                  { href: '/contact', label: 'Contact us' },
                ]}
              />

              {/* // TODO: 01/27 add routing to courses when AISafetyFundamentals course is integrated, i.e.'/courses/intro-transformative-ai */}
              <FooterLinksSection
                title="Explore"
                links={[
                  { href: 'https://aisafetyfundamentals.com/intro-to-tai/', label: 'Intro to Transformative AI' },
                  { href: 'https://aisafetyfundamentals.com/alignment-fast-track/', label: 'AI Alignment Fast Track' },
                  { href: 'https://aisafetyfundamentals.com/alignment/', label: 'AI Alignment In-Depth' },
                  { href: 'https://aisafetyfundamentals.com/governance/', label: 'AI Governance In-Depth' },
                ]}
              />

              
              <FooterLinksSection
                title="Resources"
                links={[
                  // TODO: 01/27 add routing to resources when resources are integrated
                  // { href: '/announcements', label: 'Announcements and stories' },
                  // { href: '/useful-links', label: 'Useful links' },
                  // { href: '/community-projects', label: 'Community projects' },
                  { href: '/privacy-policy', label: 'Privacy Policy' },
                ]}
              />
            </div>
            <FooterSocial className="sm:hidden" />
          </nav>
        </div>
        <p className="footer__copyright text-sm text-center text-bluedot-lighter">
          &copy; {new Date().getFullYear()} <a href="https://bluedot.org/" className={`${footerLinkClassNames} underline`}>BlueDot Impact</a> is primarily funded by <a href="https://www.openphilanthropy.org/" {...EXTERNAL_LINK_PROPS} className={`${footerLinkClassNames} underline`}>Open Philanthropy</a>, and is a non-profit based in the UK (company number <a href="https://find-and-update.company-information.service.gov.uk/company/14964572" {...EXTERNAL_LINK_PROPS} className={`${footerLinkClassNames} underline`}>14964572</a>).
        </p>
      </footer>
    </div>
  );
};

export default Footer;
