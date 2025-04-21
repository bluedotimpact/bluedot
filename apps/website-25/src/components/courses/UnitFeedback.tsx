import React, { useEffect, useState } from 'react';
import useAxios from 'axios-hooks';
import { isMobile } from 'react-device-detect';
import { CTALinkOrButton, useAuthStore } from '@bluedot/ui';
import { FaStar } from 'react-icons/fa6';
import axios from 'axios';

import { Unit } from '../../lib/api/db/tables';
import { GetUnitFeedbackResponse, PutUnitFeedbackRequest } from '../../pages/api/courses/[courseSlug]/[unitId]/feedback';

type UnitFeedbackProps = {
  unit: Unit;
};

const FREE_RESPONSE_PLACEHOLDER = '• What would have made this unit more valuable to you?\n• What aspects did you find most challenging?\n• What aspects did you find particularly useful?';

const UnitFeedback: React.FC<UnitFeedbackProps> = ({ unit }) => {
  const auth = useAuthStore((s) => s.auth);

  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');

  const { courseSlug, id: unitId } = unit;

  const [{ data }, refetch] = useAxios<GetUnitFeedbackResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}/${unitId}/feedback`,
    headers: {
      Authorization: `Bearer ${auth?.token}`,
    },
  }, { manual: !auth });

  useEffect(() => {
    if (!feedbackText && data?.unitFeedback?.anythingElse && data.unitFeedback.anythingElse !== feedbackText) {
      setFeedbackText(data?.unitFeedback.anythingElse);
    }
  }, [data, feedbackText]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!rating) {
      throw new Error('Please include a star rating');
      // TODO use react-hook-form
    }

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
  };

  if (!data) {
    return null;
  }

  return (
    <form
      className="unit-feedback container-lined bg-white p-8 flex flex-col gap-6"
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
      <div className="unit-feedback__stars flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          // TODO use the exact star in the figma
          <FaStar
            key={i}
            className={`cursor-pointer size-6 ${
              (hoverRating || rating) >= i ? 'text-yellow-500' : 'text-gray-300'
            }`}
            onMouseEnter={() => setHoverRating(i)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(i)}
          />
        ))}
      </div>
      <div className="unit-feedback__free-response-section flex flex-col gap-4">
        <h4 className="text-size-sm">
          Do you have any other feedback on this unit? <span className="font-normal">(optional)</span>
        </h4>
        <textarea
          rows={isMobile ? 6 : 3}
          className="unit-feedback__textarea container-lined p-4"
          placeholder={FREE_RESPONSE_PLACEHOLDER}
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
        />
      </div>
      <CTALinkOrButton
        variant="primary"
        className="unit-feedback__submit self-start"
        type="submit"
      >
        Send feedback
      </CTALinkOrButton>
    </form>
  );
};

export default UnitFeedback;
