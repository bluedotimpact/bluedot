/* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- Imported CSV text uses empty-string fallbacks. */
import { ApiError } from './api';
import type {
  AshbyJob,
  AshbyLead,
  Person,
  AssessmentJob,
  Catalog,
  Dataset,
  FeedbackJob,
  Result,
  Review,
  TalentApi,
} from './types';
export const emptyReview: Review = {
  star: false,
  triage: '',
  notes: '',
  version: 0,
};
const active = (status?: string) =>
  ['reviewing', 'applying', 'cancelling'].includes(status || '');
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
type Snapshot = {
  ashbyJobs: AshbyJob[];
  ashbyError: string;
  leads: Record<string, AshbyLead>;
  data: Dataset | null;
  catalog: Catalog | null;
  reviews: Record<string, Review>;
  drafts: Record<string, string>;
  saves: Record<string, { text: string; error: boolean }>;
  assessment: AssessmentJob | null;
  feedback: FeedbackJob | null;
  results: Record<string, Result>;
  loading: boolean;
  error: string;
  busy: boolean;
  pending: number;
};

/** One instance per mounted search. All writes are serialized per person. */
export class TalentStore {
  private state: Snapshot = {
    ashbyJobs: [],
    ashbyError: '',
    leads: {},
    data: null,
    catalog: null,
    reviews: {},
    drafts: {},
    saves: {},
    assessment: null,
    feedback: null,
    results: {},
    loading: true,
    error: '',
    busy: false,
    pending: 0,
  };

  private exporting = new Set<string>();
  private listeners = new Set<() => void>();
  private queues = new Map<string, Promise<void>>();
  private blocked = new Set<string>();
  private cursor = 0;
  private resultsJob = '';
  private timer?: ReturnType<typeof setTimeout>;
  private stopped = false;
  private polling: Promise<void> | null = null;
  private draftKey = '';
  constructor(public api: TalentApi) {}
  snapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private update(patch: Partial<Snapshot>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  clearError = () => this.update({ error: '' });
  private persist() {
    try {
      localStorage.setItem(this.draftKey, JSON.stringify(this.state.drafts));
    } catch {
      this.update({
        error:
          'This browser could not retain your draft. Keep this tab open until saving succeeds.',
      });
    }
  }

  private async load(background = false) {
    const data = await this.api.data();
    if (this.stopped) return;
    let { drafts } = this.state;
    const key = `bluedot-campus-drafts:${data.workspace.id}`;
    if (this.draftKey !== key) {
      this.draftKey = key;
      try {
        const stored = localStorage.getItem(key);
        const legacy = data.workspace.legacy_draft_key;
        const old
          = !stored && legacy && !localStorage.getItem(`${legacy}:migrated-to`)
            ? JSON.parse(localStorage.getItem(legacy) || '{}')
            : {};
        const ids = new Set(data.people.map((p) => p.person_key));
        drafts = stored
          ? JSON.parse(stored)
          : (Object.fromEntries(Object.entries(old).filter(([id]) => ids.has(id))) as Record<string, string>);
        if (!stored && legacy) {
          localStorage.setItem(key, JSON.stringify(drafts));
          localStorage.setItem(`${legacy}:migrated-to`, data.workspace.id);
        }
      } catch {
        this.update({
          error:
            'Browser drafts could not be restored. Your saved server notes are still available.',
        });
      }
    }

    const reviews = { ...data.reviews };
    if (background) {
      for (const [id, review] of Object.entries(this.state.reviews)) {
        if (!reviews[id] || reviews[id].version <= review.version) {
          reviews[id] = review;
        }
      }
    }

    if (!background) this.blocked.clear();
    this.update({
      data,
      leads: {
        ...data.ashby_leads,
        ...Object.fromEntries(Object.entries(this.state.leads).filter(([key, lead]) =>
          this.exporting.has(key) && lead.status === 'pending')),
      },
      reviews,
      drafts,
      ...(background ? {} : { saves: {} }),
      ...(this.state.assessment?.base_revision !== data.revision
        ? { results: {} }
        : {}),
    });
  }

  async start() {
    this.stopped = false;
    void this.loadAshby();
    try {
      const catalog = await this.api.catalog();
      if (this.stopped) return;
      this.update({ catalog });
      if (catalog.configured) {
        await this.load();
        await this.poll();
      }
    } catch (error) {
      this.update({ error: message(error) });
    } finally {
      this.update({ loading: false });
    }
  }

  stop() {
    this.stopped = true;
    clearTimeout(this.timer);
  }

  async reload() {
    if (!this.state.catalog) return this.start();
    this.update({ error: '' });
    try {
      await this.settle();
      await this.load();
      await this.poll();
      void this.loadAshby();
    } catch (error) {
      this.update({ error: message(error) });
    }
  }

  async loadAshby() {
    try {
      const ashbyJobs = await this.api.ashbyJobs();
      if (!this.stopped) this.update({ ashbyJobs, ashbyError: '' });
    } catch (error) {
      if (!this.stopped) this.update({ ashbyError: message(error) });
    }
  }

  async addLead(person: Person) {
    const key = person.person_key;
    if (['pending', 'complete'].includes(this.state.leads[key]?.status ?? '')) return;
    this.exporting.add(key);
    this.update({
      leads: { ...this.state.leads, [key]: { status: 'pending' } },
      pending: this.state.pending + 1,
    });
    try {
      await this.requireSaved();
      const lead = await this.api.addLead(
        key,
        this.state.data!.revision,
        this.review(key).version,
        person.live ? this.state.assessment?.id : undefined,
      );
      this.update({ leads: { ...this.state.leads, [key]: lead } });
      await this.save(key, { star: true });
    } catch (error) {
      this.update({
        leads: {
          ...this.state.leads,
          [key]: { status: 'error', error: message(error) },
        },
      });
    } finally {
      this.exporting.delete(key);
      this.update({ pending: this.state.pending - 1 });
    }
  }

  review(key: string) {
    return this.state.reviews[key] || emptyReview;
  }

  note(key: string, notes: string) {
    this.update({ drafts: { ...this.state.drafts, [key]: notes } });
    this.persist();
    return this.save(key, { notes });
  }

  save(key: string, patch: Partial<Review>) {
    const saveState = (text: string, error = false) =>
      this.update({ saves: { ...this.state.saves, [key]: { text, error } } });
    if (this.blocked.has(key)) {
      saveState(
        'Another tab changed this review. Refresh and compare your draft before saving.',
        true,
      );
      return Promise.resolve();
    }

    this.update({ pending: this.state.pending + 1 });
    saveState('Saving…');
    const task = (this.queues.get(key) || Promise.resolve())
      .then(async () => {
        if (this.blocked.has(key)) {
          throw Error('Another tab changed this review. Refresh to compare your retained draft.');
        }

        const saved = await this.api.review(
          key,
          this.review(key).version,
          patch,
        );
        const drafts = { ...this.state.drafts };
        if (patch.notes !== undefined && drafts[key] === patch.notes) {
          delete drafts[key];
        }

        this.update({
          reviews: { ...this.state.reviews, [key]: saved },
          drafts,
        });
        this.persist();
        saveState('Saved');
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 409) {
          this.blocked.add(key);
        }

        saveState(message(error), true);
        this.update({
          error: `A review change was not saved. ${message(error)}`,
        });
      })
      .finally(() => {
        this.update({ pending: this.state.pending - 1 });
        if (this.queues.get(key) === task) this.queues.delete(key);
      });
    this.queues.set(key, task);
    return task;
  }

  async settle() {
    await Promise.all([...this.queues.values()]);
  }

  async requireSaved() {
    await this.settle();
    if (
      this.blocked.size
      || Object.keys(this.state.drafts).length
      || Object.values(this.state.saves).some((s) => s.error)
    ) {
      throw Error('Some reviews are not saved. Open the affected profile and resolve its save message first.');
    }
  }

  async poll() {
    if (this.polling) return this.polling;
    const task = this.pollOnce().finally(() => {
      this.polling = null;
    });
    this.polling = task;
    return task;
  }

  private async pollOnce() {
    clearTimeout(this.timer);
    try {
      const [assessment, feedback] = await Promise.all([
        this.api.assessment(),
        this.api.feedback(),
      ]);
      if (this.stopped) return;
      if (assessment?.id !== this.resultsJob) {
        this.resultsJob = assessment?.id || '';
        this.cursor = 0;
        this.update({ results: {} });
      }

      this.update({ assessment, feedback });
      if (
        !this.exporting.size
        && Object.values(this.state.leads).some((lead) => lead.status === 'pending')
      ) {
        await this.load(true);
      }

      if (
        assessment?.status === 'complete'
        && assessment.base_revision === this.state.data?.revision
      ) {
        await this.load(true);
      } else if (
        feedback?.status === 'complete'
        && feedback.base_revision === this.state.data?.revision
      ) {
        await this.load(true);
      }

      const canPreview
        = assessment
          && ['applying', 'cancelling', 'error'].includes(assessment.status)
          && assessment.base_revision === this.state.data?.revision;
      if (canPreview) {
        while ((assessment.ready_count || 0) > this.cursor) {
          // Each page supplies the cursor needed for the next request.
          // eslint-disable-next-line no-await-in-loop
          const page = await this.api.results(assessment.id, this.cursor);
          if (this.stopped) return;
          if (
            page.job_id !== assessment.id
            || page.base_revision !== this.state.data?.revision
            || page.cursor <= this.cursor
          ) {
            break;
          }

          const results = { ...this.state.results };
          for (const result of page.results) {
            results[result.person_key] = result;
          }

          this.cursor = page.cursor;
          this.update({ results });
        }
      } else {
        this.cursor = 0;
        if (Object.keys(this.state.results).length) {
          this.update({ results: {} });
        }
      }
    } catch (error) {
      if (!this.stopped) {
        this.update({
          error: `Could not refresh progress. Saved work is retained. ${message(error)}`,
        });
      }
    }

    if (
      !this.stopped
      && (active(this.state.assessment?.status)
        || active(this.state.feedback?.status)
        || this.state.feedback?.status === 'ready'
        || Object.values(this.state.leads).some((lead) => lead.status === 'pending'))
    ) {
      this.timer = setTimeout(
        () => {
          void this.poll();
        },
        active(this.state.assessment?.status) ? 1000 : 3000,
      );
    }
  }

  async assess(
    action: Parameters<TalentApi['assess']>[0],
    body: Parameters<TalentApi['assess']>[1],
  ) {
    if (this.state.busy) return false;
    this.update({ busy: true, error: '' });
    try {
      if (action !== 'cancel') await this.requireSaved();
      const assessment = await this.api.assess(action, body);
      await this.polling;
      this.update({ assessment });
      await this.poll();
      return true;
    } catch (error) {
      this.update({ error: message(error) });
      return false;
    } finally {
      this.update({ busy: false });
    }
  }

  async feedback(
    action: Parameters<TalentApi['reviewFeedback']>[0],
    body: Parameters<TalentApi['reviewFeedback']>[1],
  ) {
    if (this.state.busy) return false;
    this.update({ busy: true, error: '' });
    try {
      await this.requireSaved();
      const feedback = await this.api.reviewFeedback(action, body);
      await this.polling;
      this.update({ feedback });
      await this.poll();
      return true;
    } catch (error) {
      this.update({ error: message(error) });
      return false;
    } finally {
      this.update({ busy: false });
    }
  }
}
