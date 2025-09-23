import { type BookingLite, getMyVenues, type Venue } from '@/lib/api/venues';

/** Row for a manager’s upcoming booking panel. */
export type ManagerUpcomingRow = {
  venueId: string;
  venueName: string;
  booking: BookingLite;
};

/**
 * Upcoming = bookings that are **in the future or currently active**.
 * - We treat "today" as the start of the day (local) so a checkout later today is still upcoming.
 */
function isUpcomingOrActive(b: BookingLite, now = new Date()): boolean {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const start = Date.parse(b.dateFrom);
  const end = Date.parse(b.dateTo);
  // active if now is within [start, end], upcoming if start >= today
  return end >= todayStart || start >= todayStart;
}

/**
 * Get **upcoming (or active)** bookings across venues owned by a profile.
 * Results are flattened and sorted by `dateFrom` ASC.
 *
 * @param profileName - Manager’s profile name (username).
 * @returns Array of rows: { venueId, venueName, booking }
 */
export async function getManagerUpcomingBookings(
  profileName: string,
): Promise<ManagerUpcomingRow[]> {
  const venues: Venue[] = await getMyVenues(profileName, true); // includes bookings

  const rows: ManagerUpcomingRow[] = [];
  for (const v of venues) {
    for (const b of v.bookings ?? []) {
      if (isUpcomingOrActive(b)) {
        rows.push({
          venueId: v.id,
          venueName: v.name,
          booking: b,
        });
      }
    }
  }

  rows.sort((a, b) => Date.parse(a.booking.dateFrom) - Date.parse(b.booking.dateFrom));
  return rows;
}
