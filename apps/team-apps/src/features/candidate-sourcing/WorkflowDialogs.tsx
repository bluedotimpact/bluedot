/* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- Imported CSV text uses empty-string fallbacks. */
import { useState } from 'react';
import type { Dataset, FeedbackJob } from './types';
import type { TalentStore } from './store';
import { ExternalLink } from './ui';
export const Criteria = ({ data }: { data: Dataset }) => {
  return (
    <>
      <p>
        Scores reflect the available evidence. Missing evidence stays unknown; a
        score is not a probability of success.
      </p>
      <div className="ts-criteria-weights">
        {Object.entries(data.weights).map(([key, value]) => (
          <div key={key}>
            <span>{data.labels[key]}</span>
            <b>{value}%</b>
          </div>
        ))}
      </div>
      <details className="ts-disclosure" open>
        <summary>Full scoring rubric</summary>
        <pre>{data.rubric}</pre>
      </details>
      {data.workspace.calibration.length > 0 && (
        <details className="ts-disclosure">
          <summary>Calibration benchmarks</summary>
          {data.workspace.calibration.map((c, i) => (
            <div key={i}>
              <h3>{c.name}</h3>
              <p>{c.judgment}</p>
              <ExternalLink url={c.url}>Source</ExternalLink>
            </div>
          ))}
        </details>
      )}
      <details className="ts-disclosure">
        <summary>Score calculation & source</summary>
        <p>{data.formula}</p>
        <p>{data.manifest.selection}</p>
        <p>{data.workspace.feedback_note}</p>
        <p className="ts-muted">
          {data.workspace.name} · {data.revision}
        </p>
      </details>
      <Movement data={data} />
    </>
  );
};

export const Movement = ({ data }: { data: Dataset }) => {
  if (!data.movement.baseline) return null;
  return (
    <details className="ts-disclosure">
      <summary>What changed in the ranking</summary>
      {(['risers', 'fallers'] as const).map((type) => (
        <section key={type}>
          <h3>{type === 'risers' ? 'Biggest risers' : 'Biggest fallers'}</h3>
          {data.movement[type]?.map((p) => (
            <details key={p.person_key}>
              <summary>
                {p.name} · {p.score_before} → {p.score_after}
              </summary>
              <p>
                Rank {p.rank_before} → {p.rank_after}
              </p>
              {p.dimensions.map((d) => (
                <p key={d.dimension}>
                  <b>
                    {data.labels[d.dimension]} · {d.before.score} →{' '}
                    {d.after.score}.
                  </b>{' '}
                  {d.after.evidence}
                </p>
              ))}
            </details>
          ))}
        </section>
      ))}
      {data.movement.named_corrections?.map((c, i) => (
        <p key={i}>
          <b>{c.name}.</b> Expected {c.expected}; {c.observed} ·{' '}
          {c.matched ? 'matched' : 'needs review'}
        </p>
      ))}
    </details>
  );
};

export const Feedback = ({
  job,
  data,
  store,
  busy,
  close,
}: {
  job: FeedbackJob | null;
  data: Dataset;
  store: TalentStore;
  busy: boolean;
  close: () => void;
}) => {
  const [context, setContext] = useState(job?.context || '');
  const working = ['reviewing', 'applying', 'cancelling'].includes(job?.status || '');
  const proposal = job?.proposal;
  const name = (key: string) =>
    data.people.find((p) => p.person_key === key)?.name || 'Unknown person';
  return (
    <div className="ts-feedback">
      <p>
        {job?.message
        || 'Review your notes and decisions to propose improvements to the scoring criteria.'}
      </p>
      {working && <progress aria-label="Feedback progress" />}
      {job?.status === 'ready' && proposal && (
        <>
          <p className="ts-muted">
            Based on {job.review_count} reviewed people · updates all{' '}
            {job.sample_count} assessed people
          </p>
          <p>{proposal.summary}</p>
          <h3>Proposed criteria changes</h3>
          {proposal.changes.length ? (
            proposal.changes.map((c, i) => (
              <section className="ts-proposal" key={i}>
                <span className="ts-eyebrow">
                  {data.labels[c.dimension] || 'Across the criteria'}
                </span>
                <p>
                  <b>{c.rule}</b>
                </p>
                <p>{c.reason}</p>
                {c.person_keys.length > 0 && (
                  <p className="ts-muted">
                    Related people: {c.person_keys.map(name).join(', ')}
                  </p>
                )}
              </section>
            ))
          ) : (
            <p>
              No general rule changes. Person-specific corrections appear below.
            </p>
          )}
          {proposal.corrections.length > 0 && (
            <>
              <h3>Person-specific corrections</h3>
              {proposal.corrections.map((c, i) => (
                <p key={i}>
                  <b>{name(c.person_key)}.</b> {c.reason}
                </p>
              ))}
            </>
          )}
          {proposal.questions.length > 0 && (
            <>
              <h3>Questions for you</h3>
              <ul>
                {proposal.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </>
          )}
          {job.stale && (
            <p className="ts-warning">
              Your feedback or ranking changed. Review again to include the
              latest version.
            </p>
          )}
          <div className="ts-approval">
            <p>
              All {job.sample_count} assessed people will be re-assessed. The
              new criteria and scores become active together when everyone is
              ready.
            </p>
            <div className="ts-actions">
              <button type="button"
                className="ts-primary"
                disabled={
                  busy
                  || job.stale
                  || !(proposal.changes.length || proposal.corrections.length)
                }
                onClick={async () => {
                  if (await store.feedback('approve', { job_id: job.id })) {
                    close();
                  }
                }}
              >
                Apply & update all {job.sample_count} assessed people
              </button>
              <button type="button"
                disabled={busy}
                onClick={async () => {
                  if (await store.feedback('dismiss', { job_id: job.id })) {
                    close();
                  }
                }}
              >
                Keep current criteria
              </button>
            </div>
          </div>
        </>
      )}
      {job?.next_job_id
      && ['applying', 'cancelling', 'error'].includes(job.status) && (
        <>
          <p>
            {job.completed || 0} / {job.count} updated. Your previous ranking
            remains active.
          </p>
          <button type="button"
            disabled={busy || job.status === 'cancelling'}
            onClick={() => {
              void store.assess(job.status === 'error' ? 'retry' : 'cancel', {
                job_id: job.next_job_id,
              });
            }
            }
          >
            {job.status === 'error'
              ? 'Retry update from saved progress'
              : 'Cancel update'}
          </button>
        </>
      )}
      {job?.status === 'complete' && (
        <>
          <p>
            {job.learned_only
              ? 'This earlier review changed criteria without updating scores. Review again to refresh everyone.'
              : 'All assessed people now use the same criteria. Your notes and decisions were kept.'}
          </p>
          <Movement data={data} />
        </>
      )}
      {!working && (
        <section className="ts-feedback-context">
          <label htmlFor="feedback-context">
            Additional context (optional)
          </label>
          <textarea
            id="feedback-context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            maxLength={20000}
            placeholder="Explain what the scoring missed, or answer a question above."
          />
          <button type="button"
            disabled={busy}
            onClick={() => {
              void store.feedback('review', { context });
            }}
          >
            {job?.status === 'ready'
              ? 'Review with this context'
              : 'Review feedback'}
          </button>
        </section>
      )}
    </div>
  );
};

export const Assess = ({
  data,
  store,
  busy,
  close,
}: {
  data: Dataset;
  store: TalentStore;
  busy: boolean;
  close: () => void;
}) => {
  const remaining = data.people.filter((p) => !p.assessment).length;
  const [count, setCount] = useState(Math.min(10, remaining) || 1);
  return (
    <>
      <p>
        Assess more people using the current approved criteria. Finished
        profiles appear as they’re ready.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await store.assess('start', { count, revision: data.revision })) {
            close();
          }
        }}
      >
        <label htmlFor="assess-count">Additional people</label>
        <input
          id="assess-count"
          type="number"
          min={1}
          max={remaining || 1}
          required
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />
        <p className="ts-muted">
          {remaining.toLocaleString()} people have not been assessed.
        </p>
        <button type="submit" className="ts-primary" disabled={busy || !remaining}>
          Assess {count} {count === 1 ? 'person' : 'people'}
        </button>
      </form>
      <details className="ts-disclosure">
        <summary>Assess the entire pool afresh</summary>
        <p>
          This re-assesses all {data.people.length.toLocaleString()} people,
          including those already scored. Notes and decisions stay saved.
        </p>
        <button type="button"
          disabled={busy}
          onClick={async () => {
            if (await store.assess('full', { revision: data.revision })) {
              close();
            }
          }}
        >
          Evaluate all {data.people.length.toLocaleString()} people afresh
        </button>
      </details>
      <p className="ts-muted ts-small">
        Uses the supplied profiles and evidence. It does not conduct new web
        research.
      </p>
    </>
  );
};
