import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
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
            <Link href="/about" className="text-gray-600 hover:text-gray-900">
              About
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/download"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="section-padding flex flex-1 flex-col items-center justify-center text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center rounded-full border border-accent-200 bg-accent-50 px-4 py-1.5 text-sm text-accent-700">
            <span className="mr-2">🔒</span>
            Your DNA never leaves your device
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Your Genes, Your Keys,{' '}
            <span className="gradient-text">Your Insights</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 sm:text-xl">
            Privacy-first genetic analysis with 100% local processing. Upload your 23andMe or
            AncestryDNA data and get actionable health insights without ever uploading your genome
            to the cloud.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/download"
              className="w-full rounded-lg bg-primary-600 px-8 py-3 text-lg font-medium text-white hover:bg-primary-700 sm:w-auto"
            >
              Start Free Analysis
            </Link>
            <Link
              href="/features"
              className="w-full rounded-lg border border-gray-300 px-8 py-3 text-lg font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
            >
              See Features
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            No account required. No data uploaded. Works offline.
          </p>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-y border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary-600">100%</div>
              <div className="text-sm text-gray-600">Local Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary-600">0</div>
              <div className="text-sm text-gray-600">Data Uploads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary-600">341K+</div>
              <div className="text-sm text-gray-600">Clinical Variants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary-600">$29</div>
              <div className="text-sm text-gray-600">One-Time Price</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Privacy Matters */}
      <section className="section-padding">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              Why Privacy Matters for Your DNA
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-gray-600">
              After the 23andMe breach affecting 6.9 million users and Nebula Genomics privacy
              lawsuit, consumers are right to be concerned.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Data Breaches</h3>
              <p className="text-gray-600">
                6.9M users affected by 23andMe breach. 92M accounts in MyHeritage breach. Your DNA
                is permanent - it can&apos;t be changed like a password.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Tracking Pixels</h3>
              <p className="text-gray-600">
                Nebula Genomics lawsuit alleges sharing genetic data with Meta, Google, and
                Microsoft via tracking pixels. Privacy policies often permit broad sharing.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">GenomeForge Solution</h3>
              <p className="text-gray-600">
                Your genetic data is processed 100% locally on your device. No uploads, no cloud
                storage, no tracking. You control your data completely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="section-padding bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              Comprehensive Genetic Analysis
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-gray-600">
              Get the same insights as expensive services - without compromising your privacy.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 text-3xl">🧬</div>
              <h3 className="mb-2 font-semibold text-gray-900">Disease Risk Report</h3>
              <p className="text-sm text-gray-600">
                Identify pathogenic variants matched against 341K+ ClinVar entries with star
                ratings.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 text-3xl">💊</div>
              <h3 className="mb-2 font-semibold text-gray-900">Pharmacogenomics</h3>
              <p className="text-gray-600 text-sm">
                Drug metabolism insights from PharmGKB with CPIC dosing guidelines.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 text-3xl">🤖</div>
              <h3 className="mb-2 font-semibold text-gray-900">AI Chat</h3>
              <p className="text-sm text-gray-600">
                Ask questions about your genome using your own AI keys or offline with Ollama.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 text-3xl">📋</div>
              <h3 className="mb-2 font-semibold text-gray-900">Health Protocol</h3>
              <p className="text-sm text-gray-600">
                Actionable recommendations for nutrition, lifestyle, and supplements.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/features" className="text-primary-600 hover:text-primary-700 font-medium">
              See all features →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Ready to analyze your genome privately?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-gray-600">
            Upload your 23andMe or AncestryDNA raw data. No account needed. No data uploaded to any
            server.
          </p>
          <Link
            href="/download"
            className="inline-block rounded-lg bg-primary-600 px-8 py-3 text-lg font-medium text-white hover:bg-primary-700"
          >
            Get Started - $29 One-Time
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="text-lg font-bold text-primary-600">GenomeForge</div>
              <p className="mt-2 text-sm text-gray-600">
                Privacy-first genetic analysis. Your genes, your keys, your insights.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-gray-900">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/features" className="hover:text-gray-900">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-gray-900">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/download" className="hover:text-gray-900">
                    Download
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-gray-900">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/docs" className="hover:text-gray-900">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-gray-900">
                    About
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-gray-900">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/privacy" className="hover:text-gray-900">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-gray-900">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} GenomeForge. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
