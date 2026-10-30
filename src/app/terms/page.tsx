import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-txt-primary mb-8">Terms of Service</h1>
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-txt-secondary">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <h2 className="text-xl font-semibold text-txt-primary">1. Acceptance of Terms</h2>
          <p>By accessing or using Structura, you agree to be bound by these Terms of Service.</p>

          <h2 className="text-xl font-semibold text-txt-primary">2. Description of Service</h2>
          <p>Structura is an AI-powered repository analysis platform that helps developers understand unfamiliar codebases by analyzing public GitHub repositories.</p>

          <h2 className="text-xl font-semibold text-txt-primary">3. Acceptable Use</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You may only analyze public GitHub repositories you have the right to access.</li>
            <li>You must not use the service to extract or redistribute proprietary code.</li>
            <li>You must not attempt to circumvent rate limits or abuse the service.</li>
            <li>You must not use the service for any unlawful purpose.</li>
          </ul>

          <h2 className="text-xl font-semibold text-txt-primary">4. AI-Generated Content</h2>
          <p>AI-generated explanations, architecture analyses, and code insights are provided as assistance tools. They may contain inaccuracies and should not be treated as authoritative documentation.</p>

          <h2 className="text-xl font-semibold text-txt-primary">5. Limitation of Liability</h2>
          <p>Structura is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from your use of the service.</p>

          <h2 className="text-xl font-semibold text-txt-primary">6. Changes to Terms</h2>
          <p>We may modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.</p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
