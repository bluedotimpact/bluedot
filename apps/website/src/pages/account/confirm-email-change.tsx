import {
  H3,
  P,
  ProgressDots,
  Section,
} from '@bluedot/ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { ROUTES } from '../../lib/routes';
import { trpc } from '../../utils/trpc';

const CURRENT_ROUTE = ROUTES.confirmEmailChange;

const ConfirmEmailChange = () => {
  const router = useRouter();
  const token = typeof router.query.token === 'string' ? router.query.token : '';

  const confirmMutation = trpc.emailChange.confirm.useMutation();
  const { mutate } = confirmMutation;

  useEffect(() => {
    if (router.isReady && token) {
      mutate({ token });
    }
  }, [router.isReady, token, mutate]);

  let content;
  if (router.isReady && !token) {
    content = (
      <>
        <H3>Invalid link</H3>
        <P>This link is missing its confirmation code. Please use the link from your email.</P>
      </>
    );
  } else if (confirmMutation.isSuccess) {
    content = (
      <>
        <H3>Email updated</H3>
        <P>Your account email is now {confirmMutation.data.newEmail}. Use it next time you log in.</P>
        {confirmMutation.data.passwordSetupNeeded ? (
          <P>
            You previously signed in with Google using your old email. To log in from now on, set a
            password: choose &quot;Forgot password?&quot; on the login page and enter your new email address.
          </P>
        ) : (
          <P>Your password, if you have one, is unchanged.</P>
        )}
      </>
    );
  } else if (confirmMutation.error) {
    content = (
      <>
        <H3>We couldn't update your email</H3>
        <p role="alert">{confirmMutation.error.message}</p>
        <P>If you think this is a mistake, contact us at team@bluedot.org.</P>
      </>
    );
  } else {
    content = <ProgressDots className="py-8" />;
  }

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Section className="min-h-[50vh] max-w-3xl">
        <div className="flex flex-col gap-4">
          {content}
        </div>
      </Section>
    </div>
  );
};

export default ConfirmEmailChange;
