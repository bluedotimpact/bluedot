import {
  ProgressDots,
  withAuth,
  ErrorSection,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import React from 'react';
import { GetUserResponse } from '../api/users/me';
import { ROUTES } from '../../lib/routes';
import { H3 } from '../../components/Text';
import CircleSpaceEmbed from '../../components/courses/exercises/CircleSpaceEmbed';
import SettingsLayout from '../../components/settings/SettingsLayout';

const CURRENT_ROUTE = ROUTES.settingsCommunity;

function CommunitySettingsPage({ auth }: { auth: { token: string } }) {
  const [{ data: userData, loading: userLoading, error: userError }] = useAxios<GetUserResponse>({
    method: 'get',
    url: '/api/users/me',
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
      </Head>
      {userLoading && <ProgressDots />}
      {userError && <ErrorSection error={userError} />}
      {userData?.user && (
        <SettingsLayout activeTab="community" route={CURRENT_ROUTE}>
          <div className="p-8">
            <H3 className="mb-6">Connect with your community</H3>
            <CircleSpaceEmbed 
              spaceSlug="events" 
              style={{ 
                width: '100%', 
                height: '100%', 
                minHeight: '510px' 
              }} 
            />
          </div>
        </SettingsLayout>
      )}
    </div>
  );
}

export default withAuth(CommunitySettingsPage);