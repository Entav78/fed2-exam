type Opts = { width?: number; height?: number; dpr?: number; quality?: number };

export function optimizeRemoteImage(url: string, opts: Opts = {}): string {
  // Bail if it's not an absolute URL we know
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }

  const host = u.hostname;
  const p = u.searchParams;
  const dpr = Math.max(
    1,
    Math.min(
      3,
      Math.round(opts.dpr ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)),
    ),
  );
  const targetW = Math.max(1, Math.round((opts.width ?? 640) * dpr));
  const q = Math.max(40, Math.min(85, Math.round(opts.quality ?? 70)));

  // Unsplash (images/plus)
  if (host.endsWith('images.unsplash.com') || host.endsWith('plus.unsplash.com')) {
    // Keep existing params, just ensure these are set
    if (!p.has('auto')) p.set('auto', 'format'); // webp/avif when possible
    p.set('fit', 'max');
    p.set('w', String(targetW));
    if (!p.has('q')) p.set('q', String(q));
    u.search = p.toString();
    return u.toString();
  }

  // Pexels
  if (host.endsWith('images.pexels.com')) {
    // Docs support: auto=compress, cs=tinysrgb, w, h, dpr, fit=crop|max
    if (!p.has('auto')) p.set('auto', 'compress');
    if (!p.has('cs')) p.set('cs', 'tinysrgb');
    p.set('w', String(targetW));
    // Only set h/fit if you want to enforce cropping to your card aspect
    // p.set('h', String(Math.round((opts.height ?? 256) * dpr)));
    // p.set('fit', 'crop');
    if (!p.has('dpr')) p.set('dpr', String(dpr));
    u.search = p.toString();
    return u.toString();
  }

  // Unknown host: don’t touch
  return url;
}
