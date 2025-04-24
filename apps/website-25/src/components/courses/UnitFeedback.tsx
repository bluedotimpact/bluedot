import React, { useCallback, useState } from 'react';
import useAxios from 'axios-hooks';
import { isMobile } from 'react-device-detect';
import { CTALinkOrButton, ErrorSection, useAuthStore } from '@bluedot/ui';
import { FaCircleCheck } from 'react-icons/fa6';
import axios from 'axios';

import { Unit } from '../../lib/api/db/tables';
import { GetUnitFeedbackResponse, PutUnitFeedbackRequest } from '../../pages/api/courses/[courseSlug]/[unitId]/feedback';
import StarRating from './StarRating';
import { H4, P } from '../Text';

type UnitFeedbackProps = {
  unit: Pick<Unit, 'id' | 'courseSlug'>;
};

const UnitFeedback: React.FC<UnitFeedbackProps> = ({ unit }) => {
  const auth = useAuthStore((s) => s.auth);

  const [rating, setRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [error, setError] = useState<unknown | null>(null);

  const { courseSlug, id: unitId } = unit;

  const [{ data }, refetch] = useAxios<GetUnitFeedbackResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitId}/feedback`,
    headers: {
      Authorization: `Bearer ${auth?.token}`,
    },
  }, { manual: !auth });

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();

    if (!rating) {
      setError('Please select a star rating');
      return;
    }

    setError(null);

    try {
      await axios.put<unknown, unknown, PutUnitFeedbackRequest>(
        `/api/courses/${courseSlug}/${unitId}/feedback`,
        {
          overallRating: rating,
          anythingElse: feedbackText,
        },
        {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
          },
        },
      );

      await refetch();
    } catch (e) {
      setError(e);
    }
  }, [rating, feedbackText, courseSlug, unitId, auth, refetch]);

  // Don't show for logged out users
  if (!data || !auth) {
    return null;
  }

  const hasSubmitted = !!data.unitFeedback?.overallRating;

  return (
    <form
      className="unit-feedback container-lined bg-white p-8 flex flex-col gap-6 mt-6"
      onSubmit={handleSubmit}
    >
      <div className="unit-feedback__header flex flex-col gap-4">
        <H4>How did you like this unit?</H4>
        <P>
          We constantly try to get better and need your feedback to improve the
          course. It only takes <b>1 min</b> to share your learning experience
          with us.
        </P>
      </div>
      {hasSubmitted ? (
        <P className="unit-feedback__sent-message flex gap-2 items-center font-bold">
          <FaCircleCheck className="text-color-primary h-full aspect-square flex-shrink-0" />
          Feedback sent! Thanks for helping us improving this unit, you rock!
        </P>
      ) : (
        <>
          <StarRating rating={rating} setRating={setRating} />
          <div className="unit-feedback__free-response-section flex flex-col gap-4">
            <H4 className="unit-feedback__textarea-label text-size-sm">
              Do you have any other feedback on this unit?{' '}
              <span className="font-normal">(optional)</span>
            </H4>
            <textarea
              rows={isMobile ? 6 : 3}
              className="unit-feedback__textarea container-lined p-4"
              placeholder={'• What would have made this unit more valuable to you?\n• What aspects did you find most challenging?\n• What aspects did you find particularly useful?'}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
          </div>
          {typeof error === 'string'
            ? <P className="unit-feedback__error text-red-500">{error}</P>
            : error && <ErrorSection error={error} />}
          <CTALinkOrButton
            variant="primary"
            className="unit-feedback__submit self-start"
            type="submit"
          >
            Send feedback
          </CTALinkOrButton>
        </>
      )}
    </form>
  );
};

export default UnitFeedback;
