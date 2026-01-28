import Link from 'next/link';

export const metadata = {
  title: 'Pricing - GenomeForge',
  description: 'Simple, transparent pricing. One-time purchase, no subscriptions.'
};

export default function Pricing() {
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
            <Link href="/pricing" className="font-medium text-primary-600">
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

      {/* Pricing Header */}
      <section className="section-padding text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
          Simple, Transparent Pricing
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          One-time purchase. No subscriptions. No hidden fees. No supplement upsells.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            {/* BYOK Plan */}
            <div className="rounded-2xl border border-gray-200 p-8">
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-500">BYOK</span>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">$29</span>
                <span className="text-gray-500"> one-time</span>
              </div>
              <p className="mb-8 text-gray-600">
                Bring your own AI keys (OpenAI, Anthropic, Google) or use Ollama offline. Perfect
                for tech-savvy users who want full control.
              </p>

              <ul className="mb-8 space-y-4">
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 text-accent-500"
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
                  <span>100% local processing</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 text-accent-500"
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
                  <span>All 4 report types</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 text-accent-500"
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
                  <span>ClinVar + PharmGKB databases</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 text-accent-500"
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
                  <span>Use your own API keys</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 text-accent-500"
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
                  <span>Ollama offline support</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 text-accent-500"
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
                  <span>Lifetime updates</span>
                </li>
              </ul>

              <Link
                href="/download"
                className="block w-full rounded-lg border border-primary-600 py-3 text-center font-medium text-primary-600 hover:bg-primary-50"
              >
                Get BYOK
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-2xl border-2 border-primary-600 p-8">
              <div className="absolute -top-3 right-8 rounded-full bg-primary-600 px-3 py-1 text-xs font-medium text-white">
                Most Popular
              </div>
              <div className="mb-4">
                <span className="text-sm font-medium text-primary-600">Pro</span>
              </div>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">$49</span>
                <span className="text-gray-500"> one-time</span>
              </div>
              <p className="mb-8 text-gray-600">
                Everything in BYOK plus pre-configured AI access. Just upload your genome and start
                exploring.
              </p>

              <ul className="mb-8 space-y-4">
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 text-accent-500"
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
                  <span>Everything in BYOK</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 text-accent-500"
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
                  <span className="font-medium">1000 AI queries included</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 text-accent-500"
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
                  <span>No API key setup required</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 text-accent-500"
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
                  <span>GWAS Catalog integration</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 text-accent-500"
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
                  <span>Priority support</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-3 h-6 w-6 text-accent-500"
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
                  <span>Family plan upgrade available</span>
                </li>
              </ul>

              <Link
                href="/download"
                className="block w-full rounded-lg bg-primary-600 py-3 text-center font-medium text-white hover:bg-primary-700"
              >
                Get Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="section-padding bg-gray-50">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
            Compare to Competitors
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-4 pr-4 font-semibold text-gray-900">Feature</th>
                  <th className="py-4 px-4 text-center font-semibold text-primary-600">
                    GenomeForge
                  </th>
                  <th className="py-4 px-4 text-center font-semibold text-gray-500">SelfDecode</th>
                  <th className="py-4 px-4 text-center font-semibold text-gray-500">Promethease</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="py-4 pr-4">Price</td>
                  <td className="py-4 px-4 text-center font-medium text-primary-600">
                    $29-49 one-time
                  </td>
                  <td className="py-4 px-4 text-center text-gray-500">$319-894+</td>
                  <td className="py-4 px-4 text-center text-gray-500">$15</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 pr-4">Local Processing</td>
                  <td className="py-4 px-4 text-center text-accent-500">✓</td>
                  <td className="py-4 px-4 text-center text-gray-400">✗</td>
                  <td className="py-4 px-4 text-center text-gray-400">✗</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 pr-4">AI Chat</td>
                  <td className="py-4 px-4 text-center text-accent-500">✓</td>
                  <td className="py-4 px-4 text-center text-accent-500">✓</td>
                  <td className="py-4 px-4 text-center text-gray-400">✗</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 pr-4">BYOK AI</td>
                  <td className="py-4 px-4 text-center text-accent-500">✓</td>
                  <td className="py-4 px-4 text-center text-gray-400">✗</td>
                  <td className="py-4 px-4 text-center text-gray-400">✗</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 pr-4">Offline Mode</td>
                  <td className="py-4 px-4 text-center text-accent-500">✓</td>
                  <td className="py-4 px-4 text-center text-gray-400">✗</td>
                  <td className="py-4 px-4 text-center text-gray-400">✗</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 pr-4">No Upsells</td>
                  <td className="py-4 px-4 text-center text-accent-500">✓</td>
                  <td className="py-4 px-4 text-center text-gray-400">✗</td>
                  <td className="py-4 px-4 text-center text-accent-500">✓</td>
                </tr>
                <tr>
                  <td className="py-4 pr-4">Actionable Recommendations</td>
                  <td className="py-4 px-4 text-center text-accent-500">✓</td>
                  <td className="py-4 px-4 text-center text-accent-500">✓</td>
                  <td className="py-4 px-4 text-center text-gray-400">✗</td>
                </tr>
              </tbody>
            </table>
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
