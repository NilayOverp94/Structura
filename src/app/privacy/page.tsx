import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-txt-primary mb-8">Privacy Policy</h1>
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-txt-secondary">
          <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <h2 className="text-xl font-semibold text-txt-primary">1. Information We Collect</h2>
          <p>CodeCompass AI collects the following information when you use our service:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-txt-primary">Account Information:</strong> Email address and authentication credentials when you create an account.</li>
            <li><strong className="text-txt-primary">Repository Data:</strong> Public repository source code, metadata, and structure retrieved from GitHub for analysis purposes.</li>
            <li><strong className="text-txt-primary">Usage Data:</strong> Analysis history, chat conversations, and interaction patterns within the application.</li>
          </ul>

          <h2 className="text-xl font-semibold text-txt-primary">2. How We Use Your Information</h2>
          <p>We use collected information to provide repository analysis, generate AI-powered insights, maintain your analysis history, and improve the service.</p>

          <h2 className="text-xl font-semibold text-txt-primary">3. Data Storage</h2>
          <p>Your data is stored securely using Supabase with row-level security policies. Repository analysis data is associated with your account and not shared with other users.</p>

          <h2 className="text-xl font-semibold text-txt-primary">4. Third-Party Services</h2>
          <p>We use GitHub API to access public repository data, Google Gemini for AI analysis, and Supabase for authentication and data storage.</p>

          <h2 className="text-xl font-semibold text-txt-primary">5. Data Retention</h2>
          <p>Repository analysis data is retained as long as your account is active. You may request deletion of your data at any time.</p>

          <h2 className="text-xl font-semibold text-txt-primary">6. Contact</h2>
          <p>For privacy inquiries, contact us through the application settings.</p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
