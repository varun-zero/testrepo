import type { IEventDoc } from '@/models/EventModel';
import { listPublishedEvents } from '@/server/services/eventService';

/**
 * Shape expected by the public PastEventsSection client components.
 * Kept identical to their internal `Event` interface so the hardcoded
 * sample fallback continues to work unchanged.
 */
export interface PastEventView {
  id: string;
  title: string;
  year: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  about: string;
  highlights: string[];
  gallery: string[];
  link: string;
}

/** Academic-year label like "2025-26" (Indian academic year starts in June). */
function academicYear(d: Date): string {
  const y = d.getMonth() >= 5 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
}

/**
 * Loads published events that already started (or were created before now)
 * and maps them for the public events listing. Server-side only.
 */
export async function getPastEventsForDisplay(): Promise<PastEventView[]> {
  const now = new Date();
  const events = (await listPublishedEvents()) as unknown as IEventDoc[];

  return events
    .filter((ev) => new Date(ev.startsAt ?? ev.createdAt) < now)
    .slice(0, 24)
    .map((ev) => {
      const start = new Date(ev.startsAt ?? ev.createdAt);
      return {
        id: ev._id.toString(),
        title: ev.title,
        year: academicYear(start),
        date: start.toISOString(),
        time: start.toLocaleTimeString('en-IN', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata',
        }),
        venue: ev.venue || 'VCET, Vasai',
        description: ev.summary || '',
        about: ev.content || ev.summary || '',
        highlights: ev.highlights ?? [],
        gallery: ev.gallery ?? [],
        link: `/events/${ev.slug}`,
      };
    });
}
