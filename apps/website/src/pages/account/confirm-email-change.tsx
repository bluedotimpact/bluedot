import {
  CTALinkOrButton, H3, P, ProgressDots, Section,
} from '@bluedot/ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import type { LoginMethods } from '../../lib/api/keycloak';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';

const CURRENT_ROUTE = ROUTES.confirmEmailChange;

const LoginAdvice = ({ loginMethods }: { loginMethods: LoginMethods }) => {
  if (loginMethods.hasGoogleLogin) {
    return (
      <P>
        {loginMethods.hasPassword
          ? 'Log in with Google, or with your new email address and your existing password.'
          : 'Log in with Google as before, using your new email address.'}
      </P>
    );
  }

  if (loginMethods.hasPassword) {
    return <P>Log in with your new email address and your existing password.</P>;
  }

  return (
    <P>
      You used to sign in with Google, so there is no password set for this account. To log in, sign
      with Google from your new email address and click "Add to existing account". Alternatively, choose
      &quot;Forgot password?&quot; on the login page and enter your new email address to set a password.
    </P>
  );
};

const ConfirmEmailChange = () => {
  const router = useRouter();
  const token = typeof router.query.token === 'string' ? router.query.token : '';

  // Without a query string the client has router.isReady on its first render while the server
  // did not, so gate on mount too to keep the server and client markup identical.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // Keep the long-lived token out of the address bar (and out of anything that records the
  // page URL, like analytics). The router keeps serving it from memory via router.query.
  useEffect(() => {
    if (window.location.search.includes('token=')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const confirmMutation = trpc.users.confirmEmailChange.useMutation();

  const renderContent = () => {
    if (!isMounted || !router.isReady) {
      return <ProgressDots className="py-8" />;
    }

    if (confirmMutation.isSuccess) {
      return (
        <>
          <H3>Email updated</H3>
          <P>Your BlueDot Impact account email is now {confirmMutation.data.newEmail}.</P>
          {confirmMutation.data.loginMethods && <LoginAdvice loginMethods={confirmMutation.data.loginMethods} />}
        </>
      );
    }

    const errorMessage = !token
      ? 'This link is missing its confirmation code. Please use the link from your email.'
      : confirmMutation.error?.message;
    if (errorMessage) {
      return (
        <>
          <H3>We couldn&apos;t update your email</H3>
          <p role="alert">{errorMessage}</p>
          <P>If you think this is a mistake, email us at team@bluedot.org.</P>
        </>
      );
    }

    return (
      <>
        <H3>Confirm your new email address</H3>
        <P>Confirming moves your BlueDot Impact account over to this email address.</P>
        <CTALinkOrButton
          variant="primary"
          className="self-start"
          disabled={confirmMutation.isPending}
          onClick={() => confirmMutation.mutate({ token })}
        >
          {confirmMutation.isPending ? 'Confirming...' : 'Confirm email change'}
        </CTALinkOrButton>
      </>
    );
  };

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Section className="min-h-[50vh]">
        <div className="flex flex-col gap-4 max-w-prose">
          {renderContent()}
        </div>
      </Section>
    </div>
  );
};

export default ConfirmEmailChange;
