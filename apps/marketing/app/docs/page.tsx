import Link from 'next/link';

export const metadata = {
  title: 'Documentation - GenomeForge',
  description: 'Learn how to use GenomeForge for genetic analysis.'
};

export default function Docs() {
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
            <Link href="/docs" className="font-medium text-primary-600">
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

      {/* Docs Content */}
      <section className="section-padding">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold text-gray-900">Documentation</h1>

          {/* Quick Start */}
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Quick Start</h2>
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 font-semibold text-gray-900">1. Get your raw DNA data</h3>
                <p className="text-sm text-gray-600">
                  Download your raw data file from 23andMe, AncestryDNA, or other supported
                  providers. This is usually a .txt or .csv file.
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 font-semibold text-gray-900">2. Upload to GenomeForge</h3>
                <p className="text-sm text-gray-600">
                  Drag and drop your file into the app. Processing happens entirely in your browser
                  - no data is uploaded.
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 font-semibold text-gray-900">3. Explore your results</h3>
                <p className="text-sm text-gray-600">
                  View reports, ask questions with AI, and export PDFs. All analysis happens
                  locally.
                </p>
              </div>
            </div>
          </div>

          {/* Supported Formats */}
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Supported File Formats</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-semibold text-gray-900">Provider</th>
                  <th className="py-2 text-left font-semibold text-gray-900">Format</th>
                  <th className="py-2 text-left font-semibold text-gray-900">SNPs</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b">
                  <td className="py-2">23andMe</td>
                  <td className="py-2">.txt (TSV)</td>
                  <td className="py-2">~630,000</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">AncestryDNA</td>
                  <td className="py-2">.txt (CSV)</td>
                  <td className="py-2">~700,000</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">MyHeritage</td>
                  <td className="py-2">.csv</td>
                  <td className="py-2">~700,000</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">FamilyTreeDNA</td>
                  <td className="py-2">.csv</td>
                  <td className="py-2">~700,000</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">LivingDNA</td>
                  <td className="py-2">.csv</td>
                  <td className="py-2">~600,000</td>
                </tr>
                <tr>
                  <td className="py-2">VCF (WGS/WES)</td>
                  <td className="py-2">.vcf</td>
                  <td className="py-2">Variable</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* AI Setup */}
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Setting Up AI</h2>

            <h3 className="mb-2 mt-6 font-semibold text-gray-900">Option 1: BYOK (Cloud APIs)</h3>
            <p className="mb-4 text-sm text-gray-600">
              Use your own API keys from OpenAI, Anthropic, or Google. Your keys are encrypted
              locally and never sent to our servers.
            </p>
            <ol className="mb-6 list-inside list-decimal space-y-2 text-sm text-gray-600">
              <li>Go to Settings → AI Provider</li>
              <li>Select your provider (OpenAI, Anthropic, or Google)</li>
              <li>Paste your API key</li>
              <li>The key is encrypted and stored locally</li>
            </ol>

            <h3 className="mb-2 font-semibold text-gray-900">Option 2: Ollama (100% Offline)</h3>
            <p className="mb-4 text-sm text-gray-600">
              Run AI completely offline with Ollama. Requires a capable computer.
            </p>
            <ol className="mb-6 list-inside list-decimal space-y-2 text-sm text-gray-600">
              <li>
                Install Ollama from{' '}
                <a href="https://ollama.ai" className="text-primary-600 hover:underline">
                  ollama.ai
                </a>
              </li>
              <li>
                Run: <code className="rounded bg-gray-100 px-1">ollama pull biomistral</code>
              </li>
              <li>In GenomeForge Settings, select Ollama as your provider</li>
              <li>Start chatting - everything runs locally!</li>
            </ol>
          </div>

          {/* Reports */}
          <div className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Understanding Reports</h2>

            <h3 className="mb-2 mt-6 font-semibold text-gray-900">Risk Levels</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-red-500"></span>
                <span className="text-gray-600">
                  <strong>High:</strong> Pathogenic variant with high-confidence classification
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-yellow-500"></span>
                <span className="text-gray-600">
                  <strong>Moderate:</strong> Likely pathogenic or variant of uncertain significance
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-green-500"></span>
                <span className="text-gray-600">
                  <strong>Low:</strong> Benign or likely benign variant
                </span>
              </div>
            </div>

            <h3 className="mb-2 mt-6 font-semibold text-gray-900">ClinVar Star Ratings</h3>
            <p className="text-sm text-gray-600">
              Star ratings (0-4) indicate the level of review and confidence in the classification:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>⭐⭐⭐⭐ Practice guideline</li>
              <li>⭐⭐⭐ Reviewed by expert panel</li>
              <li>⭐⭐ Multiple submitters, no conflicts</li>
              <li>⭐ Single submitter</li>
              <li>☆ No assertion criteria provided</li>
            </ul>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="mb-4 text-2xl font-bold text-gray-900">FAQ</h2>

            <div className="space-y-4">
              <div>
                <h3 className="mb-1 font-semibold text-gray-900">
                  Is my genetic data really private?
                </h3>
                <p className="text-sm text-gray-600">
                  Yes. Your genome file is processed entirely in your browser using WebAssembly. It
                  never leaves your device. We have no servers that could receive it even if we
                  wanted to.
                </p>
              </div>

              <div>
                <h3 className="mb-1 font-semibold text-gray-900">
                  What about the AI conversations?
                </h3>
                <p className="text-sm text-gray-600">
                  When using BYOK APIs, only summarized findings (not raw genome data) are sent to
                  the AI. With Ollama, everything stays on your device. API keys are encrypted
                  locally.
                </p>
              </div>

              <div>
                <h3 className="mb-1 font-semibold text-gray-900">
                  How accurate is this compared to clinical testing?
                </h3>
                <p className="text-sm text-gray-600">
                  GenomeForge is for informational purposes only. While we use clinical-grade
                  databases (ClinVar, PharmGKB), consumer DNA chips have lower coverage than
                  clinical sequencing. Always consult healthcare professionals for medical
                  decisions.
                </p>
              </div>

              <div>
                <h3 className="mb-1 font-semibold text-gray-900">Can I delete my data?</h3>
                <p className="text-sm text-gray-600">
                  Since all data is stored locally, you have complete control. Clear your browser
                  data or delete the app to remove everything. We have nothing to delete on our end.
                </p>
              </div>
            </div>
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
