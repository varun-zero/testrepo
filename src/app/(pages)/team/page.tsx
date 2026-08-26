import { Metadata } from 'next';
import { readFile } from 'fs/promises';
import path from 'path';
import Teams, { type TeamMember } from '@/components/team/Teams';
import { APP_CONFIG } from '@/lib/constants';
import { getPublishedByType } from '@/server/services/cmsService';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Our Core Team',
  description: 'Meet the passionate student leaders, committee members, and mentors behind VCET NSDC Student Chapter at Vidyavardhini\'s College of Engineering and Technology.',
  keywords: ['VCET NSDC Team', 'NSDC Core Committee', 'VCET Student Leaders', ...APP_CONFIG.keywords],
  openGraph: {
    title: 'Our Core Team | VCET NSDC',
    description: 'Meet the passionate student leaders and mentors behind VCET NSDC.',
    url: `${APP_CONFIG.url}/team`,
    siteName: APP_CONFIG.name,
  },
};

interface CmsTeamEntry {
  key?: string;
  order?: number;
  data: {
    name?: string;
    position?: string;
    email?: string;
    instagram?: string;
    linkedin?: string;
    photo?: string;
    group?: string;
  };
}

function toMember(entry: CmsTeamEntry, index: number): TeamMember | null {
  const d = entry.data;
  if (!d?.name) return null;
  return {
    id: index + 1,
    name: d.name,
    position: d.position || 'Member',
    email: d.email || '',
    instagram: d.instagram || '',
    linkedin: d.linkedin || '',
    photo: d.photo || '/assests/image.png',
  };
}

/** Group label → section. Entries tagged TE/DEPUTY land in Deputys; rest in HEADS. */
function isDeputy(entry: CmsTeamEntry): boolean {
  const g = `${entry.data?.group ?? ''} ${entry.key ?? ''}`.toUpperCase();
  return g.includes('TE') || g.includes('DEPUTY') || g.includes('JUNIOR');
}

async function loadStaticFallback(): Promise<{ heads: TeamMember[]; deputies: TeamMember[] }> {
  try {
    const dir = path.join(process.cwd(), 'public', 'staticdata');
    const [beRaw, teRaw] = await Promise.all([
      readFile(path.join(dir, 'BE.json'), 'utf8'),
      readFile(path.join(dir, 'TE.json'), 'utf8'),
    ]);
    const be = JSON.parse(beRaw) as TeamMember[];
    const te = JSON.parse(teRaw) as TeamMember[];
    return {
      heads: Array.isArray(be) ? be : [],
      deputies: Array.isArray(te) ? te : [],
    };
  } catch {
    return { heads: [], deputies: [] };
  }
}

async function loadTeam(): Promise<{ heads: TeamMember[]; deputies: TeamMember[] }> {
  try {
    const entries = (await getPublishedByType('team')) as unknown as CmsTeamEntry[];
    if (entries && entries.length > 0) {
      const heads: TeamMember[] = [];
      const deputies: TeamMember[] = [];
      entries.forEach((entry, i) => {
        const member = toMember(entry, i);
        if (!member) return;
        (isDeputy(entry) ? deputies : heads).push(member);
      });
      if (heads.length > 0 || deputies.length > 0) return { heads, deputies };
    }
  } catch {
    // fall through to static data
  }
  return loadStaticFallback();
}

export default async function TeamPage() {
  const { heads, deputies } = await loadTeam();

  return (
    <main className="min-h-full py-20">
      <div className="max-w-7xl mx-auto px-6">
        <Teams beTeam={heads} teTeam={deputies} />
      </div>
    </main>
  );
}
