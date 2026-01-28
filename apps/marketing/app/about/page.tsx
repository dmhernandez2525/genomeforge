import Link from 'next/link';

export const metadata = {
  title: 'About - GenomeForge',
  description: 'Learn about GenomeForge privacy architecture and mission.'
};

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="border-b border-gray-100">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-primary-600">
            GenomeForge
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/features" className="text-gray-600 hover:text-gray-900">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/docs" className="text-gray-600 hover:text-gray-900">
              Docs
            </Link>
            <Link href="/about" className="font-medium text-primary-600">
              About
            </Link>
          </div>
          <Link
            href="/download"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Header */}
      <section className="section-padding text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">About GenomeForge</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Building the privacy-first future of genetic analysis.
        </p>
      </section>

      {/* Mission */}
      <section className="pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Our Mission</h2>
          <p className="mb-6 text-gray-600">
            GenomeForge was created in response to growing privacy concerns in the genetic testing
            industry. After the 23andMe breach affecting 6.9 million users, the Nebula Genomics
            lawsuit alleging data sharing with Big Tech, and the MyHeritage breach exposing 92.3
            million accounts, we believed there had to be a better way.
          </p>
          <p className="mb-6 text-gray-600">
            Your DNA is the most personal data you have. Unlike a password, it can never be changed.
            It identifies you uniquely and reveals sensitive information about your health,
            ancestry, and family relationships. This data deserves the highest level of protection.
          </p>
          <p className="text-gray-600">
            That&apos;s why we built GenomeForge with a fundamentally different architecture: your
            genetic data never leaves your device. Not for processing. Not for storage. Not ever.
          </p>
        </div>
      </section>

      {/* Privacy Architecture */}
      <section className="section-padding bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">Privacy Architecture</h2>

          <div className="rounded-xl border border-gray-200 bg-white p-8">
            <pre className="overflow-x-auto text-xs text-gray-600">
              {`
┌──────────────────────────────────────────────────────────────────┐
│                    YOUR DEVICE (All Processing Here)              │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   UI Layer  │  │ Core Engine │  │     Database Layer      │  │
│  │             │  │             │  │                         │  │
│  │ • Web App   │  │ • Parser    │  │ • ClinVar (341K vars)   │  │
│  │ • iOS/And   │  │ • Matcher   │  │ • PharmGKB (715 drugs)  │  │
│  │ • macOS/Win │  │ • Analyzer  │  │ • User Genome (local)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                          │                                       │
│  ┌───────────────────────▼───────────────────────────────────┐  │
│  │                    AI Layer (BYOK)                         │  │
│  │  • Your API keys encrypted with AES-256-GCM                │  │
│  │  • Only summaries sent to AI (never raw genome)            │  │
│  │  • Ollama for 100% offline                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ██████████████████████████████████████████████████████████████  │
│  ██  GENOME DATA NEVER LEAVES THIS BOUNDARY                 ██  │
│  ██████████████████████████████████████████████████████████████  │
└──────────────────────────────────────────────────────────────────┘
`}
            </pre>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 font-semibold text-gray-900">What stays on your device:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Your complete genetic data</li>
                <li>• All analysis results</li>
                <li>• Generated reports</li>
                <li>• API keys (encrypted)</li>
                <li>• Conversation history</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-gray-900">What we never receive:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Your genome file</li>
                <li>• Individual SNP data</li>
                <li>• Your API keys</li>
                <li>• Personal health information</li>
                <li>• Anything that could identify you</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section className="section-padding">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold text-gray-900">Data Sources</h2>

          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 p-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">ClinVar</h3>
                <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                  Public Domain
                </span>
              </div>
              <p className="text-sm text-gray-600">
                341,000+ clinical variant annotations from NCBI. Updated weekly. Contains
                pathogenicity classifications with star ratings for confidence.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 p-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">PharmGKB</h3>
                <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                  CC BY-SA 4.0
                </span>
              </div>
              <p className="text-sm text-gray-600">
                715+ drugs with gene annotations. Includes CPIC dosing guidelines and FDA label
                information. Updated monthly.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 p-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">gnomAD</h3>
                <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">
                  ODbL 1.0
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Population frequency data from 807,000+ individuals across 9 ancestry groups.
                Enables ancestry-aware risk assessment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="section-padding bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Medical Disclaimer</h2>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
            <p className="mb-4 text-sm text-yellow-800">
              GenomeForge is designed for informational and educational purposes only. It is NOT
              intended to diagnose, treat, cure, or prevent any disease or health condition.
            </p>
            <p className="mb-4 text-sm text-yellow-800">
              Genetic information represents only one factor in overall health. Your lifestyle,
              environment, medical history, and other factors play significant roles in health
              outcomes.
            </p>
            <p className="text-sm font-medium text-yellow-800">
              Always consult qualified healthcare professionals before making any medical decisions
              based on genetic information.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} GenomeForge. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
