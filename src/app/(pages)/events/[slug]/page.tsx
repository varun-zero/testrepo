import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedEventBySlug } from '@/server/services/eventService';
import { SectionRenderer, type PublicEventView, type SectionType } from '@/components/events/dynamic/SectionRenderer';
import { APP_CONFIG } from '@/lib/constants';
import { safeJsonLd } from '@/lib/jsonld';

const DEFAULT_SECTIONS: SectionType[] = ['hero', 'about', 'schedule', 'gallery', 'sponsors', 'faq', 'register'];

interface ThemeSection {
  type: SectionType;
  enabled: boolean;
  order: number;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) return { title: 'Event Not Found' };

  const ev = event as unknown as PublicEventView;
  const title = `${ev.title} | VCET NSDC`;
  const description = ev.summary || `${ev.title} - Official Technical Event / Hackathon hosted by VCET NSDC Student Chapter at Vidyavardhini's College of Engineering and Technology.`;
  const ogImage = ev.coverImage || `${APP_CONFIG.url}/assests/poster.jpg`;

  return {
    title,
    description,
    keywords: [ev.title, 'VCET NSDC Event', 'VCET Hackathon', 'Vasai Hackathon', 'Data Science Event', ...APP_CONFIG.keywords],
    openGraph: {
      title,
      description,
      url: `${APP_CONFIG.url}/events/${slug}`,
      siteName: APP_CONFIG.name,
      images: [{ url: ogImage, width: 1200, height: 630, alt: ev.title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function DynamicEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);
  if (!event) notFound();

  const ev = event as unknown as PublicEventView & {
    themeId?: { layout?: { sections?: ThemeSection[] } };
  };

  const themeSections = ev.themeId?.layout?.sections;
  const sections: SectionType[] =
    themeSections && themeSections.length > 0
      ? themeSections
          .filter((s) => s.enabled)
          .sort((a, b) => a.order - b.order)
          .map((s) => s.type)
      : DEFAULT_SECTIONS;

  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title,
    description: ev.summary || ev.title,
    startDate: ev.startsAt ? new Date(ev.startsAt).toISOString() : undefined,
    endDate: ev.endsAt ? new Date(ev.endsAt).toISOString() : undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: ev.venue || "Vidyavardhini's College of Engineering and Technology (VCET)",
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'K.T. Marg, Vartak College Campus',
        addressLocality: 'Vasai Road (W)',
        addressRegion: 'Maharashtra',
        postalCode: '401202',
        addressCountry: 'IN',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'VCET NSDC',
      url: APP_CONFIG.url,
    },
    offers: {
      '@type': 'Offer',
      price: ev.registration?.fee ?? 0,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `${APP_CONFIG.url}/events/${slug}/register`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(eventJsonLd) }}
      />
      <main className="min-h-full w-full pt-24 pb-20">
        {sections.map((type, i) => (
          <SectionRenderer key={`${type}-${i}`} type={type} event={ev} />
        ))}
      </main>
    </>
  );
}
