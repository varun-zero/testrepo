import type { Metadata } from 'next';
import Events from '@/components/events/Events';
import { APP_CONFIG } from '@/lib/constants';
import { getPastEventsForDisplay, type PastEventView } from '@/lib/event-display';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Events & Hackathons',
  description: 'Explore upcoming flagship hackathons, technical competitions, coding contests, and workshops organized by VCET NSDC Student Chapter at Vasai Road.',
  keywords: ['VCET NSDC Events', 'Byteverse Hackathon', 'Coding Competitions Vasai', 'Engineering Events Mumbai', ...APP_CONFIG.keywords],
  openGraph: {
    title: 'Events & Hackathons | VCET NSDC',
    description: 'Explore upcoming flagship hackathons, technical competitions, coding contests, and workshops organized by VCET NSDC.',
    url: `${APP_CONFIG.url}/events`,
    siteName: APP_CONFIG.name,
  },
};

export default async function EventsPage() {
  let pastEvents: PastEventView[] = [];
  try {
    pastEvents = await getPastEventsForDisplay();
  } catch {
    // DB unavailable — the section falls back to its curated sample content.
    pastEvents = [];
  }

  return (
    <div>
      <h1 className="sr-only">Events &amp; Hackathons by VCET NSDC</h1>
      <Events pastEvents={pastEvents} />
    </div>
  );
}
