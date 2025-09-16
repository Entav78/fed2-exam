/** @file AmenitiesList – pill list of venue amenities derived from a meta flags object. */

type Meta = {
  wifi?: boolean;
  parking?: boolean;
  breakfast?: boolean;
  pets?: boolean;
};

type Props = {
  /** Flags indicating which amenities are available. */
  meta?: Meta;
};

/** Static mapping of amenity keys to labels/icons. */
const items: { key: keyof Meta; label: string; icon: string }[] = [
  { key: 'wifi', label: 'Wi-Fi', icon: '📶' },
  { key: 'parking', label: 'Parking', icon: '🅿️' },
  { key: 'breakfast', label: 'Breakfast', icon: '🥐' },
  { key: 'pets', label: 'Pets', icon: '🐾' },
];

/**
 * AmenitiesList
 *
 * Renders enabled amenities as rounded pills. If none are enabled,
 * shows a small muted “No amenities listed.” message.
 */
export default function AmenitiesList({ meta }: Props) {
  const enabled = items.filter((i) => Boolean(meta?.[i.key]));
  if (!enabled.length) return <p className="text-muted text-sm">No amenities listed.</p>;

  return (
    <ul className="flex flex-wrap gap-2">
      {enabled.map(({ key, label, icon }) => (
        <li
          key={String(key)}
          className="rounded-full bg-surface px-3 py-1 text-sm border border-border"
          aria-label={label}
          title={label}
        >
          <span className="mr-1">{icon}</span>
          {label}
        </li>
      ))}
    </ul>
  );
}
