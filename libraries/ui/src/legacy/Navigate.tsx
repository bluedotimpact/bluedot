import { useRouter } from 'next/router';
import { useEffect } from 'react';

export type NavigateProps = {
  href: string;
};

/**
 * Redirects to a new page by rendering a component.
 * For example, attempting to render <Navigate href="/error" /> will take the user to the error page
 */
export const Navigate: React.FC<NavigateProps> = ({ href }) => {
  const router = useRouter();

  useEffect(() => {
    router.push(href);
  }, []);

  return null;
};
