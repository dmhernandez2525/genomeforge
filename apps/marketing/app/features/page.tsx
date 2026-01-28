import Link from 'next/link';

export const metadata = {
  title: 'Features - GenomeForge',
  description: 'Comprehensive genetic analysis with privacy-first architecture.'
};

export default function Features() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="border-b border-gray-100">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-primary-600">
            GenomeForge
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/features" className="font-medium text-primary-600">
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
        <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
          Powerful Genetic Analysis
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Everything you need to understand your genome, without compromising your privacy.
        </p>
      </section>

      {/* Feature Sections */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Privacy Architecture */}
          <div className="mb-24">
            <div className="mb-12 text-center">
              <span className="mb-4 inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                Privacy First
              </span>
              <h2 className="text-3xl font-bold text-gray-900">100% Local Processing</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold">No Cloud Uploads</h3>
                <p className="text-gray-600">
                  Your genome file is processed entirely in your browser. It never touches our
                  servers.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold">Encrypted Keys</h3>
                <p className="text-gray-600">
                  API keys stored locally with AES-256-GCM encryption. We never see your keys.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold">Works Offline</h3>
                <p className="text-gray-600">
                  Use Ollama for 100% offline AI. No internet required for core analysis.
                </p>
              </div>
            </div>
          </div>

          {/* Reports */}
          <div className="mb-24">
            <div className="mb-12 text-center">
              <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                Comprehensive Reports
              </span>
              <h2 className="text-3xl font-bold text-gray-900">4 Detailed Report Types</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-6">
                <div className="mb-4 flex items-center">
                  <span className="mr-3 text-3xl">🧬</span>
                  <h3 className="text-xl font-semibold">Exhaustive Genetic Report</h3>
                </div>
                <p className="mb-4 text-gray-600">
                  Complete analysis of drug metabolism genes, methylation pathways, nutrition genes,
                  and carrier status.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• CYP450 enzyme variants</li>
                  <li>• MTHFR and methylation genes</li>
                  <li>• Vitamin metabolism (BCMO1, VDR, etc.)</li>
                  <li>• Carrier status for 100+ conditions</li>
                </ul>
              </div>
              <div className="rounded-xl border border-gray-200 p-6">
                <div className="mb-4 flex items-center">
                  <span className="mr-3 text-3xl">⚠️</span>
                  <h3 className="text-xl font-semibold">Disease Risk Report</h3>
                </div>
                <p className="mb-4 text-gray-600">
                  Identify pathogenic variants with ClinVar star ratings and confidence levels.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• 341K+ ClinVar variants</li>
                  <li>• 0-4 star review status</li>
                  <li>• Color-coded risk levels</li>
                  <li>• Literature citations</li>
                </ul>
              </div>
              <div className="rounded-xl border border-gray-200 p-6">
                <div className="mb-4 flex items-center">
                  <span className="mr-3 text-3xl">💊</span>
                  <h3 className="text-xl font-semibold">Pharmacogenomics Report</h3>
                </div>
                <p className="mb-4 text-gray-600">
                  Understand how your genes affect drug metabolism with CPIC dosing guidelines.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Metabolizer phenotypes</li>
                  <li>• 715+ drug annotations</li>
                  <li>• FDA label warnings</li>
                  <li>• CPIC/DPWG guidelines</li>
                </ul>
              </div>
              <div className="rounded-xl border border-gray-200 p-6">
                <div className="mb-4 flex items-center">
                  <span className="mr-3 text-3xl">📋</span>
                  <h3 className="text-xl font-semibold">Health Protocol</h3>
                </div>
                <p className="mb-4 text-gray-600">
                  Actionable recommendations based on your genetic profile. No supplement upsells.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Nutrition recommendations</li>
                  <li>• Lifestyle suggestions</li>
                  <li>• Exercise considerations</li>
                  <li>• Evidence-based rationale</li>
                </ul>
              </div>
            </div>
          </div>

          {/* AI Features */}
          <div className="mb-24">
            <div className="mb-12 text-center">
              <span className="mb-4 inline-block rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
                BYOK AI
              </span>
              <h2 className="text-3xl font-bold text-gray-900">Chat With Your Genome</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-4 text-xl font-semibold">Your Keys, Your Choice</h3>
                <p className="mb-6 text-gray-600">
                  Use your own API keys from OpenAI, Anthropic, or Google - or run 100% offline with
                  Ollama. We never see your keys or your conversations.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <svg
                      className="mr-3 h-5 w-5 text-accent-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    OpenAI GPT-4 / GPT-4o
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="mr-3 h-5 w-5 text-accent-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Anthropic Claude 3.5 / Opus
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="mr-3 h-5 w-5 text-accent-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Google Gemini
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="mr-3 h-5 w-5 text-accent-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Ollama (100% offline)
                  </li>
                </ul>
              </div>
              <div className="rounded-xl bg-gray-900 p-6 text-white">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-4 font-mono text-sm">
                  <div className="text-gray-400">You: What does my CYP2D6 status mean?</div>
                  <div className="text-green-400">
                    AI: Based on your analysis, you have intermediate CYP2D6 metabolism. This means
                    you may process certain medications (like codeine, tramadol, and some
                    antidepressants) more slowly than normal metabolizers...
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Supported Formats */}
          <div>
            <div className="mb-12 text-center">
              <span className="mb-4 inline-block rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
                Compatibility
              </span>
              <h2 className="text-3xl font-bold text-gray-900">Works With Your DNA Data</h2>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {['23andMe', 'AncestryDNA', 'MyHeritage', 'FamilyTreeDNA', 'LivingDNA', 'VCF'].map(
                (format) => (
                  <div
                    key={format}
                    className="rounded-lg border border-gray-200 px-6 py-3 text-center"
                  >
                    <span className="font-medium text-gray-900">{format}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-primary-600 text-center text-white">
        <h2 className="mb-4 text-3xl font-bold">Ready to explore your genome?</h2>
        <p className="mx-auto mb-8 max-w-2xl opacity-90">
          Upload your DNA data and get comprehensive insights in minutes.
        </p>
        <Link
          href="/download"
          className="inline-block rounded-lg bg-white px-8 py-3 font-medium text-primary-600 hover:bg-gray-100"
        >
          Get Started
        </Link>
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
