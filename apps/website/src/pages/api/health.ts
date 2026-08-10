import type { NextApiRequest, NextApiResponse } from 'next';

// Used by the k8s readiness probe. Deliberately has no external dependencies
// (db, Airtable): readiness should reflect whether the app can serve requests,
// not whether upstream systems are up.
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ status: 'ok' });
}
