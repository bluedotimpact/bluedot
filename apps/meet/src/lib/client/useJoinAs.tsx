import axios, { AxiosResponse } from 'axios';
import { useState } from 'react';
import { MeetingJwtRequest, MeetingJwtResponse } from '../../pages/api/public/meeting-jwt';
import { PageState } from './pageState';

export type JoinAsProps = {
  cohortClassId: string,
  setPage: (page: PageState) => void,
};

const useJoinAs = ({ cohortClassId, setPage }: JoinAsProps) => {
  const [joinError, setJoinError] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const joinAs = async ({ name, participantId }: { name: string, participantId?: string }) => {
    try {
      setJoinError('');
      setIsJoining(true);
      const res = await axios.request<MeetingJwtResponse, AxiosResponse<MeetingJwtResponse>, MeetingJwtRequest>({
        method: 'post',
        url: '/api/public/meeting-jwt',
        data: { cohortClassId, participantId },
      });
      if (res.data.type === 'error') {
        throw new Error(res.data.message);
      }
      setPage({
        name: 'room',
        jwt: res.data.meetingSdkJwt,
        participantName: name,
        meetingNumber: res.data.meetingNumber,
        meetingPassword: res.data.meetingPassword,
      });
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsJoining(false);
    }
  };

  return { joinError, isJoining, joinAs };
};

export default useJoinAs;
