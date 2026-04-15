import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import StarRating from '../../components/courses/StarRating';
import ParticipantFeedbackModal from '../../components/courses/ParticipantFeedbackModal';

const FacilitatorFeedbackPage = () => {
  const router = useRouter();
  const groupId = router.query.groupId as string;

  // TODO: fetch from API
  const roundName = 'Technical AI Safety (2026 Feb W08) – Part-time';

  const [selectedParticipant, setSelectedParticipant] = useState<{ id: string; name: string } | null>(null);
  const [overallRating, setOverallRating] = useState(0);
  const [mostValuable, setMostValuable] = useState('');
  const [difficulties, setDifficulties] = useState('');

  // TODO: fetch from API
  const participants = [
    { id: '1', name: 'Aisha Kamara' },
    { id: '2', name: 'Ben Okafor' },
    { id: '3', name: 'Clara Ndubuisi' },
    { id: '4', name: 'Diego Herrera' },
    { id: '5', name: 'Priya Mehta' },
    { id: '6', name: 'Tom Calahan' },
  ];

  return (
    <div className="min-h-screen bg-cream-normal">
      <Head>
        <title>Course Feedback | BlueDot Impact</title>
      </Head>

      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Hero card */}
        <section className="bg-white rounded-lg border border-t-4 border-t-bluedot-normal p-8 mb-6">
          <h1>Course Feedback</h1>
          <p className="text-bluedot-normal mb-4">{roundName}</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>☆ Help us improve the course and support the right people.</li>
            <li>⏱ 8–10 min for course questions + a few min per participant.</li>
            <li>🔒 Your responses are only seen by BlueDot staff.</li>
          </ul>
        </section>

        {/* Course feedback card */}
        <section className="bg-white rounded-lg border p-8 mb-6">
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
            Where did you face difficulties? <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-500 mb-1">Share at least two specific situations — underprepared moments, curriculum gaps, platform issues, or cohort challenges.</p>
          <textarea
            id="difficulties"
            value={difficulties}
            onChange={(e) => setDifficulties(e.target.value)}
            placeholder="The more specific your feedback is, the easier it is for us to take action on it."
            rows={3}
            className="w-full border rounded p-2"
          />
        </section>

        {/* Participant insights card */}
        <section className="bg-white rounded-lg border p-8 mb-6">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Participant insights</p>
          <h2>Share your insights on each participant</h2>
          <p className="text-sm text-gray-600 mb-2">
            We use it to identify the most promising participants in your cohort and decide how to back them — whether that's career introductions, grants, or an invitation to facilitate.
          </p>
          <p className="text-sm text-gray-600 mb-6">
            We recommend starting with participants who stood out in the course.
          </p>

          <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Cohort members</p>
          <ul>
            {participants.map((participant) => {
              const initials = participant.name.split(' ').map((n) => n[0]).join('');
              return (
                <li key={participant.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedParticipant(participant)}
                    className="w-full flex items-center justify-between border rounded-lg p-4 mb-2 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-medium">
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium">{participant.name}</p>
                        <p className="text-sm text-gray-400">Not yet completed</p>
                      </div>
                    </div>
                    <span className="text-sm text-bluedot-normal">Add feedback →</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button type="button" className="text-sm text-gray-500 mt-2">+ Add a participant</button>
        </section>

        {/* Submit section */}
        <section className="bg-white rounded-lg border p-8 mb-8">
          <div className="flex items-center gap-4">
            <button type="button" className="bg-bluedot-normal text-white px-6 py-3 rounded-lg font-medium">
              Submit feedback
            </button>
            <p className="text-sm text-gray-500">0 of {participants.length} participant feedback completed</p>
          </div>
        </section>
      </div>

      {selectedParticipant && (
        <ParticipantFeedbackModal
          participant={selectedParticipant}
          open
          onClose={() => setSelectedParticipant(null)}
          onSave={() => setSelectedParticipant(null)}
        />
      )}
    </div>
  );
};

export default FacilitatorFeedbackPage;
