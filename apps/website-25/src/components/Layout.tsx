import {
  EXTERNAL_LINK_PROPS,
  Footer,
  HeroSection,
  Nav,
} from '@bluedot/ui';

// TODO: 01/27 add routing to courses when AISafetyFundamentals course is integrated, i.e.'/courses/intro-transformative-ai
const courses = [
  { title: 'Intro to Transformative AI', href: 'https://aisafetyfundamentals.com/intro-to-tai/' },
  { title: 'AI Alignment Fast-Track', href: 'https://aisafetyfundamentals.com/alignment-fast-track/' },
  { title: 'AI Alignment In-Depth', href: 'https://aisafetyfundamentals.com/alignment/' },
  { title: 'AI Governance Fast-Track', href: 'https://aisafetyfundamentals.com/governance-fast-track/' },
  { title: 'Economics of Transformative AI Fast-Track', href: 'https://aisafetyfundamentals.com/economics-of-tai-fast-track/', isNew: true },
];

const Layout: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <>
      <Nav
        logo="/images/logo/BlueDot_Impact_Logo.svg"
        courses={courses}
      >
        <a href="https://donate.stripe.com/5kA3fpgjpdJv6o89AA" {...EXTERNAL_LINK_PROPS}>Support us</a>
        <a href="/about">About</a>
        <a href="/careers">Join us</a>
        <a href="https://bluedot.org/blog/" {...EXTERNAL_LINK_PROPS}>Blog</a>
      </Nav>
      <main className="bluedot-base overflow-y-scroll">
        <HeroSection
          title="The expertise you need to shape safe AI "
          subtitle="We run the world's most trusted AI Safety educational courses, career services and support community. Our programs are developed in collaboration with AI Safety world experts."
        >
          <div className="hero-section__logo-container flex flex-col items-center gap-7 mb-3">
            <img className="hero-section__logo-icon w-20 mb-20" src="/images/logo/BlueDot_Impact_Icon_White.svg" alt="BlueDot Impact" />
          </div>
        </HeroSection>
        {/* TODO: px-... is called margin on Figma */}
        <div className="max-w-max-width min-w-min-width mx-auto md:px-12 px-6">
          {children}
        </div>
      </main>
      <Footer logo="/images/logo/BlueDot_Impact_Logo_White.svg" />
    </>
  );
};

export default Layout;
