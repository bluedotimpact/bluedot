import clsx from 'clsx';
import React from 'react';
import {
  FaXTwitter, FaYoutube, FaFacebook, FaInstagram, FaLinkedin,
} from 'react-icons/fa6';
import { Banner } from './Banner';

export type FooterProps = React.PropsWithChildren<{
  className?: string,
  logo?: string
}>;

export const Footer: React.FC<FooterProps> = ({ className, logo }) => {
  return (
    <div className="footer">
      <Banner
        title="Subscribe to our newsletter for the latest updates on AI safety careers"
        showInput
        showButton
      />
      <footer className={clsx('footer__main bg-bluedot-normal text-white min-h-[397] p-8 flex flex-col', className)}>
        <div className="footer__content flex flex-col mb-16">
          <nav className="footer__nav grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="footer__section footer__section--brand flex flex-col justify-between h-[180px]">
              {logo ? (
                <img className="footer__logo h-6" src={logo} alt="BlueDot Impact Logo" />
              ) : (
                <p className="footer__logo h-8 text-xl text-white">BlueDot Impact</p>
              )}

              <div className="footer__social flex gap-6 justify-center">
                <a href="https://twitter.com/BlueDotImpact" className="footer__social-link link-on-dark" aria-label="Twitter">
                  <FaXTwitter className="w-6 h-6" />
                </a>
                <a href="https://youtube.com/@bluedotimpact" className="footer__social-link link-on-dark" aria-label="YouTube">
                  <FaYoutube className="w-6 h-6" />
                </a>
                <a href="https://www.facebook.com/bluedotimpact" className="footer__social-link link-on-dark" aria-label="Facebook">
                  <FaFacebook className="w-6 h-6" />
                </a>
                <a href="#" className="footer__social-link link-on-dark" aria-label="Instagram">
                  <FaInstagram className="w-6 h-6" />
                </a>
                {/* TODO: 01/27 Add Instagram link */}
                <a href="https://www.linkedin.com/company/bluedotimpact/" className="footer__social-link link-on-dark" aria-label="LinkedIn">
                  <FaLinkedin className="w-6 h-6" />
                </a>
              </div>
            </div>

            <div className="footer__section">
              <h3 className="footer__heading text-base font-[650px] mb-4">BlueDot Impact</h3>
              <ul className="footer__list space-y-2 mb-auto font-normal">
                <li className="footer__item"><a href="/about" className="footer__link link-on-dark">About us</a></li>
                <li className="footer__item"><a href="/support-us" className="footer__link link-on-dark">Support us</a></li>
                <li className="footer__item"><a href="/careers" className="footer__link link-on-dark">Join us</a></li>
                <li className="footer__item"><a href="/contact" className="footer__link link-on-dark">Contact us</a></li>
              </ul>
            </div>

            {/* // TODO: 01/27 add routing to courses when AISafetyFundamentals course is integrated, i.e.'/courses/intro-transformative-ai */}
            <div className="footer__section">
              <h3 className="footer__heading text-base font-[650px] mb-4">Explore</h3>
              <ul className="footer__list space-y-2 text-base font-normal">
                <li className="footer__item"><a href="https://aisafetyfundamentals.com/intro-to-tai/" className="footer__link link-on-dark">Intro to Transformative AI</a></li>
                <li className="footer__item"><a href="https://aisafetyfundamentals.com/alignment-fast-track/" className="footer__link link-on-dark">AI Alignment Fast Track</a></li>
                <li className="footer__item"><a href="https://aisafetyfundamentals.com/alignment/" className="footer__link link-on-dark">AI Alignment In-Depth</a></li>
                <li className="footer__item"><a href="https://aisafetyfundamentals.com/governance/" className="footer__link link-on-dark">AI Governance In-Depth</a></li>
              </ul>
            </div>

            <div className="footer__section">
              {/* TODO: 01/27 add routing to resources when resources are integrated */}
              {/* <h3 className="text-lg mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="/announcements">Announcements and stories</a></li>
                <li><a href="/useful-links">Useful links</a></li>
                <li><a href="/community-projects">Community projects</a></li>
                <li><a href="/privacy-policy">Privacy Policy</a></li>
              </ul> */}
            </div>
          </nav>
        </div>

        <p className="footer__copyright text-sm text-center text-bluedot-lighter">
          &copy; {new Date().getFullYear()} <a href="https://bluedot.org/" target="_blank" rel="noopener noreferrer" className="footer__link link-on-dark underline">BlueDot Impact</a> is primarily funded by <a href="https://www.openphilanthropy.org/" target="_blank" rel="noopener noreferrer" className="footer__link link-on-dark underline">Open Philanthropy</a>, and is a non-profit based in the UK (company number <a href="https://find-and-update.company-information.service.gov.uk/company/14964572" target="_blank" rel="noopener noreferrer" className="footer__link link-on-dark underline">14964572</a>).
        </p>
      </footer>
    </div>
  );
};

export default Footer;
