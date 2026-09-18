/* eslint-disable no-nested-ternary -- Preserve the existing Workbench state rendering during the portal move. */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- Imported CSV text uses empty-string fallbacks. */
import {
  useEffect, useMemo, useState, useSyncExternalStore,
} from 'react';
import type {
  AshbyJob, NavigationState, Person, TalentApi,
} from './types';
import { TalentStore } from './store';
import { Profile } from './Profile';
import { Dialog } from './ui';
import { Assess, Criteria, Feedback } from './WorkflowDialogs';
import { Setup } from './Setup';

type Scope = 'scored' | 'all' | 'unscored' | 'added';
const initialFilters = {
  triage: 'all',
  background: 'all',
  sort: 'overall',
  internal: false,
  fit: false,
  connector: false,
  deepDive: false,
  enriched: false,
};
const reviewTabs = [
  ['all', 'All assessed'],
  ['saved', 'Shortlisted'],
  ['unreviewed', 'To review'],
] as const;
const decision = {
  yes: 'Shortlisted', maybe: 'Maybe', no: 'Passed', '': '',
};
const running = (status?: string) =>
  ['reviewing', 'applying', 'cancelling'].includes(status || '');

export type WorkbenchProps = {
  api: TalentApi;
  onNavigate: (searchUrl: string) => void;
  onNavigationStateChange?: (state: NavigationState) => void;
};
/** Content only: the host owns the page shell, routing and authentication. */
export const CandidateWorkbench = ({
  api,
  onNavigate,
  onNavigationStateChange,
}: WorkbenchProps) => {
  const store = useMemo(() => new TalentStore(api), [api]);
  const s = useSyncExternalStore(store.subscribe, store.snapshot);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('scored');
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState('');
  const [mobileDetail, setMobileDetail] = useState(false);
  const [dialog, setDialog] = useState<
    'filters' | 'criteria' | 'feedback' | 'assess' | 'setup' | null
  >(null);
  const [setupJob, setSetupJob] = useState<AshbyJob | undefined>();
  const [setupWorking, setSetupWorking] = useState(false);
  const [dismissed, setDismissed] = useState('');
  useEffect(() => {
    void store.start();
    return () => store.stop();
  }, [store]);
  useEffect(() => {
    if (s.data && !s.data.people.some((p) => p.assessment)) setScope('all');
    // Only a different workspace should reset the chosen view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.data?.workspace.id]);
  useEffect(() => {
    if (s.catalog && !s.catalog.configured) setDialog('setup');
  }, [s.catalog]);
  useEffect(() => {
    onNavigationStateChange?.({
      pendingWrites: s.pending + (setupWorking ? 1 : 0),
      unsavedChanges: setupWorking || Object.keys(s.drafts).length > 0,
      assessmentRunning:
        running(s.assessment?.status) || running(s.feedback?.status),
    });
  }, [
    onNavigationStateChange,
    s.pending,
    s.drafts,
    s.assessment?.status,
    s.feedback?.status,
    setupWorking,
  ]);
  useEffect(() => {
    setSelected('');
    setPage(1);
  }, [query, filters, scope]);
  const { data } = s;
  const live
    = !!s.assessment
      && s.assessment.base_revision === data?.revision
      && ['applying', 'cancelling', 'error'].includes(s.assessment.status);
  const refreshing = live && s.assessment?.mode === 'feedback';
  const rows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const added = new Set(data.newly_assessed_keys || []);
    return data.people
      .map((p): Person =>
        live && s.results[p.person_key] && (!refreshing || scope === 'added')
          ? {
            ...p, ...s.results[p.person_key], live: true, rank: null,
          }
          : p)
      .filter((p) => {
        const a = p.assessment;
        const r = {
          ...s.reviews[p.person_key],
          star:
              s.reviews[p.person_key]?.star
              || s.leads[p.person_key]?.status === 'complete',
        };
        if (
          (scope === 'scored' && !a)
          || (scope === 'unscored' && a)
          || (scope === 'added' && !(live ? p.live : added.has(p.person_key)))
        ) {
          return false;
        }

        if (!filters.internal && (p.internal || a?.internal)) return false;
        if (
          q
          && !`${p.name} ${p.headline || ''} ${Object.values(p.source).join(' ')} ${r?.notes || ''}`
            .toLowerCase()
            .includes(q)
        ) {
          return false;
        }

        if (
          filters.background !== 'all'
          && !(p.backgrounds || []).includes(filters.background)
        ) {
          return false;
        }

        if (filters.triage === 'unreviewed' && (r?.triage || r?.star)) {
          return false;
        }

        if (filters.triage === 'saved' && !r?.star && r?.triage !== 'yes') {
          return false;
        }

        if (
          (filters.triage === 'starred' && !r?.star)
          || (filters.triage === 'notes' && !r.notes?.trim())
        ) {
          return false;
        }

        if (
          ['yes', 'maybe', 'no'].includes(filters.triage)
          && r?.triage !== filters.triage
        ) {
          return false;
        }

        if (
          (filters.fit && !a?.flags.immediate_fit?.value)
          || (filters.connector && !a?.flags.connector?.value)
          || (filters.deepDive && !a?.flags.deep_dive?.value)
          || (filters.enriched && !p.enriched)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) =>
        filters.sort === 'name'
          ? a.name.localeCompare(b.name)
          : (filters.sort === 'overall'
            ? (b.overall ?? -1) - (a.overall ?? -1)
            : (b.assessment?.dimensions[filters.sort]?.score ?? -1)
              - (a.assessment?.dimensions[filters.sort]?.score ?? -1))
            || a.name.localeCompare(b.name));
  }, [
    data,
    live,
    refreshing,
    s.results,
    s.reviews,
    s.leads,
    query,
    scope,
    filters,
  ]);
  const pages = Math.max(1, Math.ceil(rows.length / 50));
  const selectedIndex = rows.findIndex((p) => p.person_key === selected);
  const currentPage
    = selectedIndex >= 0
      ? Math.floor(selectedIndex / 50) + 1
      : Math.min(page, pages);
  const visible = rows.slice((currentPage - 1) * 50, currentPage * 50);
  const person = visible.find((p) => p.person_key === selected) || visible[0];
  useEffect(() => {
    if (!selected && person) setSelected(person.person_key);
  }, [selected, person]);
  const index = person ? rows.indexOf(person) : -1;
  const select = (p: Person) => {
    setSelected(p.person_key);
    setMobileDetail(true);
  };

  const move = (offset: number) => {
    const target = rows[index + offset];
    if (target) {
      setPage(Math.floor((index + offset) / 50) + 1);
      select(target);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        dialog
        || e.metaKey
        || e.ctrlKey
        || e.altKey
        || (e.target instanceof HTMLElement
          && (e.target.isContentEditable
            || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)))
      ) {
        return;
      }

      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        move(e.key === 'j' ? 1 : -1);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });
  const reset = () => {
    setFilters(initialFilters);
    setQuery('');
    setScope('scored');
    setPage(1);
  };

  const setView = (value: Scope) => {
    setScope(value);
    setPage(1);
    setSelected('');
    setMobileDetail(false);
  };

  const activeTab = scope === 'scored' ? filters.triage : null;
  const hasActiveTab = reviewTabs.some(([value]) => value === activeTab);
  const selectTab = (triage: string) => {
    setFilters({ ...filters, triage });
    setView('scored');
  };

  const filterCount
    = Object.entries(filters).filter(([key, value]) =>
      !(key === 'triage' && hasActiveTab)
      && value !== initialFilters[key as keyof typeof initialFilters]).length + (scope === 'scored' ? 0 : 1);
  const assessed = data?.people.filter((p) => p.assessment).length || 0;
  const busy
    = s.busy || running(s.assessment?.status) || running(s.feedback?.status);
  const navigate = async (url: string) => {
    try {
      await store.requireSaved();
      onNavigate(url);
    } catch {
      await store.reload();
    }
  };

  const showResults = () => {
    reset();
    setFilters({ ...initialFilters, internal: true });
    setView('added');
  };

  const close = () => {
    if (!setupWorking && (dialog !== 'setup' || s.catalog?.configured)) {
      setDialog(null);
    }
  };

  const bannerId = `${s.assessment?.id}:${s.assessment?.status}`;
  return (
    <div className="talent-workbench">
      <div className={`ts-body ${mobileDetail ? 'ts-show-profile' : ''}`}>
        <header className="ts-heading">
          <h1 className="ts-sr">Candidate sourcing</h1>
          <div className="ts-search-tools">
            <label className="ts-sr" htmlFor="search-picker">
              Open role in Ashby
            </label>
            <select
              id="search-picker"
              aria-label="Open role in Ashby"
              title={
                s.ashbyJobs.find((j) => j.id === data?.workspace.ashby_job?.id)
                  ?.title
              }
              value={data?.workspace.ashby_job?.id || ''}
              disabled={
                !s.ashbyJobs.length
                || s.pending > 0
                || Object.keys(s.drafts).length > 0
                || setupWorking
              }
              onChange={(e) => {
                const job = s.ashbyJobs.find((j) => j.id === e.target.value);
                const search = s.catalog?.searches.find((x) => x.ashby_job_id === job?.id);
                if (search) {
                  void navigate(search.url);
                } else {
                  setSetupJob(job);
                  setDialog('setup');
                }
              }}
            >
              {!data?.workspace.ashby_job && (
                <option value="" disabled>
                  Choose an Ashby role
                </option>
              )}
              {data?.workspace.ashby_job
              && !s.ashbyJobs.some((j) => j.id === data.workspace.ashby_job?.id) && (
                <option value={data.workspace.ashby_job.id} disabled>
                  {data.workspace.ashby_job.title}
                  {s.ashbyJobs.length ? ' (closed)' : ''}
                </option>
              )}
              {s.ashbyJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
            {(s.catalog?.searches.filter((x) =>
              x.ashby_job_id === data?.workspace.ashby_job?.id
              && x.ashby_job_id).length || 0) > 1 && (
              <select
                aria-label="People pool"
                value={s.catalog?.active_id}
                onChange={(e) => {
                  const search = s.catalog?.searches.find((x) => x.id === e.target.value);
                  if (search) void navigate(search.url);
                }}
              >
                {s.catalog?.searches
                  .filter((x) => x.ashby_job_id === data?.workspace.ashby_job?.id)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.pool}
                    </option>
                  ))}
              </select>
            )}
            <div className="ts-search-meta">
              <button type="button"
                disabled={!s.catalog || setupWorking || s.pending > 0}
                onClick={() => {
                  setSetupJob(data?.workspace.ashby_job);
                  setDialog('setup');
                }}
              >
                ＋ New search
              </button>
              {data && (
                <span className="ts-pool-count ts-muted">
                  {assessed.toLocaleString()} assessed of{' '}
                  {data.people.length.toLocaleString()} people
                </span>
              )}
            </div>
            <span className="ts-flex" />
            <button type="button" disabled={!data} onClick={() => setDialog('criteria')}>
              Scoring criteria
            </button>
          </div>
          <div className="ts-main-actions">
            <button type="button"
              disabled={!data || s.busy || running(s.assessment?.status)}
              onClick={() => {
                setDialog('feedback');
                if (
                  !s.feedback
                  || ['dismissed', 'cancelled', 'complete'].includes(s.feedback.status)
                ) {
                  void store.feedback('review', { context: '' });
                }
              }}
            >
              Review feedback
            </button>
            <button type="button"
              className="ts-primary"
              disabled={!data || busy}
              onClick={() => setDialog('assess')}
            >
              Assess people
            </button>
          </div>
        </header>
        {s.ashbyError && (
          <div className="ts-warning" role="alert">
            {s.ashbyError}{' '}
            <button type="button" onClick={() => {
              void store.loadAshby();
            }}>
              Reconnect Ashby
            </button>
          </div>
        )}
        {s.error && (
          <div className="ts-error" role="alert">
            <span>{s.error}</span>
            <button type="button" onClick={() => {
              void store.reload();
            }}>Retry / refresh</button>
            <button type="button" onClick={store.clearError} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}
        {s.feedback?.status === 'ready' && (
          <div className="ts-notice">
            <span>Criteria changes ready for your review.</span>
            <button type="button" onClick={() => setDialog('feedback')}>
              View proposed changes
            </button>
          </div>
        )}
        {s.feedback?.status === 'reviewing' && (
          <div className="ts-notice" role="status">
            <span>Reviewing your feedback… You can keep reviewing people.</span>
            <button type="button" onClick={() => setDialog('feedback')}>View progress</button>
          </div>
        )}
        {s.assessment && bannerId !== dismissed && (
          <div
            className={`ts-job ${s.assessment.status === 'error' ? 'ts-warning' : ''}`}
            role="status"
          >
            <div>
              <b>
                {s.assessment.status === 'complete'
                  ? 'Ranking updated'
                  : s.assessment.status === 'cancelled'
                    ? 'Assessment cancelled'
                    : s.assessment.mode === 'feedback'
                      ? 'Updating all assessed people'
                      : 'Assessing people'}
              </b>
              <p>
                {running(s.assessment.status)
                  ? `${s.assessment.completed || 0} of ${s.assessment.count} ready`
                  : s.assessment.message}
              </p>
              {running(s.assessment.status) && (
                <progress
                  value={s.assessment.completed || 0}
                  max={s.assessment.count}
                  aria-label="Assessment progress"
                />
              )}
            </div>
            <div className="ts-actions">
              {(Object.keys(s.results).length > 0
                || s.assessment.status === 'complete') && (
                <button type="button" onClick={showResults}>
                  {s.assessment.mode === 'feedback'
                    ? 'Review finished updates'
                    : 'Review finished people'}
                </button>
              )}
              {running(s.assessment.status) && (
                <button type="button"
                  disabled={s.busy || s.assessment.status === 'cancelling'}
                  onClick={() => {
                    void store.assess('cancel', { job_id: s.assessment!.id });
                  }
                  }
                >
                  {s.assessment.status === 'cancelling'
                    ? 'Cancelling…'
                    : s.assessment.mode === 'feedback'
                      ? 'Cancel update'
                      : 'Cancel assessment'}
                </button>
              )}
              {s.assessment.status === 'error' && (
                <button type="button"
                  disabled={s.busy}
                  onClick={() => {
                    void store.assess('retry', { job_id: s.assessment!.id });
                  }
                  }
                >
                  Retry from saved progress
                </button>
              )}
              {['complete', 'cancelled'].includes(s.assessment.status) && (
                <button type="button"
                  aria-label="Dismiss assessment status"
                  onClick={() => setDismissed(bannerId)}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}
        {refreshing && (
          <p className="ts-ranking-note">
            {scope === 'added'
              ? 'Updated results only. People still being assessed are excluded. Choose All assessed for the previous ranking.'
              : 'Your previous ranking remains active. New criteria and scores will appear together when everyone is ready.'}
          </p>
        )}
        <div className="ts-workspace">
          <section className="ts-people" aria-label="People">
            <div className="ts-list-tools">
              <label className="ts-sr" htmlFor="people-search">
                Search people
              </label>
              <div className="ts-list-search">
                <input
                  id="people-search"
                  type="search"
                  placeholder="Search people or experience…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                />
                <button type="button" onClick={() => setDialog('filters')}>
                  Filters{filterCount ? ` · ${filterCount}` : ''}
                </button>
              </div>
              <div
                className="ts-review-tabs"
                role="tablist"
                aria-label="Review views"
              >
                {reviewTabs.map(([value, label], index) => (
                  <button type="button"
                    key={value}
                    id={`review-tab-${value}`}
                    role="tab"
                    aria-selected={activeTab === value}
                    aria-controls="people-panel"
                    tabIndex={
                      activeTab === value || (!hasActiveTab && index === 0)
                        ? 0
                        : -1
                    }
                    onClick={() => selectTab(value)}
                    onKeyDown={(e) => {
                      const offset
                        = e.key === 'ArrowRight'
                          ? 1
                          : e.key === 'ArrowLeft'
                            ? -1
                            : 0;
                      if (!offset && e.key !== 'Home' && e.key !== 'End') {
                        return;
                      }

                      e.preventDefault();
                      const next
                        = e.key === 'Home'
                          ? 0
                          : e.key === 'End'
                            ? reviewTabs.length - 1
                            : (index + offset + reviewTabs.length)
                              % reviewTabs.length;
                      const nextTab = reviewTabs[next];
                      if (!nextTab) return;
                      selectTab(nextTab[0]);
                      e.currentTarget.parentElement
                        ?.querySelectorAll<HTMLButtonElement>('[role=tab]')[next]?.focus();
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="ts-list-meta">
              <span>
                {scope === 'all'
                  ? 'Everyone · '
                  : scope === 'unscored'
                    ? 'Unassessed · '
                    : scope === 'added'
                      ? 'Latest results · '
                      : ''}
                {rows.length.toLocaleString()} people
              </span>
              <span>
                {filters.sort === 'overall'
                  ? 'Highest score first'
                  : filters.sort === 'name'
                    ? 'A–Z'
                    : data?.labels[filters.sort]}
              </span>
            </div>
            <div
              className="ts-person-list"
              id="people-panel"
              role={hasActiveTab ? 'tabpanel' : undefined}
              aria-labelledby={
                hasActiveTab ? `review-tab-${activeTab}` : undefined
              }
            >
              {s.loading ? (
                <p className="ts-empty" role="status">
                  Loading people…
                </p>
              ) : !visible.length ? (
                <div className="ts-empty">
                  <h2>
                    {data ? 'No people match' : 'Your shortlist starts here'}
                  </h2>
                  <p>
                    {data
                      ? 'Try a different search or widen the filters.'
                      : 'Import a CSV to create your first search.'}
                  </p>
                  <button type="button" onClick={data ? reset : () => setDialog('setup')}>
                    {data ? 'Reset filters' : 'New search'}
                  </button>
                </div>
              ) : (
                visible.map((p) => (
                  <button type="button"
                    key={p.person_key}
                    className="ts-person-row"
                    data-person={p.person_key}
                    aria-current={
                      p.person_key === person?.person_key ? 'true' : undefined
                    }
                    onClick={() => select(p)}
                  >
                    <span className="ts-person-main">
                      <strong>
                        {p.name}
                        {s.leads[p.person_key]?.status === 'complete'
                          ? ' ★'
                          : ''}
                      </strong>
                      <span className="ts-person-role">
                        {p.headline
                        || p.source.current_role_or_status
                        || p.source.linkedin_headline
                        || p.assessment?.summary
                        || 'Not yet assessed'}
                      </span>
                      <span className="ts-row-flags">
                        {p.assessment?.quality_concern && (
                          <span className="ts-warning-text">
                            Quality concern
                          </span>
                        )}
                        {p.assessment?.internal && (
                          <span className="ts-warning-text">Internal</span>
                        )}
                        {p.live && <span>Ranking pending</span>}
                        {!p.live
                        && p.assessed_with
                        && data?.criteria_version
                        && p.assessed_with !== data.criteria_version && (
                          <span className="ts-warning-text">
                            Earlier criteria
                          </span>
                        )}
                        {s.reviews[p.person_key]?.triage && (
                          <span>
                            {decision[s.reviews[p.person_key]?.triage ?? '']}
                          </span>
                        )}
                        {s.saves[p.person_key]?.error && (
                          <span className="ts-warning-text">
                            Review not saved
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="ts-row-score">
                      {p.assessment ? Math.round(p.overall || 0) : '—'}
                    </span>
                  </button>
                ))
              )}
            </div>
            <nav className="ts-pagination" aria-label="People pages">
              <span>
                {rows.length
                  ? `${(currentPage - 1) * 50 + 1}–${Math.min(currentPage * 50, rows.length)} of ${rows.length}`
                  : '0 people'}
              </span>
              <div className="ts-actions">
                <button type="button"
                  aria-label="Previous page"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    setPage(currentPage - 1);
                    setSelected('');
                  }}
                >
                  ←
                </button>
                <span>
                  {currentPage} / {pages}
                </span>
                <button type="button"
                  aria-label="Next page"
                  disabled={currentPage >= pages}
                  onClick={() => {
                    setPage(currentPage + 1);
                    setSelected('');
                  }}
                >
                  →
                </button>
              </div>
            </nav>
          </section>
          {person && data ? (
            <Profile
              lead={s.leads[person.person_key]}
              leadBlocked={!!person.live && refreshing}
              key={person.person_key}
              person={person}
              data={data}
              review={store.review(person.person_key)}
              draft={s.drafts[person.person_key]}
              saveState={s.saves[person.person_key]}
              store={store}
              previous={index > 0 ? () => move(-1) : undefined}
              next={index + 1 < rows.length ? () => move(1) : undefined}
              back={() => setMobileDetail(false)}
            />
          ) : (
            <section className="ts-profile ts-empty">
              <p>
                Select a person to review their evidence and add your feedback.
              </p>
            </section>
          )}
        </div>
        {dialog && (
          <Dialog
            title={
              {
                filters: 'Filter people',
                criteria: 'Scoring criteria',
                feedback: 'Review feedback',
                assess: 'Assess people',
                setup: 'New search',
              }[dialog]
            }
            onClose={close}
          >
            {s.error && (
              <p className="ts-warning" role="alert">
                {s.error}
              </p>
            )}
            {dialog === 'filters' && (
              <>
                <div className="ts-form-grid">
                  <label>
                    People to show
                    <select
                      aria-label="People to show"
                      value={scope}
                      onChange={(e) => setView(e.target.value as Scope)}
                    >
                      <option value="scored">Assessed people</option>
                      <option value="all">Everyone</option>
                      <option value="unscored">Not yet assessed</option>
                      <option value="added">Latest results</option>
                    </select>
                  </label>
                  <label>
                    Your review
                    <select
                      value={filters.triage}
                      onChange={(e) => {
                        setFilters({ ...filters, triage: e.target.value });
                        setPage(1);
                      }}
                    >
                      {Object.entries({
                        all: 'Any review',
                        unreviewed: 'To review',
                        starred: 'Starred',
                        saved: 'Shortlisted',
                        maybe: 'Maybe',
                        no: 'Passed',
                        notes: 'Has notes',
                      }).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Sort by
                    <select
                      value={filters.sort}
                      onChange={(e) => {
                        setFilters({ ...filters, sort: e.target.value });
                        setPage(1);
                      }}
                    >
                      <option value="overall">Evidence score</option>
                      {Object.entries(data?.labels || {}).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value}
                        </option>
                      ))}
                      <option value="name">Name</option>
                    </select>
                  </label>
                  <label>
                    Background
                    <select
                      value={filters.background}
                      onChange={(e) => {
                        setFilters({ ...filters, background: e.target.value });
                        setPage(1);
                      }}
                    >
                      <option value="all">All backgrounds</option>
                      {[
                        ...new Set(data?.people.flatMap((p) => p.backgrounds || [])
                          || []),
                      ]
                        .sort()
                        .map((b) => (
                          <option key={b}>{b}</option>
                        ))}
                    </select>
                  </label>
                </div>
                <div className="ts-checks">
                  {(
                    [
                      ['internal', 'Include internal candidates'],
                      ['fit', 'Immediate fit'],
                      ['connector', 'Connectors'],
                      ['deepDive', 'Needs a deep dive'],
                      ['enriched', 'Web-enriched'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key}>
                      <input
                        type="checkbox"
                        checked={filters[key]}
                        onChange={(e) => {
                          setFilters({ ...filters, [key]: e.target.checked });
                          setPage(1);
                        }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="ts-actions">
                  <button type="button" className="ts-primary" onClick={close}>
                    Show {rows.length} people
                  </button>
                  <button type="button" onClick={reset}>Reset filters</button>
                </div>
              </>
            )}
            {dialog === 'criteria' && data && <Criteria data={data} />}
            {dialog === 'feedback' && data && (
              <Feedback
                job={s.feedback}
                data={data}
                store={store}
                busy={busy}
                close={close}
              />
            )}
            {dialog === 'assess' && data && (
              <Assess data={data} store={store} busy={busy} close={close} />
            )}
            {dialog === 'setup' && (
              <Setup
                jobs={s.ashbyJobs}
                initialJob={setupJob}
                catalog={s.catalog!}
                api={api}
                navigate={navigate}
                onWorking={setSetupWorking}
              />
            )}
          </Dialog>
        )}
      </div>
    </div>
  );
};
