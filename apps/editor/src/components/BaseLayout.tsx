import { CTALinkOrButton, NewText } from '@bluedot/ui';
import { useRouter } from 'next/router';

export type BaseLayoutProps = {
  children?: React.ReactNode;
};

export const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  const router = useRouter();

  return (
    <div className="section-body gap-4 mt-6">
      <NewText.H1>BlueDot Editor</NewText.H1>
      <nav className="flex gap-2 mb-4">
        <CTALinkOrButton variant={router.pathname.startsWith('/blogs') ? 'primary' : 'secondary'} url="/blogs">Blogs</CTALinkOrButton>
        <CTALinkOrButton variant={router.pathname.startsWith('/jobs') ? 'primary' : 'secondary'} url="/jobs">Job postings</CTALinkOrButton>
      </nav>
      {children}
    </div>
  );
};
