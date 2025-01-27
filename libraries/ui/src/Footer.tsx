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
    <div className="footer-container">
      <Banner
        title="Subscribe to our newsletter for the latest updates on AI safety careers"
        showInput
        showButton
      />
      <footer className={clsx('footer bg-bluedot-normal text-white min-h-[397] p-8 flex flex-col', className)}>
        <div className="footer_content flex flex-col mb-16">
          <div className="footer_nav grid grid-cols-4 gap-8">
            <div className="footer_nav_section">
              {logo ? <img className="footer_logo h-6 mb-6" src={logo} alt="BlueDot Impact Logo" /> : <p className="footer_logo h-8 text-xl text-white mb-6">BlueDot Impact</p>}

              <div className="social_links flex gap-6 mb-8">
                <a href="https://twitter.com/BlueDotImpact" aria-label="Twitter"><FaXTwitter className="w-6 h-6" /></a>
                <a href="https://youtube.com/@bluedotimpact" aria-label="YouTube"><FaYoutube className="w-6 h-6" /></a>
                <a href="https://www.facebook.com/bluedotimpact" aria-label="Facebook"><FaFacebook className="w-6 h-6" /></a>
                <a href="#" aria-label="Instagram"><FaInstagram className="w-6 h-6" /></a>
                {/* TODO: 01/27 Add Instagram link */}
                <a href="https://www.linkedin.com/company/bluedotimpact/" aria-label="LinkedIn"><FaLinkedin className="w-6 h-6" /></a>
              </div>
            </div>

            <div className="footer_nav_section">
              <h3 className="text-lg mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="/about">About</a></li>
                <li><a href="/careers">Careers</a></li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </div>

            {/* // TODO: 01/27 add routing to courses when AISafetyFundamentals course is integrated, i.e.'/courses/intro-transformative-ai */}
            <div className="footer_nav_section">
              <h3 className="text-lg mb-4">Explore</h3>
              <ul className="space-y-2">
                <li><a href="https://aisafetyfundamentals.com/intro-to-tai/">Intro to Transformative AI</a></li>
                <li><a href="https://aisafetyfundamentals.com/alignment-fast-track/">AI Alignment Fast Track</a></li>
                <li><a href="https://aisafetyfundamentals.com/alignment/">AI Alignment In-Depth</a></li>
                <li><a href="https://aisafetyfundamentals.com/governance/">AI Governance In-Depth</a></li>
              </ul>
            </div>

            <div className="footer_nav_section">
              <h3 className="text-lg mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="/announcements">Announcements and stories</a></li>
                <li><a href="/useful-links">Useful links</a></li>
                <li><a href="/community-projects">Community projects</a></li>
                <li><a href="/privacy-policy">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>

        <p className="footer_copyright text-sm text-center text-bluedot-lighter">&copy; {new Date().getFullYear()} <a href="https://bluedot.org/" target="_blank" rel="noopener noreferrer" className="underline">BlueDot Impact</a> is primarily funded by <a href="https://www.openphilanthropy.org/" target="_blank" rel="noopener noreferrer" className="underline">Open Philanthropy</a>, and is a non-profit based in the UK (company number <a href="https://find-and-update.company-information.service.gov.uk/company/14964572" target="_blank" rel="noopener noreferrer" className="underline">14964572</a>).</p>
      </footer>
    </div>
  );
};

export default Footer;
