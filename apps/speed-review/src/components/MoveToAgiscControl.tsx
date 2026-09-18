import { useEffect, useState } from 'react';
import { authFetch } from '../lib/client/api';

type Round = { id: string; name: string };

type MoveToAgiscControlProps = {
  applicationId: string;
  allowMoveToAgisc: boolean;
  onMoved: (roundName: string) => void;
};

export const MoveToAgiscControl: React.FC<MoveToAgiscControlProps> = ({
  applicationId,
  allowMoveToAgisc,
  onMoved,
}) => {
  const [agiscRounds, setAgiscRounds] = useState<Round[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus('idle');
    setError(null);
  }, [applicationId]);

  useEffect(() => {
    authFetch('/api/rounds')
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`);
        return r.json();
      })
      .then((data: { rounds: Round[] }) => {
        setAgiscRounds(data.rounds.filter((r) => r.name.includes('AGI Strategy')));
      })
      // eslint-disable-next-line no-console
      .catch(console.error);
  }, []);

  const handleMove = async () => {
    if (!selectedRoundId) return;
    setStatus('loading');
    setError(null);

    try {
      const res = await authFetch('/api/move-to-agisc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, roundId: selectedRoundId }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`${res.status}: ${body || res.statusText}`);
      }

      const roundName = agiscRounds.find((r) => r.id === selectedRoundId)?.name ?? 'AGI Strategy';
      onMoved(roundName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move application');
      setStatus('error');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {allowMoveToAgisc ? (
          <span className="text-green-400 text-size-sm font-medium">&#10003; Allows move to AGISC</span>
        ) : (
          <span className="text-red-400 text-size-sm font-medium">&#10007; Does not allow move to AGISC</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <label className="text-size-xs text-stone-400 shrink-0" htmlFor="agisc-round-select">Move to:</label>
        <select
          id="agisc-round-select"
          value={selectedRoundId}
          onChange={(e) => setSelectedRoundId(e.target.value)}
          className="flex-1 bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-size-sm text-stone-200 focus:outline-none focus:border-stone-400"
        >
          <option value="">Select a round…</option>
          {agiscRounds.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selectedRoundId || status === 'loading'}
          onClick={handleMove}
          className="shrink-0 px-4 py-2 rounded-lg text-size-sm font-semibold border border-amber-700 text-amber-300 bg-amber-950 hover:bg-amber-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Moving…' : 'Move to AGI Strategy'}
        </button>
      </div>

      {error && (
        <p className="text-size-xs text-red-400">{error}</p>
      )}
    </div>
  );
};
