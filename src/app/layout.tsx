/**
 * Root Layout Component
 * Main layout wrapper with fonts, metadata, OpenGraph, and JSON-LD Structured Data
 */

import type { Metadata, Viewport } from 'next';
import { Dosis, Manrope } from 'next/font/google';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import ShaderBackground from '@/components/shader-background';
import { APP_CONFIG, CONTACT_INFO } from '@/lib/constants';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { safeJsonLd } from '@/lib/jsonld';
import './globals.css';
import SocialSidebar from '@/components/socialsidebar';

const dosis = Dosis({
  subsets: ['latin'],
  variable: '--font-dosis',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

// ============================================================================
// METADATA CONFIGURATION (SEO OPTIMIZED)
// ============================================================================

export const metadata: Metadata = {
  title: {
    default: "VCET NSDC | National Student Data Corps - Vidyavardhini's College of Engineering",
    template: `%s | ${APP_CONFIG.shortName}`,
  },
  description: APP_CONFIG.description,
  keywords: [...APP_CONFIG.keywords],
  authors: [{ name: APP_CONFIG.author, url: APP_CONFIG.url }],
  creator: APP_CONFIG.author,
  publisher: APP_CONFIG.author,
  category: 'Education & Technology',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(APP_CONFIG.url),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: APP_CONFIG.url,
    title: "VCET NSDC | National Student Data Corps",
    description: APP_CONFIG.description,
    siteName: APP_CONFIG.name,
    images: [
      {
        url: `${APP_CONFIG.url}/assests/poster.jpg`,
        width: 1200,
        height: 630,
        alt: 'VCET NSDC Official Chapter',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "VCET NSDC | National Student Data Corps",
    description: APP_CONFIG.description,
    images: [`${APP_CONFIG.url}/assests/poster.jpg`],
    creator: '@vcet_nsdc',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0b0b14' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0b14' },
  ],
};

// ============================================================================
// SCHEMA.ORG JSON-LD STRUCTURED DATA
// ============================================================================

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'VCET NSDC',
  alternateName: 'National Student Data Corps - VCET Chapter',
  url: APP_CONFIG.url,
  logo: `${APP_CONFIG.url}/icon.svg`,
  description: APP_CONFIG.description,
  address: {
    '@type': 'PostalAddress',
    streetAddress: CONTACT_INFO.address.street,
    addressLocality: CONTACT_INFO.address.campus,
    addressRegion: CONTACT_INFO.address.state,
    postalCode: CONTACT_INFO.address.pincode,
    addressCountry: 'IN',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    email: CONTACT_INFO.email,
    contactType: 'student chapter',
  },
  sameAs: [
    'https://instagram.com/vcet_nsdc',
    'https://linkedin.com/company/vcet-nsdc',
    'https://youtube.com/@vcet_nsdc',
  ],
};

const jsonLdCollege = {
  '@context': 'https://schema.org',
  '@type': 'CollegeOrUniversity',
  name: 'Vidyavardhini\'s College of Engineering and Technology',
  alternateName: 'VCET Vasai',
  url: 'https://vcet.edu.in',
  address: {
    '@type': 'PostalAddress',
    streetAddress: CONTACT_INFO.address.street,
    addressLocality: 'Vasai Road',
    addressRegion: 'Maharashtra',
    postalCode: '401202',
    addressCountry: 'IN',
  },
};

// ============================================================================
// ROOT LAYOUT COMPONENT
// ============================================================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`min-h-screen ${dosis.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://ik.imagekit.io" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      
        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//ik.imagekit.io" />

        {/* Schema.org JSON-LD Scripts */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdCollege) }}
        />
      </head>
      <body
        className="antialiased dark min-h-screen flex flex-col font-sans"
        suppressHydrationWarning
      >
        <AuthProvider>
          <ErrorBoundary>
            <Navbar />
            <div className="flex-1 relative">
              <ShaderBackground />
              <div className="relative z-10">
                <SocialSidebar />
                {children}
              </div>
            </div>
            <Footer />
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
