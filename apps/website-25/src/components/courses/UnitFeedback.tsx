import React, { useCallback, useState } from 'react';
import useAxios from 'axios-hooks';
import { isMobile } from 'react-device-detect';
import { CTALinkOrButton, useAuthStore } from '@bluedot/ui';
import { FaCircleCheck } from 'react-icons/fa6';
import axios from 'axios';

import { Unit } from '../../lib/api/db/tables';
import { GetUnitFeedbackResponse, PutUnitFeedbackRequest } from '../../pages/api/courses/[courseSlug]/[unitId]/feedback';

const Star: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg viewBox="0 0 39 37" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M24.4794 11.4922C24.7341 12.008 25.1966 12.3851 25.744 12.5352L25.9833 12.585L37.2802 14.2363L29.1073 22.1963C28.665 22.6271 28.4482 23.2364 28.5145 23.8457L28.5321 23.9678L30.4608 35.2119L20.3593 29.8994C19.813 29.6123 19.167 29.5944 18.6083 29.8457L18.4979 29.8994L8.39636 35.2119L10.3251 23.9678C10.4364 23.3187 10.2216 22.6558 9.74988 22.1963L1.57703 14.2363L12.8739 12.585C13.5243 12.4898 14.0867 12.0816 14.3778 11.4922L19.4286 1.25879L24.4794 11.4922Z"
      stroke="#FFAE36"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={filled ? '#FFC16A' : 'transparent'}
    />
  </svg>
);

type UnitFeedbackProps = {
  unit: Pick<Unit, 'id' | 'courseSlug'>;
};

const FREE_RESPONSE_PLACEHOLDER = '• What would have made this unit more valuable to you?\n• What aspects did you find most challenging?\n• What aspects did you find particularly useful?';

const UnitFeedback: React.FC<UnitFeedbackProps> = ({ unit }) => {
  const auth = useAuthStore((s) => s.auth);

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

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
      setError('Unexpected error');
    }
  }, [rating, feedbackText, courseSlug, unitId, auth, refetch]);

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
        <h4>How did you like this unit?</h4>
        <p>
          We constantly try to get better and need your feedback to improve the
          course. It only takes <u>1 min</u> to share your learning experience
          with us.
        </p>
      </div>
      {hasSubmitted ? (
        <p className="unit-feedback__sent-message flex gap-2 text-bluedot-dark items-center font-[650]">
          <FaCircleCheck className="text-bluedot-normal h-full aspect-square flex-shrink-0" />
          Feedback sent! Thanks for helping us improving this unit, you rock!
        </p>
      ) : (
        <>
          <div className="unit-feedback__stars flex gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                className="unit-feedback__star cursor-pointer size-10"
                onMouseEnter={() => setHoverRating(i)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(i)}
                aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
                aria-pressed={(hoverRating || rating) >= i}
              >
                <Star filled={(hoverRating || rating) >= i} />
              </button>
            ))}
          </div>
          <div className="unit-feedback__free-response-section flex flex-col gap-4">
            <h4 className="unit-feedback__textarea-label text-size-sm">
              Do you have any other feedback on this unit?{' '}
              <span className="font-normal">(optional)</span>
            </h4>
            <textarea
              rows={isMobile ? 6 : 3}
              className="unit-feedback__textarea container-lined p-4"
              placeholder={FREE_RESPONSE_PLACEHOLDER}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
          </div>
          {error && <p className="unit-feedback__error text-red-500">{error}</p>}
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
