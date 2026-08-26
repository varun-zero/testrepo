import type { Metadata } from 'next';
import { Instagram, Linkedin, Youtube, Mail } from 'lucide-react';
import { NAVIGATION, APP_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Socials',
  description: 'Follow VCET NSDC on Instagram, LinkedIn, and YouTube for event announcements, workshop recaps, and student developer community updates.',
  alternates: { canonical: '/socials' },
  openGraph: {
    title: 'Socials | VCET NSDC',
    description: 'Follow VCET NSDC across platforms.',
    url: `${APP_CONFIG.url}/socials`,
    siteName: APP_CONFIG.name,
  },
};

const ICONS = {
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  mail: Mail,
} as const;

export default function SocialsPage() {
  return (
    <main className="min-h-full flex items-center justify-center px-4 pt-32 pb-20">
      <div className="max-w-2xl w-full text-center">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white mb-4">
          Connect with{' '}
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            VCET NSDC
          </span>
        </h1>
        <p className="text-white/70 mb-10 font-sans">
          Event announcements, workshop recaps, and community updates — pick your platform.
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {NAVIGATION.social.map(({ label, href, icon }) => {
            const Icon = ICONS[icon as keyof typeof ICONS] ?? Mail;
            return (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  className="flex items-center gap-3 p-5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-violet-400/40 text-left transition-all group"
                >
                  <span className="p-3 rounded-xl bg-violet-500/15 border border-violet-400/30 text-violet-300 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="text-white font-medium">{label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
