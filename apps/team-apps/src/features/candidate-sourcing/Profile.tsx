/* eslint-disable no-nested-ternary -- Preserve the existing Workbench state rendering during the portal move. */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- Imported CSV text uses empty-string fallbacks. */
import { useRef, useEffect, useState } from 'react';
import type {
  AshbyLead, Dataset, Person, Review,
} from './types';
import type { TalentStore } from './store';
import { basis, ExternalLink, words } from './ui';
export const Profile = ({
  person: p,
  lead,
  leadBlocked,
  data,
  review,
  draft,
  saveState,
  store,
  previous,
  next,
  back,
}: {
  person: Person;
  lead?: AshbyLead;
  leadBlocked?: boolean;
  data: Dataset;
  review: Review;
  draft?: string;
  saveState?: { text: string; error: boolean };
  store: TalentStore;
  previous?: () => void;
  next?: () => void;
  back: () => void;
}) => {
  const panel = useRef<HTMLElement>(null);
  const [refreshingReview, setRefreshingReview] = useState(false);
  useEffect(() => {
    panel.current?.scrollTo(0, 0);
  }, [p.person_key]);
  const a = p.assessment;
  const old
    = !p.live
      && p.assessed_with
      && data.criteria_version
      && p.assessed_with !== data.criteria_version;
  const links = [
    ...new Set(`${p.source.personal_website || ''} ${p.source.other_urls || ''}`.match(/https?:\/\/[^\s;<>]+/g) || []),
  ];
  return (
    <section
      ref={panel}
      className="ts-profile"
      aria-label={`Profile: ${p.name}`}
    >
      <div className="ts-profile-nav">
        <button type="button" className="ts-mobile-back" onClick={back}>
          ← People
        </button>
        <span className="ts-muted">
          {p.live
            ? 'New result · ranking pending'
            : p.rank
              ? `Rank ${p.rank}`
              : 'Profile'}
        </span>
        <div className="ts-actions">
          <button type="button"
            aria-label="Previous person"
            onClick={previous}
            disabled={!previous}
          >
            ↑
          </button>
          <button type="button" aria-label="Next person" onClick={next} disabled={!next}>
            ↓
          </button>
        </div>
      </div>
      <div className="ts-profile-title">
        <div>
          <h2>{p.name}</h2>
          <p className="ts-muted">
            {p.headline
            || p.source.current_role_or_status
            || p.source.linkedin_headline
            || ''}
          </p>
        </div>
        <button type="button"
          className="ts-star"
          onClick={() => {
            void store.addLead(p);
          }}
          disabled={
            !data.workspace.ashby_job
            || leadBlocked
            || lead?.status === 'pending'
            || lead?.status === 'complete'
          }
          data-added={lead?.status === 'complete'}
          aria-label={
            lead?.status === 'complete'
              ? `${p.name} added to Ashby`
              : `Add ${p.name} to Ashby as a lead`
          }
          title={
            leadBlocked
              ? 'Wait for this criteria update to finish before adding the new assessment.'
              : data.workspace.ashby_job
                ? `Add to ${data.workspace.ashby_job.title} in Ashby, with the assessment and your review`
                : 'Choose an Ashby role first'
          }
        >
          {lead?.status === 'pending'
            ? '…'
            : lead?.status === 'complete'
              ? '★'
              : '☆'}
        </button>
      </div>
      {lead && (
        <div
          className={
            lead.status === 'error' ? 'ts-warning' : 'ts-muted ts-small'
          }
          role="status"
        >
          {lead.status === 'pending' ? (
            'Adding to Ashby with the assessment and your review…'
          ) : lead.status === 'complete' ? (
            <>
              <span>
                Added to Ashby · assessment and review saved at the time.{' '}
              </span>
              <ExternalLink url={lead.candidate_url || ''}>
                View in Ashby
              </ExternalLink>
            </>
          ) : (
            <>
              {lead.error}{' '}
              <button type="button" onClick={() => {
                void store.addLead(p);
              }}>
                Retry adding to Ashby
              </button>
            </>
          )}
        </div>
      )}
      <div className="ts-links">
        <ExternalLink url={p.contact?.linkedin || p.source.linkedin}>
          LinkedIn
        </ExternalLink>
        {links.map((url, i) => (
          <ExternalLink key={url} url={url}>
            Source {i + 1}
          </ExternalLink>
        ))}
        {(p.contact?.email || p.source.email) && (
          <span>{p.contact?.email || p.source.email}</span>
        )}
      </div>
      <div className="ts-score-summary">
        <strong>
          {a ? Math.round(p.overall || 0) : '—'}
          <small>{a ? '/ 100' : 'Unassessed'}</small>
        </strong>
        <div>
          <span>Evidence score</span>
          <small className="ts-muted">
            {a
              ? `${p.coverage}% evidence coverage`
              : 'Review the source profile below.'}
          </small>
        </div>
        <button type="button"
          className="ts-link-button"
          onClick={() =>
            panel.current
              ?.querySelector('.ts-evidence')
              ?.scrollIntoView({ block: 'nearest' })
          }
        >
          View evidence ↓
        </button>
      </div>
      {a && <p className="ts-summary">{a.summary}</p>}
      {(a?.quality_concern || a?.internal || old) && (
        <div className="ts-warning">
          {a?.quality_concern && (
            <p>
              <b>Quality concern.</b> {a.quality_note}
            </p>
          )}
          {a?.internal && (
            <p>
              <b>Internal candidate.</b> {a.internal_note}
            </p>
          )}
          {old && (
            <p>
              <b>Earlier criteria.</b> Review feedback to update all assessed
              people together.
            </p>
          )}
        </div>
      )}
      <section className="ts-review">
        <div className="ts-section-heading">
          <h3>Your review</h3>
          <span
            role="status"
            className={saveState?.error ? 'ts-warning-text' : 'ts-muted'}
          >
            {saveState?.text
            || (draft !== undefined
              ? 'Restored draft · not saved'
              : review.updated_at
                ? 'Saved'
                : '')}
          </span>
        </div>
        <div
          className="ts-decisions"
          role="group"
          aria-label={`Decision for ${p.name}`}
        >
          {(
            [
              ['yes', 'Shortlist'],
              ['maybe', 'Maybe'],
              ['no', 'Pass'],
            ] as const
          ).map(([value, label]) => (
            <button type="button"
              key={value}
              aria-pressed={review.triage === value}
              onClick={() => {
                void store.save(p.person_key, {
                  triage: review.triage === value ? '' : value,
                });
              }
              }
            >
              {label}
            </button>
          ))}
        </div>
        <label className="ts-sr" htmlFor="person-notes">
          Notes for {p.name}
        </label>
        <textarea
          id="person-notes"
          value={draft ?? review.notes}
          maxLength={20000}
          placeholder="What stands out? What does the assessment miss?"
          onChange={(e) => {
            void store.note(p.person_key, e.target.value);
          }}
        />
        {draft !== undefined && (saveState?.error || !saveState) && (
          <div className="ts-draft">
            <p>
              Your draft is retained. Last saved note: {review.notes || 'Empty'}
            </p>
            <div className="ts-actions">
              <button type="button" disabled={refreshingReview} onClick={() => {
                setRefreshingReview(true);
                void store.reload().finally(() => setRefreshingReview(false));
              }}>
                Refresh saved review
              </button>
              <button type="button" disabled={refreshingReview}
                onClick={() => {
                  void store.save(p.person_key, { notes: draft });
                }}
              >
                Save this draft
              </button>
            </div>
          </div>
        )}
      </section>
      <section className="ts-evidence">
        <h3>Evidence</h3>
        {a ? (
          Object.entries(a.dimensions).map(([key, dimension]) => (
            <details
              className="ts-dimension"
              key={key}
              open={dimension.basis === 'negative'}
            >
              <summary>
                <span>
                  {data.labels[key]}
                  <small>{data.weights[key]}% weight</small>
                </span>
                <b
                  className={
                    dimension.basis === 'negative' ? 'ts-warning-text' : ''
                  }
                >
                  {dimension.basis === 'no_data'
                    ? 'Unknown'
                    : `${dimension.score} / 5`}
                </b>
              </summary>
              <p>
                <b>{basis[dimension.basis]}.</b> {dimension.evidence}
              </p>
              {dimension.source_fields.length > 0 && (
                <p className="ts-muted ts-small">
                  Source: {dimension.source_fields.map(words).join(', ')}
                </p>
              )}
            </details>
          ))
        ) : (
          <p className="ts-muted">
            No assessment yet. Missing evidence is not a negative finding.
          </p>
        )}
      </section>
      {a && (
        <>
          <details className="ts-disclosure">
            <summary>
              What to investigate <span>{a.questions.length}</span>
            </summary>
            {a.mission && (
              <p>
                <b>Mission · {basis[a.mission.basis]}.</b> {a.mission.note}
              </p>
            )}
            <ul>
              {a.questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </details>
          <details className="ts-disclosure">
            <summary>Assessment flags & quality</summary>
            {Object.entries(a.flags).map(([key, flag]) => (
              <p key={key}>
                <b>
                  {words(key)} · {flag.value ? 'Yes' : 'No'}.
                </b>{' '}
                {flag.note}
              </p>
            ))}
            <p>
              <b>Internal status.</b> {a.internal_note}
            </p>
            <p>
              <b>Quality.</b> {a.quality_note}
            </p>
          </details>
          {a.web_findings.length > 0 && (
            <details className="ts-disclosure">
              <summary>
                Web evidence & identity checks{' '}
                <span>{a.web_findings.length}</span>
              </summary>
              {a.web_findings.map((f, i) => (
                <div key={i}>
                  <p>
                    {f.finding} <ExternalLink url={f.url}>Source</ExternalLink>
                  </p>
                  <p className="ts-muted">
                    {f.checked_at} ·{' '}
                    {f.identity_match
                    || (f.identity_verified
                      ? 'Identity checked'
                      : 'Identity unverified')}
                  </p>
                </div>
              ))}
            </details>
          )}
        </>
      )}
      <details className="ts-disclosure">
        <summary>Full source profile</summary>
        <dl>
          {Object.entries(p.source)
            .filter(([, v]) => v)
            .map(([key, value]) => (
              <div key={key}>
                <dt>{words(key)}</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>
      </details>
    </section>
  );
};
