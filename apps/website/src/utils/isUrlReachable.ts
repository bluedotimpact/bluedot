export const isUrlReachable = async (url: string, timeoutMs = 3000): Promise<boolean> => {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(timeoutMs) });
    return res.ok;
  } catch {
    return false;
  }
};
