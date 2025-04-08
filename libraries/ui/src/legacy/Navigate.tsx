import { useRouter } from 'next/router';
import { useEffect } from 'react';

export type NavigateProps = {
  url: string;
};

/**
 * Redirects to a new page by rendering a component.
 * For example, attempting to render <Navigate url="/error" /> will take the user to the error page
 */
export const Navigate: React.FC<NavigateProps> = ({ url }) => {
  const router = useRouter();

  useEffect(() => {
    router.push(url);
  }, []);

  return null;
};
