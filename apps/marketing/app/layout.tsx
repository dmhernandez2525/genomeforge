import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GenomeForge - Your Genes, Your Keys, Your Insights',
  description:
    'Privacy-first genetic analysis. Your DNA data never leaves your device. Bring your own AI keys or use offline models.',
  keywords: [
    'genetic analysis',
    'DNA testing',
    'privacy',
    'local processing',
    '23andMe',
    'AncestryDNA',
    'pharmacogenomics'
  ],
  openGraph: {
    title: 'GenomeForge - Privacy-First Genetic Analysis',
    description: 'Your DNA data never leaves your device. 100% local processing.',
    type: 'website'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  );
}
