import React from 'react';
import { CTALinkOrButton } from '@bluedot/ui';
import { CTAProps } from '@bluedot/ui/src/CTALinkOrButton';
import Container from './Container';

interface NewNavItemProps {
  children: React.ReactNode;
  href: string;
}

/**
 * Text link for the new navigation bar
 */
export const NewNavItem: React.FC<NewNavItemProps> = ({ children, href }) => (
  <a href={href}>{children}</a>
);

/**
 * Button for the new navigation bar
 */
export const NewNavButton: React.FC<CTAProps> = (props) => (
  <CTALinkOrButton {...props} />
);

const NewNav: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <nav className="w-full bg-cream-normal sticky top-0 border-b-2 border-color-divider z-10">
      <Container className="h-16 flex items-center justify-between">
        <a href="/">
          <img src="/images/logo/BlueDot_Impact_Logo.svg" alt="BlueDot Impact" className="h-4 sm:h-8" />
        </a>
        <div className="flex gap-8 items-center">
          {children}
        </div>
      </Container>
    </nav>
  );
};

export default NewNav;
