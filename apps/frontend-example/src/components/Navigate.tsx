import { useRouter } from 'next/router';
import { useEffect } from 'react';

type NavigateProps = {
  to: string;
};

export const Navigate: React.FC<NavigateProps> = ({ to }) => {
  const router = useRouter();

  useEffect(() => {
    router.push(to);
  }, []);

  return null;
};
