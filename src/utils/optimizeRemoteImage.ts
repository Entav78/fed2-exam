// utils/optimizeRemoteImage.ts
type Opts = { width?: number; height?: number; dpr?: number; quality?: number };

export function optimizeRemoteImage(url: string, opts: Opts = {}): string {
  // Bail if not absolute
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }

  const host = u.hostname;
  const p = u.searchParams;

  // device pixel ratio → cap between 1 and 3
  const dpr = Math.max(
    1,
    Math.min(
      3,
      Math.round(opts.dpr ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)),
    ),
  );
  const targetW = Math.max(1, Math.round((opts.width ?? 640) * dpr));
  const q = Math.max(40, Math.min(85, Math.round(opts.quality ?? 70)));

  // --- DuckDuckGo image proxy: unwrap and re-run ---
  if (host === 'external-content.duckduckgo.com') {
    const orig = u.searchParams.get('u');
    if (orig) {
      try {
        return optimizeRemoteImage(decodeURIComponent(orig), { ...opts, dpr, quality: q });
      } catch {
        return url;
      }
    }
    return url;
  }

  // --- Unsplash (images/plus) ---
  if (host.endsWith('images.unsplash.com') || host.endsWith('plus.unsplash.com')) {
    if (!p.has('auto')) p.set('auto', 'format'); // webp/avif when possible
    p.set('fit', 'max');
    p.set('w', String(targetW));
    if (!p.has('q')) p.set('q', String(q));
    u.search = p.toString();
    return u.toString();
  }

  // --- Pexels ---
  if (host.endsWith('images.pexels.com')) {
    if (!p.has('auto')) p.set('auto', 'compress');
    if (!p.has('cs')) p.set('cs', 'tinysrgb');
    p.set('w', String(targetW));
    if (!p.has('dpr')) p.set('dpr', String(dpr));
    u.search = p.toString();
    return u.toString();
  }

  // --- Pixabay (filename-encoded sizes) ---
  if (/(^|\.)(cdn\.)?pixabay\.com$/.test(host)) {
    // Choose nearest available variant
    // Common sizes: __340, _640, _960_720, _1280
    const desiredW = targetW <= 340 ? 340 : targetW <= 640 ? 640 : targetW <= 960 ? 960 : 1280;

    const path = u.pathname;

    // Match "..._1280.jpg", "..._960_720.jpg", or "...__340.jpg"
    // (note the underscores group is now NON-capturing)
    const m = path.match(/(.*?)(?:_{1,2})(\d{3,4})(?:_(\d{3}))?(\.(?:jpg|jpeg|png))$/i);
    if (m) {
      const [, base, w1, h1, ext] = m; // no unused 'underscores'
      const w1n = parseInt(w1, 10);

      let newPath: string;
      if (h1) {
        // two-number pattern like _960_720 -> keep the ratio
        const h1n = parseInt(h1, 10);
        const newH = Math.max(1, Math.round((h1n / w1n) * desiredW));
        newPath = `${base}_${desiredW}_${newH}${ext}`;
      } else {
        // single-number pattern; "__" is used for 340
        const prefix = desiredW === 340 ? '__' : '_';
        newPath = `${base}${prefix}${desiredW}${ext}`;
      }

      u.pathname = newPath;
      return u.toString();
    }

    // If we can't parse, just return original
    return url;
  }

  // Unknown host: leave as-is
  return url;
}
