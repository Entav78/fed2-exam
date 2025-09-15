export function rewriteCdnUrl(url: string, w: number, h?: number) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');

    if (host.endsWith('images.unsplash.com') || host.endsWith('unsplash.com')) {
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', String(w));
      if (h) u.searchParams.set('h', String(h));
      return u.toString();
    }

    if (host.endsWith('images.pexels.com') || host.endsWith('pexels.com')) {
      // Pexels accepts these canonical params
      u.searchParams.set('auto', 'compress');
      u.searchParams.set('cs', 'tinysrgb');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', String(w));
      if (h) u.searchParams.set('h', String(h));
      return u.toString();
    }

    return url; // unknown host → leave as-is
  } catch {
    return url;
  }
}

export function makeSrcSet(url: string, widths: number[], heightForWidth?: (w: number) => number) {
  return widths
    .map((w) => {
      const h = heightForWidth ? heightForWidth(w) : undefined;
      return `${rewriteCdnUrl(url, w, h)} ${w}w`;
    })
    .join(', ');
}
