import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import StarRating from '../../components/courses/StarRating';

const FacilitatorFeedbackPage = () => {
  const router = useRouter();
  const groupId = router.query.groupId as string;

  // TODO: fetch from API
  const roundName = 'Technical AI Safety (2026 Feb W08) – Part-time';

  const [overallRating, setOverallRating] = useState(0);
  const [mostValuable, setMostValuable] = useState('');
  const [difficulties, setDifficulties] = useState('');

  return (
    <div className="min-h-screen bg-cream-normal">
      <Head>
        <title>Course Feedback | BlueDot Impact</title>
      </Head>

      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Hero card */}
        <section className="bg-white rounded-lg border-t-4 border-t-bluedot-normal p-8 mb-6">
          <h1>Course Feedback</h1>
          <p className="text-bluedot-normal mb-4">{roundName}</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>☆ Help us improve the course and support the right people.</li>
            <li>⏱ 8–10 min for course questions + a few min per participant.</li>
            <li>🔒 Your responses are only seen by BlueDot staff.</li>
          </ul>
        </section>

        {/* Course feedback card */}
        <section className="bg-white rounded-lg p-8 mb-6">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Course feedback</p>
          <h2>How did the course go?</h2>
          <p className="text-sm text-gray-600 mb-6">Your honest feedback helps us improve the course and calibrate quality across cohorts.</p>

          <label className="block mb-1 font-medium">
            Overall rating <span className="text-red-500">*</span>
          </label>
          <StarRating rating={overallRating} onChange={setOverallRating} />

          <label htmlFor="most-valuable" className="block mt-6 mb-1 font-medium">
            What did you find most valuable? <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-500 mb-1">Describe a specific moment or element that stands out.</p>
          <textarea
            id="most-valuable"
            value={mostValuable}
            onChange={(e) => setMostValuable(e.target.value)}
            rows={3}
            className="w-full border rounded p-2"
          />

          <label htmlFor="difficulties" className="block mt-6 mb-1 font-medium">
            Where did you have difficulties?
          </label>
          <p className="text-sm text-gray-500 mb-1">If a topic felt counterproductive or confusing, describe it here.</p>
          <textarea
            id="difficulties"
            value={difficulties}
            onChange={(e) => setDifficulties(e.target.value)}
            rows={3}
            className="w-full border rounded p-2"
          />

          <p className="text-xs text-gray-400 mt-4">The more specific your feedback is, the easier it is for us to take action on it.</p>
        </section>
      </div>
    </div>
  );
};

export default FacilitatorFeedbackPage;
