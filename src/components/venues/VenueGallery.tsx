import { useState } from 'react';

import type { Media } from '@/lib/api/venues';

type Props = { media?: Media[]; name: string };

export default function VenueGallery({ media = [], name }: Props) {
  const items = media.length ? media : [{ url: '/img/placeholder.jpg', alt: name }];
  const [active, setActive] = useState(0);
  const current = items[Math.min(active, items.length - 1)];

  return (
    <div>
      <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-border-light">
        <img
          src={current.url}
          alt={current.alt || name}
          className="h-full w-full object-cover"
          loading="eager"
        />
      </div>

      {items.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto">
          {items.map((m, i) => (
            <li key={m.url}>
              <button
                onClick={() => setActive(i)}
                className={`h-16 w-24 overflow-hidden rounded border ${
                  i === active ? 'ring-2 ring-brand' : 'border-border-light'
                }`}
                aria-label={`Show image ${i + 1}`}
              >
                <img src={m.url} alt={m.alt || name} className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
