import { CTALinkOrButton } from '@bluedot/ui';
import { useEffect, useState } from 'react';

export type SectionNavItem = {
  id: string;
  label: string;
};

export type SectionNavProps = {
  sections: SectionNavItem[];
  applyUrl?: string;
};

const SectionNav = ({ sections, applyUrl }: SectionNavProps) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show nav after scrolling past hero (roughly 500px)
      setIsVisible(window.scrollY > 500);

      // Find current section
      const sectionElements = sections
        .map((s) => ({ id: s.id, el: document.getElementById(s.id) }))
        .filter((s) => s.el !== null);

      // Find the section that's currently in view (with offset for the sticky nav)
      const offset = 80;
      let current: string | null = null;

      for (const section of sectionElements) {
        if (section.el) {
          const rect = section.el.getBoundingClientRect();
          if (rect.top <= offset) {
            current = section.id;
          }
        }
      }

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 60; // Height of the sticky nav
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-bluedot-navy/5 transition-all duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div className="max-w-max-width mx-auto px-5 min-[680px]:px-8 min-[1024px]:px-spacing-x">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-1 min-[680px]:gap-2 overflow-x-auto scrollbar-none">
            {sections.map((section) => (
              <button
                type="button"
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`
                  px-3 min-[680px]:px-4 py-1.5 rounded-full text-[13px] min-[680px]:text-[14px] font-medium
                  whitespace-nowrap transition-all duration-200
                  ${activeSection === section.id
                  ? 'bg-bluedot-navy text-white'
                  : 'text-bluedot-navy/60 hover:text-bluedot-navy hover:bg-bluedot-navy/5'
                  }
                `}
              >
                {section.label}
              </button>
            ))}
          </div>
          {applyUrl && (
            <div className="flex-shrink-0 ml-4">
              <CTALinkOrButton
                url={applyUrl}
                variant="primary"
                size="small"
              >
                Join the next cohort
              </CTALinkOrButton>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default SectionNav;
