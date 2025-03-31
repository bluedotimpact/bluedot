import { ReactNode } from 'react';
import { CTALinkOrButton } from '@bluedot/ui';
import { CTAProps } from '@bluedot/ui/src/CTALinkOrButton';
import Container from './Container';

interface ItemProps {
  children: ReactNode;
  href: string;
}

/**
 * Text link for the new navigation bar
 */
const Item = ({ children, href }: ItemProps) => (
  <a href={href}>{children}</a>
);

/**
 * Button for the new navigation bar
 */
const Button = (props: CTAProps) => (
  <CTALinkOrButton {...props} />
);

interface NavProps {
  children: ReactNode;
}

/**
 * Navigation bar component using compound component pattern
 */
const NewNav = ({ children }: NavProps) => {
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

// Attach subcomponents
NewNav.Item = Item;
NewNav.Button = Button;

// Export the component
export default NewNav;
