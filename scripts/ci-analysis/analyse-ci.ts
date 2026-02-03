import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

// --- CLI args ---
const args = process.argv.slice(2);
function getFlag(name: string, defaultVal: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : defaultVal;
}

const LIMIT = parseInt(getFlag('limit', '10'), 10);
const SINCE = getFlag('since', '2025-06-01');
const CACHE_FILE = getFlag('cache-file', './gh-1913-speed-up-build/ci-data.json');
const REPO = 'bluedotimpact/bluedot';

// --- Types ---
interface StepData {
  name: string;
  conclusion: string | null;
  started_at: string;
  completed_at: string;
}

interface JobData {
  id: number;
  name: string;
  conclusion: string | null;
  started_at: string;
  completed_at: string;
  steps: StepData[];
}

interface RunData {
  id: number;
  head_branch: string;
  conclusion: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  run_started_at: string;
  jobs: JobData[];
}

interface PrData {
  number: number;
  head_ref: string;
  state: string;
  draft: boolean;
  created_at: string;
  merged_at: string | null;
  timeline_events: TimelineEvent[];
}

interface TimelineEvent {
  event: string;
  created_at: string;
}

interface CacheData {
  runs: Record<string, RunData>;
  prs: PrData[];
  fetchedAt: string;
}

// --- Helpers ---
function gh(endpoint: string): any {
  const cmd = `gh api "${endpoint}" --paginate`;
  try {
    const result = execSync(cmd, { maxBuffer: 50 * 1024 * 1024, encoding: 'utf-8' });
    return JSON.parse(result);
  } catch (e: any) {
    // --paginate concatenates JSON arrays, which can produce invalid JSON
    // if multiple pages return arrays. Try to fix by wrapping.
    const stdout = e.stdout as string | undefined;
    if (stdout) {
      try {
        // gh --paginate for arrays concatenates them as ][, fix:
        const fixed = '[' + stdout.replace(/\]\s*\[/g, ',') + ']';
        const parsed = JSON.parse(fixed);
        // Flatten if array of arrays
        return Array.isArray(parsed[0]) ? parsed.flat() : parsed;
      } catch {
        // fall through
      }
    }
    throw e;
  }
}

function ghSingle(endpoint: string): any {
  const cmd = `gh api "${endpoint}"`;
  const result = execSync(cmd, { maxBuffer: 50 * 1024 * 1024, encoding: 'utf-8' });
  return JSON.parse(result);
}

function ghPaginate(endpoint: string): any[] {
  const results: any[] = [];
  let page = 1;
  while (true) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const url = `${endpoint}${sep}per_page=100&page=${page}`;
    const data = ghSingle(url);
    if (Array.isArray(data)) {
      if (data.length === 0) break;
      results.push(...data);
      if (data.length < 100) break;
    } else if (data.workflow_runs) {
      if (data.workflow_runs.length === 0) break;
      results.push(...data.workflow_runs);
      if (data.workflow_runs.length < 100) break;
    } else if (data.jobs) {
      if (data.jobs.length === 0) break;
      results.push(...data.jobs);
      if (data.jobs.length < 100) break;
    } else {
      results.push(data);
      break;
    }
    page++;
  }
  return results;
}

function durationSec(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 1000;
}

function formatDuration(sec: number): string {
  if (sec < 0) return `-${formatDuration(-sec)}`;
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return s > 0 ? `${m}m${s}s` : `${m}m`;
}

function categorizeStep(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('install npm')) return 'install';
  if (lower.includes('build')) return 'build';
  if (lower.includes('test')) return 'test';
  if (lower.includes('lint')) return 'lint';
  if (lower.includes('checkout')) return 'checkout';
  if (lower.includes('setup node')) return 'setup';
  if (lower.includes('cache turbo')) return 'cache';
  if (lower.includes('affected')) return 'affected';
  if (lower.includes('secret')) return 'secrets';
  return 'other';
}

// --- Load/save cache ---
function loadCache(): CacheData {
  if (existsSync(CACHE_FILE)) {
    return JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
  }
  return { runs: {}, prs: [], fetchedAt: '' };
}

function saveCache(cache: CacheData): void {
  cache.fetchedAt = new Date().toISOString();
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// --- Main ---
async function main() {
  const cache = loadCache();
  console.error(`Cache has ${Object.keys(cache.runs).length} runs, ${cache.prs.length} PRs`);

  // 1. Fetch workflow runs
  console.error(`Fetching CI workflow runs since ${SINCE}...`);

  // First, find the CI workflow ID
  const workflows = ghSingle(`/repos/${REPO}/actions/workflows`);
  const ciWorkflow = workflows.workflows.find((w: any) => w.path === '.github/workflows/ci_cd.yaml');
  if (!ciWorkflow) throw new Error('CI workflow not found');
  console.error(`CI workflow ID: ${ciWorkflow.id}`);

  const allRuns = ghPaginate(
    `/repos/${REPO}/actions/workflows/${ciWorkflow.id}/runs?created=%3E%3D${SINCE}&status=completed`
  );
  console.error(`Found ${allRuns.length} completed runs total`);

  const runs = LIMIT > 0 ? allRuns.slice(0, LIMIT) : allRuns;
  console.error(`Processing ${runs.length} runs`);

  // 2. Fetch jobs for each run (skip cached)
  let fetched = 0;
  for (const run of runs) {
    const id = String(run.id);
    if (cache.runs[id]) continue;

    const jobsData = ghPaginate(`/repos/${REPO}/actions/runs/${run.id}/jobs`);
    cache.runs[id] = {
      id: run.id,
      head_branch: run.head_branch,
      conclusion: run.conclusion,
      status: run.status,
      created_at: run.created_at,
      updated_at: run.updated_at,
      run_started_at: run.run_started_at,
      jobs: jobsData.map((j: any) => ({
        id: j.id,
        name: j.name,
        conclusion: j.conclusion,
        started_at: j.started_at,
        completed_at: j.completed_at,
        steps: (j.steps || []).map((s: any) => ({
          name: s.name,
          conclusion: s.conclusion,
          started_at: s.started_at,
          completed_at: s.completed_at,
        })),
      })),
    };
    fetched++;
    if (fetched % 10 === 0) {
      console.error(`  Fetched jobs for ${fetched} runs...`);
      saveCache(cache);
    }
  }
  if (fetched > 0) {
    console.error(`Fetched jobs for ${fetched} new runs`);
    saveCache(cache);
  }

  // 3. Fetch PRs and timeline events — only for branches we have runs on
  const runIds = LIMIT > 0 ? runs.map((r: any) => String(r.id)) : Object.keys(cache.runs);
  const branchesNeeded = new Set(
    runIds.map(id => cache.runs[id]?.head_branch).filter((b): b is string => !!b && b !== 'master' && b !== 'main')
  );
  const cachedBranches = new Set(cache.prs.map(pr => pr.head_ref));
  const missingBranches = [...branchesNeeded].filter(b => !cachedBranches.has(b));

  if (missingBranches.length > 0) {
    console.error(`Fetching PRs for ${missingBranches.length} branches...`);
    // Fetch PRs in batches using search API — one query per branch
    for (const branch of missingBranches) {
      try {
        const prs = ghPaginate(`/repos/${REPO}/pulls?state=all&head=bluedotimpact:${branch}`);
        for (const pr of prs) {
          let timelineEvents: TimelineEvent[] = [];
          try {
            const timeline = ghPaginate(`/repos/${REPO}/issues/${pr.number}/timeline`);
            timelineEvents = timeline
              .filter((e: any) => e.event === 'ready_for_review')
              .map((e: any) => ({ event: e.event, created_at: e.created_at }));
          } catch {
            // timeline API can fail, just skip
          }
          cache.prs.push({
            number: pr.number,
            head_ref: pr.head?.ref ?? pr.head_ref,
            state: pr.state,
            draft: pr.draft,
            created_at: pr.created_at,
            merged_at: pr.merged_at,
            timeline_events: timelineEvents,
          });
        }
      } catch {
        // branch may not have a PR
      }
    }
    saveCache(cache);
    console.error(`Cache now has ${cache.prs.length} PRs`);
  }

  // 4. Build branch → PR map
  const branchToPr = new Map<string, PrData>();
  for (const pr of cache.prs) {
    branchToPr.set(pr.head_ref, pr);
  }

  // 5. Filter to meaningful runs
  const meaningfulRuns: RunData[] = [];

  for (const id of runIds) {
    const run = cache.runs[id];
    if (!run) continue;

    // Exclude master
    if (run.head_branch === 'master' || run.head_branch === 'main') continue;

    // Exclude cancelled
    if (run.conclusion === 'cancelled') continue;

    // Must have associated PR
    const pr = branchToPr.get(run.head_branch);
    if (!pr) continue;

    // PR must have been open (not draft) at time of run
    const runTime = new Date(run.created_at).getTime();
    let undraftTime: number;
    const readyEvent = pr.timeline_events.find(e => e.event === 'ready_for_review');
    if (readyEvent) {
      undraftTime = new Date(readyEvent.created_at).getTime();
    } else if (!pr.draft) {
      // Was never draft — use PR creation time
      undraftTime = new Date(pr.created_at).getTime();
    } else {
      // Still draft, skip
      continue;
    }
    if (runTime < undraftTime) continue;

    // Exclude runs where all steps < 5s
    const ciJob = run.jobs.find(j => j.name === 'ci');
    if (ciJob) {
      const allTrivial = ciJob.steps.every(s => {
        if (!s.started_at || !s.completed_at) return true;
        return durationSec(s.started_at, s.completed_at) < 5;
      });
      if (allTrivial) continue;
    }

    meaningfulRuns.push(run);
  }

  console.error(`\n${meaningfulRuns.length} meaningful runs out of ${runIds.length} total\n`);

  // 6. Output per-run stats
  console.log('# CI Run Analysis\n');
  console.log(`Runs since ${SINCE}, ${meaningfulRuns.length} meaningful runs\n`);

  for (const run of meaningfulRuns) {
    const ciJob = run.jobs.find(j => j.name === 'ci');
    if (!ciJob) continue;

    const totalDur = ciJob.started_at && ciJob.completed_at
      ? durationSec(ciJob.started_at, ciJob.completed_at)
      : 0;

    const stepDurations: Record<string, number> = {};
    let failedStep = '';

    for (const step of ciJob.steps) {
      const cat = categorizeStep(step.name);
      if (step.started_at && step.completed_at) {
        stepDurations[cat] = (stepDurations[cat] || 0) + durationSec(step.started_at, step.completed_at);
      }
      if (step.conclusion === 'failure') {
        failedStep = cat;
      }
    }

    const result = run.conclusion === 'success' ? '✓' : '✗';
    const branch = run.head_branch.substring(0, 35);
    const failInfo = failedStep ? ` [failed: ${failedStep}]` : '';

    console.log(
      `${result} ${formatDuration(totalDur).padStart(7)} — ${branch.padEnd(35)} install ${formatDuration(stepDurations['install'] || 0).padStart(5)}, build ${formatDuration(stepDurations['build'] || 0).padStart(5)}, test ${formatDuration(stepDurations['test'] || 0).padStart(5)}, lint ${formatDuration(stepDurations['lint'] || 0).padStart(5)}${failInfo}`
    );
  }

  // --- Milestone 2: PR timeline reconstruction ---
  console.log('\n# PR Timelines\n');

  // Group meaningful runs by PR
  const runsByPr = new Map<number, { pr: PrData; runs: RunData[] }>();
  for (const run of meaningfulRuns) {
    const pr = branchToPr.get(run.head_branch);
    if (!pr) continue;
    if (!runsByPr.has(pr.number)) {
      runsByPr.set(pr.number, { pr, runs: [] });
    }
    runsByPr.get(pr.number)!.runs.push(run);
  }

  // Sort runs within each PR by time
  for (const group of runsByPr.values()) {
    group.runs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // Filter to merged PRs only (milestone 2 scope)
  const mergedPrGroups = [...runsByPr.entries()]
    .filter(([, g]) => g.pr.merged_at)
    .sort((a, b) => new Date(b[1].pr.merged_at!).getTime() - new Date(a[1].pr.merged_at!).getTime());

  console.log(`${mergedPrGroups.length} merged PRs with meaningful CI runs\n`);

  interface PrMetrics {
    prNumber: number;
    branch: string;
    totalCiTime: number;
    wastedTime: number;
    ciCycles: number;
    passingCycles: number;
    failingCycles: number;
  }

  const allPrMetrics: PrMetrics[] = [];

  for (const [prNum, group] of mergedPrGroups) {
    const { pr, runs: prRuns } = group;
    console.log(`## PR #${prNum} — ${pr.head_ref}`);
    console.log(`Merged: ${pr.merged_at?.substring(0, 10)} | ${prRuns.length} CI runs\n`);

    let totalCiTime = 0;
    let wastedTime = 0;
    let passingCycles = 0;
    let failingCycles = 0;

    for (const run of prRuns) {
      const ciJob = run.jobs.find(j => j.name === 'ci');
      if (!ciJob) continue;

      const dur = ciJob.started_at && ciJob.completed_at
        ? durationSec(ciJob.started_at, ciJob.completed_at)
        : 0;

      totalCiTime += dur;

      let failedStep = '';
      for (const step of ciJob.steps) {
        if (step.conclusion === 'failure') {
          failedStep = categorizeStep(step.name);
        }
      }

      const passed = run.conclusion === 'success';
      if (passed) passingCycles++; else failingCycles++;
      if (!passed) wastedTime += dur;

      const icon = passed ? '✓' : '✗';
      const failInfo = failedStep ? ` (failed: ${failedStep})` : '';
      console.log(`- ${icon} ${formatDuration(dur)}${failInfo}`);
    }

    console.log(`\nTotal CI time: ${formatDuration(totalCiTime)} | Wasted (failing): ${formatDuration(wastedTime)} | Cycles: ${prRuns.length} (${passingCycles} pass, ${failingCycles} fail)\n`);

    allPrMetrics.push({
      prNumber: prNum,
      branch: pr.head_ref,
      totalCiTime,
      wastedTime,
      ciCycles: prRuns.length,
      passingCycles,
      failingCycles,
    });
  }

  // Summary table
  if (allPrMetrics.length > 0) {
    console.log('## PR Summary\n');
    for (const m of allPrMetrics) {
      const failInfo = m.failingCycles > 0 ? `, ${m.failingCycles} fail` : '';
      const wasteInfo = m.wastedTime > 0 ? `, ${formatDuration(m.wastedTime)} wasted` : '';
      console.log(`- PR #${m.prNumber} (${m.branch.substring(0, 35)}): ${m.ciCycles} runs, ${formatDuration(m.totalCiTime)} total${wasteInfo} (${m.passingCycles} pass${failInfo})`);
    }

    const totalWasted = allPrMetrics.reduce((s, m) => s + m.wastedTime, 0);
    const totalCi = allPrMetrics.reduce((s, m) => s + m.totalCiTime, 0);
    const totalCycles = allPrMetrics.reduce((s, m) => s + m.ciCycles, 0);
    console.log(`\nAcross ${allPrMetrics.length} merged PRs: ${totalCycles} CI runs, ${formatDuration(totalCi)} total CI time, ${formatDuration(totalWasted)} wasted on failures`);
  }

  // --- Milestone 3: Aggregate statistics ---
  console.log('\n# Aggregate Statistics\n');

  // Collect per-run data for aggregation
  interface RunStats {
    id: number;
    month: string; // YYYY-MM
    passed: boolean;
    totalDur: number;
    stepDurations: Record<string, number>;
    failedStep: string;
    timeToFailure: number; // seconds from job start to failed step end
  }

  const allRunStats: RunStats[] = [];

  for (const run of meaningfulRuns) {
    const ciJob = run.jobs.find(j => j.name === 'ci');
    if (!ciJob || !ciJob.started_at || !ciJob.completed_at) continue;

    const totalDur = durationSec(ciJob.started_at, ciJob.completed_at);
    const month = run.created_at.substring(0, 7);
    const stepDurations: Record<string, number> = {};
    let failedStep = '';
    let timeToFailure = 0;

    for (const step of ciJob.steps) {
      const cat = categorizeStep(step.name);
      if (step.started_at && step.completed_at) {
        stepDurations[cat] = (stepDurations[cat] || 0) + durationSec(step.started_at, step.completed_at);
      }
      if (step.conclusion === 'failure' && step.completed_at && ciJob.started_at) {
        failedStep = cat;
        timeToFailure = durationSec(ciJob.started_at, step.completed_at);
      }
    }

    allRunStats.push({
      id: run.id,
      month,
      passed: run.conclusion === 'success',
      totalDur,
      stepDurations,
      failedStep,
      timeToFailure,
    });
  }

  function median(arr: number[]): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  }

  // Duration stats (passing runs only)
  const passingDurations = allRunStats.filter(r => r.passed).map(r => r.totalDur);
  const failingRuns = allRunStats.filter(r => !r.passed);

  console.log('## CI Duration (passing runs)\n');
  console.log(`- Median: ${formatDuration(median(passingDurations))}`);
  console.log(`- p90: ${formatDuration(percentile(passingDurations, 90))}`);
  console.log(`- Count: ${passingDurations.length} passing runs\n`);

  // Failure rate by step
  console.log('## Failure Breakdown\n');
  console.log(`- Total runs: ${allRunStats.length} (${passingDurations.length} pass, ${failingRuns.length} fail)`);
  console.log(`- Failure rate: ${(failingRuns.length / allRunStats.length * 100).toFixed(0)}%\n`);

  const failuresByStep: Record<string, number> = {};
  const timeToFailureByStep: Record<string, number[]> = {};
  for (const r of failingRuns) {
    failuresByStep[r.failedStep] = (failuresByStep[r.failedStep] || 0) + 1;
    if (!timeToFailureByStep[r.failedStep]) timeToFailureByStep[r.failedStep] = [];
    timeToFailureByStep[r.failedStep].push(r.timeToFailure);
  }

  if (failingRuns.length > 0) {
    for (const [step, count] of Object.entries(failuresByStep).sort((a, b) => b[1] - a[1])) {
      const pct = (count / failingRuns.length * 100).toFixed(0);
      const medTtf = formatDuration(median(timeToFailureByStep[step]));
      console.log(`- ${step}: ${count} (${pct}%) — median time to failure ${medTtf}`);
    }
  }

  // Monthly breakdown
  const months = [...new Set(allRunStats.map(r => r.month))].sort();
  console.log('\n## Monthly Breakdown\n');

  for (const month of months) {
    const monthRuns = allRunStats.filter(r => r.month === month);
    const monthPass = monthRuns.filter(r => r.passed);
    const monthFail = monthRuns.filter(r => !r.passed);
    const totalTime = monthRuns.reduce((s, r) => s + r.totalDur, 0);
    const wastedTime = monthFail.reduce((s, r) => s + r.totalDur, 0);
    const medDur = median(monthPass.map(r => r.totalDur));
    const failPct = monthRuns.length > 0 ? (monthFail.length / monthRuns.length * 100).toFixed(0) : '0';
    console.log(`- ${month}: ${monthRuns.length} runs (${monthPass.length} pass, ${monthFail.length} fail, ${failPct}% fail rate) — ${formatDuration(totalTime)} total, ${formatDuration(wastedTime)} wasted, median ${formatDuration(medDur)}`);
  }

  // Developer-hours lost
  const totalPassingTime = allRunStats.filter(r => r.passed).reduce((s, r) => s + r.totalDur, 0);
  const totalFailingTime = failingRuns.reduce((s, r) => s + r.totalDur, 0);
  const totalTime = totalPassingTime + totalFailingTime;
  const monthSpan = months.length || 1;

  console.log('\n## Developer Time Impact\n');
  console.log(`- Total CI time: ${formatDuration(totalTime)} across ${allRunStats.length} runs`);
  console.log(`- Time on passing runs: ${formatDuration(totalPassingTime)}`);
  console.log(`- Time on failing runs (wasted): ${formatDuration(totalFailingTime)}`);
  console.log(`- Per month avg: ${formatDuration(totalTime / monthSpan)} total, ${formatDuration(totalFailingTime / monthSpan)} wasted`);

  // --- Milestone 4: What-if modeling ---
  console.log('\n# What-If Analysis\n');

  // Each intervention transforms the run stats and we recalculate total time
  type Intervention = {
    name: string;
    description: string;
    transform: (run: RunStats) => RunStats;
  };

  // Estimated tsc --noEmit time in CI, based on local benchmarks (~7s) scaled by
  // local-to-CI slowdown factor (~4-5x for CPU-bound TypeScript compilation).
  // Local: tsc website = 7s, CI build website = ~150s but that includes next build bundling.
  // tsc is pure CPU, so CI slowdown is closer to 4x → ~30s.
  const TSC_CI_SECONDS = 30;

  // Helper to simulate running steps in a specific order and calculate total duration.
  // The order array specifies which steps to run and in what sequence.
  // For passing runs: totalDur = baseDur (install+setup etc) + sum of ordered steps
  // For failing runs: totalDur = baseDur + time until the failed step completes
  // baseDur is the time for steps that always run before the ordered ones (install, setup, checkout, affected detection)
  function simulateOrder(r: RunStats, order: string[]): { totalDur: number; timeToFailure: number } {
    // Base duration: everything except the reorderable steps (build/typecheck, test, lint)
    const reorderableSteps = ['build', 'typecheck', 'test', 'lint'];
    let baseDur = 0;
    for (const [step, dur] of Object.entries(r.stepDurations)) {
      if (!reorderableSteps.includes(step)) {
        baseDur += dur;
      }
    }

    let elapsed = baseDur;
    let timeToFailure = 0;
    let failed = false;

    for (const step of order) {
      const stepTime = r.stepDurations[step] || 0;
      elapsed += stepTime;
      if (!failed && r.failedStep === step) {
        failed = true;
        timeToFailure = elapsed;
      }
    }

    // If the run failed in a step not in our order (e.g. 'other'), keep original behavior
    if (!failed && !r.passed) {
      // Failure was in a non-reorderable step; use original time to failure
      return { totalDur: r.totalDur, timeToFailure: r.timeToFailure };
    }

    // For passing runs, totalDur is full elapsed time; for failing, it's timeToFailure
    const totalDur = failed ? timeToFailure : elapsed;
    return { totalDur, timeToFailure: failed ? timeToFailure : 0 };
  }

  const interventions: Intervention[] = [
    {
      name: 'Add tsc before build',
      description: `Run tsc --noEmit (~${TSC_CI_SECONDS}s) before build. Build failures caught earlier; passing runs slightly slower.`,
      transform: (r) => {
        if (r.failedStep === 'build') {
          // Build failure caught by tsc instead — run ends after install + tsc
          const installTime = r.stepDurations['install'] || 0;
          const newDur = installTime + TSC_CI_SECONDS;
          return { ...r, totalDur: newDur, timeToFailure: installTime + TSC_CI_SECONDS };
        }
        // Passing or non-build failure: tsc adds overhead (runs in series before build)
        return { ...r, totalDur: r.totalDur + TSC_CI_SECONDS };
      },
    },
    {
      name: 'Replace build with tsc',
      description: `Drop next build from CI entirely, run tsc --noEmit (~${TSC_CI_SECONDS}s) instead. Rely on CD for build errors.`,
      transform: (r) => {
        const buildTime = r.stepDurations['build'] || 0;
        if (r.failedStep === 'build') {
          // Build failure caught by tsc instead
          const installTime = r.stepDurations['install'] || 0;
          const newDur = installTime + TSC_CI_SECONDS;
          return { ...r, totalDur: newDur, timeToFailure: installTime + TSC_CI_SECONDS };
        }
        // Passing or non-build failure: replace build time with tsc time
        const newDur = Math.max(0, r.totalDur - buildTime + TSC_CI_SECONDS);
        return { ...r, totalDur: newDur, stepDurations: { ...r.stepDurations, build: TSC_CI_SECONDS } };
      },
    },
    {
      name: 'npm ci instant',
      description: 'Zero out the install step (full node_modules cache)',
      transform: (r) => {
        const installTime = r.stepDurations['install'] || 0;
        const newDur = Math.max(0, r.totalDur - installTime);
        const newTtf = Math.max(0, r.timeToFailure - installTime);
        return { ...r, totalDur: newDur, stepDurations: { ...r.stepDurations, install: 0 }, timeToFailure: newTtf };
      },
    },
    // Step ordering interventions (replacing build with tsc, trying different orders)
    {
      name: 'Order: typecheck → test → lint',
      description: `Replace build with tsc (~${TSC_CI_SECONDS}s). Run typecheck first, then test, then lint.`,
      transform: (r) => {
        const newStepDurations = { ...r.stepDurations };
        // Replace build with typecheck
        delete newStepDurations['build'];
        newStepDurations['typecheck'] = TSC_CI_SECONDS;
        // Map build failures to typecheck failures
        const newFailedStep = r.failedStep === 'build' ? 'typecheck' : r.failedStep;
        const newR = { ...r, stepDurations: newStepDurations, failedStep: newFailedStep };
        const { totalDur, timeToFailure } = simulateOrder(newR, ['typecheck', 'test', 'lint']);
        return { ...newR, totalDur, timeToFailure };
      },
    },
    {
      name: 'Order: typecheck → lint → test',
      description: `Replace build with tsc (~${TSC_CI_SECONDS}s). Run typecheck first, then lint, then test.`,
      transform: (r) => {
        const newStepDurations = { ...r.stepDurations };
        delete newStepDurations['build'];
        newStepDurations['typecheck'] = TSC_CI_SECONDS;
        const newFailedStep = r.failedStep === 'build' ? 'typecheck' : r.failedStep;
        const newR = { ...r, stepDurations: newStepDurations, failedStep: newFailedStep };
        const { totalDur, timeToFailure } = simulateOrder(newR, ['typecheck', 'lint', 'test']);
        return { ...newR, totalDur, timeToFailure };
      },
    },
    {
      name: 'Order: lint → typecheck → test',
      description: `Replace build with tsc (~${TSC_CI_SECONDS}s). Run lint first, then typecheck, then test.`,
      transform: (r) => {
        const newStepDurations = { ...r.stepDurations };
        delete newStepDurations['build'];
        newStepDurations['typecheck'] = TSC_CI_SECONDS;
        const newFailedStep = r.failedStep === 'build' ? 'typecheck' : r.failedStep;
        const newR = { ...r, stepDurations: newStepDurations, failedStep: newFailedStep };
        const { totalDur, timeToFailure } = simulateOrder(newR, ['lint', 'typecheck', 'test']);
        return { ...newR, totalDur, timeToFailure };
      },
    },
    {
      name: 'Order: lint → test → typecheck',
      description: `Replace build with tsc (~${TSC_CI_SECONDS}s). Run lint first, then test, then typecheck.`,
      transform: (r) => {
        const newStepDurations = { ...r.stepDurations };
        delete newStepDurations['build'];
        newStepDurations['typecheck'] = TSC_CI_SECONDS;
        const newFailedStep = r.failedStep === 'build' ? 'typecheck' : r.failedStep;
        const newR = { ...r, stepDurations: newStepDurations, failedStep: newFailedStep };
        const { totalDur, timeToFailure } = simulateOrder(newR, ['lint', 'test', 'typecheck']);
        return { ...newR, totalDur, timeToFailure };
      },
    },
    {
      name: 'Order: test → typecheck → lint',
      description: `Replace build with tsc (~${TSC_CI_SECONDS}s). Run test first, then typecheck, then lint.`,
      transform: (r) => {
        const newStepDurations = { ...r.stepDurations };
        delete newStepDurations['build'];
        newStepDurations['typecheck'] = TSC_CI_SECONDS;
        const newFailedStep = r.failedStep === 'build' ? 'typecheck' : r.failedStep;
        const newR = { ...r, stepDurations: newStepDurations, failedStep: newFailedStep };
        const { totalDur, timeToFailure } = simulateOrder(newR, ['test', 'typecheck', 'lint']);
        return { ...newR, totalDur, timeToFailure };
      },
    },
    {
      name: 'Order: test → lint → typecheck',
      description: `Replace build with tsc (~${TSC_CI_SECONDS}s). Run test first, then lint, then typecheck.`,
      transform: (r) => {
        const newStepDurations = { ...r.stepDurations };
        delete newStepDurations['build'];
        newStepDurations['typecheck'] = TSC_CI_SECONDS;
        const newFailedStep = r.failedStep === 'build' ? 'typecheck' : r.failedStep;
        const newR = { ...r, stepDurations: newStepDurations, failedStep: newFailedStep };
        const { totalDur, timeToFailure } = simulateOrder(newR, ['test', 'lint', 'typecheck']);
        return { ...newR, totalDur, timeToFailure };
      },
    },
  ];

  // Calculate baseline
  const baselineTotalTime = allRunStats.reduce((s, r) => s + r.totalDur, 0);
  const baselineWastedTime = allRunStats.filter(r => !r.passed).reduce((s, r) => s + r.totalDur, 0);

  console.log(`Baseline: ${formatDuration(baselineTotalTime)} total, ${formatDuration(baselineWastedTime)} wasted\n`);

  const results: { name: string; saved: number; wastedSaved: number; description: string }[] = [];

  for (const intervention of interventions) {
    const transformed = allRunStats.map(intervention.transform);
    const newTotal = transformed.reduce((s, r) => s + r.totalDur, 0);
    const newWasted = transformed.filter(r => !r.passed).reduce((s, r) => s + r.totalDur, 0);
    const totalSaved = baselineTotalTime - newTotal;
    const wastedSaved = baselineWastedTime - newWasted;

    results.push({ name: intervention.name, saved: totalSaved, wastedSaved, description: intervention.description });
  }

  results.sort((a, b) => b.saved - a.saved);
  for (const r of results) {
    const perMonth = formatDuration(r.saved / monthSpan);
    const wastePerMonth = formatDuration(r.wastedSaved / monthSpan);
    console.log(`- **${r.name}**: ${formatDuration(r.saved)} total saved (${perMonth}/month), ${formatDuration(r.wastedSaved)} wasted saved (${wastePerMonth}/month)`);
    console.log(`  ${r.description}`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
