type Meta = {
  wifi?: boolean;
  parking?: boolean;
  breakfast?: boolean;
  pets?: boolean;
};

const items: { key: keyof Meta; label: string; icon: string }[] = [
  { key: 'wifi', label: 'Wi-Fi', icon: '📶' },
  { key: 'parking', label: 'Parking', icon: '🅿️' },
  { key: 'breakfast', label: 'Breakfast', icon: '🥐' },
  { key: 'pets', label: 'Pets', icon: '🐾' },
];

export default function AmenitiesList({ meta = {} as Meta }) {
  const enabled = items.filter((i) => meta[i.key]);
  if (!enabled.length) return <p className="text-muted text-sm">No amenities listed.</p>;

  return (
    <ul className="flex flex-wrap gap-2">
      {enabled.map(({ key, label, icon }) => (
        <li
          key={String(key)}
          className="rounded-full bg-surface px-3 py-1 text-sm border border-border-light"
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
