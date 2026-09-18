/* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- Imported CSV text uses empty-string fallbacks. */
import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import type {
  AshbyJob,
  Catalog,
  ImportPreview,
  Role,
  TalentApi,
} from './types';
export const Setup = ({
  api,
  jobs,
  initialJob,
  catalog,
  navigate,
  onWorking,
}: {
  api: TalentApi;
  jobs: AshbyJob[];
  initialJob?: AshbyJob;
  catalog: Catalog;
  navigate: (url: string) => Promise<void>;
  onWorking: (working: boolean) => void;
}) => {
  const [jobId, setJobId] = useState(initialJob?.id || '');
  const [pool, setPool] = useState(catalog.configured ? catalog.active_id : 'upload');
  const [descriptionLink, setDescriptionLink] = useState('');
  const [upload, setUpload] = useState<{
    csv: string;
    filename: string;
  } | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [role, setRole] = useState<Role>({
    title: '',
    organization: '',
    brief: '',
    rubric: '',
    dimensions: [],
    sampling_terms: [],
  });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const generation = useRef(0);
  const setWorking = useCallback((working: boolean) => {
    setBusy(working);
    onWorking(working);
  }, [onWorking]);

  const update = (patch: Partial<Role>) => setRole((r) => ({ ...r, ...patch }));
  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    setWorking(true);
    setStatus('Loading the role from Ashby…');
    setDescriptionLink('');
    setRole({
      title: jobs.find((j) => j.id === jobId)?.title || '',
      organization: '',
      brief: '',
      rubric: '',
      dimensions: [],
      sampling_terms: [],
    });
    void api
      .ashbyJob(jobId)
      .then((job) => {
        if (cancelled) return;
        const brief = job.brief?.trim() || '';
        const linkOnly = /^https?:\/\/\S+$/.test(brief);
        update({ title: job.title, brief: linkOnly ? '' : brief });
        if (linkOnly) setDescriptionLink(brief);
        setStatus(linkOnly
          ? 'Ashby links to the role description. Paste its responsibilities below before drafting criteria.'
          : 'Review the role brief and approve its scoring criteria.');
      })
      .catch((error: unknown) => {
        if (!cancelled) setStatus((error instanceof Error ? error.message : 'The role could not be loaded.'));
      })
      .finally(() => {
        if (!cancelled) setWorking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, jobId, jobs, setWorking]);
  async function inspect(file?: File) {
    generation.current += 1;
    const id = generation.current;
    setUpload(null);
    setPreview(null);
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setStatus('Choose a CSV no larger than 20 MB.');
      return;
    }

    setWorking(true);
    setStatus('Reading your CSV…');
    try {
      const csv = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== 'string') {
            reject(Error('Could not read this file.'));
            return;
          }

          resolve(reader.result.split(',')[1] ?? '');
        };

        reader.onerror = () => reject(Error('Could not read this file.'));
        reader.readAsDataURL(file);
      });
      const result = await api.inspect(csv);
      if (id !== generation.current) return;
      setUpload({ csv, filename: file.name });
      setPreview(result);
      setMapping(result.mapping);
      setStatus(`${result.row_count.toLocaleString()} people found. Check the columns below.`);
    } catch (error) {
      if (id === generation.current) setStatus((error as Error).message);
    } finally {
      if (id === generation.current) setWorking(false);
    }
  }

  const total = role.dimensions.reduce((sum, d) => sum + d.weight, 0);
  return (
    <form
      className="ts-setup"
      onSubmit={async (e) => {
        e.preventDefault();
        if ((pool === 'upload' && !upload) || !jobId || busy) return;
        if (total !== 100) {
          setStatus('Dimension weights must add up to 100%.');
          return;
        }

        setWorking(true);
        setStatus('Creating your search…');
        try {
          const result = await api.create({
            ...(pool === 'upload'
              ? { ...upload!, mapping }
              : { source_search_id: pool }),
            role,
            ashby_job_id: jobId,
          });
          setWorking(false);
          await navigate(result.url);
        } catch (error) {
          setStatus((error as Error).message);
        } finally {
          setWorking(false);
        }
      }}
    >
      <p>
        Import people and approve the criteria for this role. Each search keeps
        its own assessments and reviews.
      </p>
      <label>
        Open role in Ashby
        <select
          required
          aria-label="Open role in Ashby"
          value={jobId}
          disabled={busy}
          onChange={(e) => setJobId(e.target.value)}
        >
          <option value="" disabled>
            Choose an open role
          </option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        People to search
        <select
          aria-label="People to search"
          value={pool}
          disabled={busy}
          onChange={(e) => setPool(e.target.value)}
        >
          {catalog.searches.map((search) => (
            <option key={search.id} value={search.id}>
              Reuse {search.pool}
            </option>
          ))}
          <option value="upload">Upload a new CSV</option>
        </select>
      </label>
      {pool !== 'upload' && (
        <p className="ts-muted ts-small">
          Reuses the source people. Assessments and reviews start fresh for this
          role.
        </p>
      )}
      {pool === 'upload' && (
        <label>
          People CSV
          <input
            type="file"
            accept=".csv,.tsv,text/csv,text/tab-separated-values"
            disabled={busy}
            required
            onChange={(e) => {
              void inspect(e.target.files?.[0]);
            }}
          />
        </label>
      )}
      {pool === 'upload' && preview && (
        <>
          <div className="ts-form-grid">
            {Object.entries({
              name: 'Full name',
              first_name: 'First name',
              last_name: 'Last name',
              key: 'Unique ID (optional)',
              email: 'Email (optional)',
              linkedin: 'LinkedIn (optional)',
              headline: 'Current role / headline (optional)',
            }).map(([key, label]) => (
              <label key={key}>
                {label}
                <select
                  aria-label={label}
                  value={mapping[key] || ''}
                  onChange={(e) =>
                    setMapping({ ...mapping, [key]: e.target.value })
                  }
                >
                  <option value="">
                    {key === 'key'
                      ? 'Generate IDs automatically'
                      : 'Not mapped'}
                  </option>
                  {preview.headers.map((header) => (
                    <option key={header}>{header}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p className="ts-muted ts-small">
            Map a full name, or first and last names. A unique ID must be
            different and non-empty for every person. Leave it on “Generate IDs
            automatically” if you are unsure.
          </p>
          <details>
            <summary>Preview imported people</summary>
            <div className="ts-table-scroll">
              <table>
                <thead>
                  <tr>
                    {preview.headers.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((row, i) => (
                    <tr key={i}>
                      {preview.headers.map((h) => (
                        <td key={h}>{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
      <div className="ts-form-grid">
        <label>
          Organization (optional)
          <input
            maxLength={200}
            value={role.organization}
            onChange={(e) => update({ organization: e.target.value })}
          />
        </label>
      </div>
      {descriptionLink && (
        <p>
          <a href={descriptionLink} target="_blank" rel="noreferrer">
            Read the role description ↗
          </a>
        </p>
      )}
      <label>
        Role brief
        <textarea
          required
          aria-label="Role brief"
          minLength={20}
          maxLength={50000}
          value={role.brief}
          onChange={(e) => update({ brief: e.target.value })}
          placeholder="Responsibilities, outcomes and what great looks like."
        />
      </label>
      <div className="ts-actions">
        <button
          type="button"
          disabled={busy || !role.title || role.brief.length < 20}
          onClick={async () => {
            setWorking(true);
            setStatus('Drafting criteria. Keep this window open; no people are being assessed.');
            try {
              const draft = await api.draft({
                title: role.title,
                brief: role.brief,
                organization: role.organization,
              });
              update(draft);
              setStatus('Review and edit these criteria before creating the search.');
            } catch (error) {
              setStatus((error as Error).message);
            } finally {
              setWorking(false);
            }
          }}
        >
          Draft scoring criteria
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            update({
              dimensions: role.dimensions.length
                ? role.dimensions
                : [{ key: 'dimension_1', label: '', weight: 100 }],
            })
          }
        >
          Enter criteria manually
        </button>
      </div>
      {role.dimensions.length > 0 && (
        <>
          <h3>Approve scoring criteria</h3>
          {role.dimensions.map((d, i) => (
            <div key={d.key} className="ts-dimension-editor">
              <label>
                Dimension
                <input
                  required
                  maxLength={100}
                  value={d.label}
                  onChange={(e) =>
                    update({
                      dimensions: role.dimensions.map((x, j) =>
                        j === i ? { ...x, label: e.target.value } : x),
                    })
                  }
                />
              </label>
              <label>
                Weight %
                <input
                  required
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={d.weight}
                  onChange={(e) =>
                    update({
                      dimensions: role.dimensions.map((x, j) =>
                        j === i ? { ...x, weight: Number(e.target.value) } : x),
                    })
                  }
                />
              </label>
              <button
                type="button"
                aria-label={`Remove ${d.label || 'dimension'}`}
                onClick={() =>
                  update({
                    dimensions: role.dimensions.filter((_, j) => j !== i),
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
          <p>Total: {total}% · must equal 100%</p>
          <button
            type="button"
            disabled={role.dimensions.length >= 8}
            onClick={() => {
              let i = 1;
              const existingKeys = new Set(role.dimensions.map((dimension) => dimension.key));
              while (existingKeys.has(`dimension_${i}`)) {
                i += 1;
              }

              update({
                dimensions: [
                  ...role.dimensions,
                  { key: `dimension_${i}`, label: '', weight: 1 },
                ],
              });
            }}
          >
            Add dimension
          </button>
          <label>
            Scoring rubric
            <textarea
              aria-label="Scoring rubric"
              required
              maxLength={100000}
              value={role.rubric}
              onChange={(e) => update({ rubric: e.target.value })}
            />
          </label>
          <label>
            Initial sampling terms (comma-separated)
            <input
              value={role.sampling_terms.join(',')}
              onChange={(e) =>
                update({ sampling_terms: e.target.value.split(',') })
              }
            />
          </label>
          <p className="ts-muted ts-small">
            Sampling helps choose early batches. It does not affect anyone’s
            score.
          </p>
        </>
      )}
      <p role="status">{status}</p>
      <button
        className="ts-primary"
        disabled={
          (pool === 'upload' && !upload)
          || !jobId
          || !role.dimensions.length
          || busy
        }
        type="submit"
      >
        Create search with these criteria
      </button>
      <p className="ts-muted ts-small">
        Creating a search does not start assessments.
      </p>
    </form>
  );
};
