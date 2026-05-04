import type { Metadata } from 'next';
import { Manrope, Kanit } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  display: 'swap',
});

const kanit = Kanit({
  variable: '--font-kanit',
  weight: ['300', '400', '500', '600'],
  subsets: ['thai', 'latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Khunapoj Suttenon — Portfolio',
  description:
    'Computer Engineering student & Web Developer. Explore my projects, skills, certifications, and achievements.',
  keywords: ['portfolio', 'computer engineering', 'web developer', 'Khunapoj Suttenon'],
  authors: [{ name: 'Khunapoj Suttenon' }],
  openGraph: {
    title: 'Khunapoj Suttenon — Portfolio',
    description:
      'Computer Engineering student & Web Developer. Explore my projects, skills, certifications, and achievements.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${kanit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
