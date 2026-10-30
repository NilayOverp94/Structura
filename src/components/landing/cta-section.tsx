import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 sm:py-28 border-t border-border">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-txt-primary mb-4">
          Your next open-source contribution starts here.
        </h2>
        <p className="text-lg text-txt-secondary mb-8 max-w-xl mx-auto">
          Stop spending hours figuring out unfamiliar codebases. Let AI guide you through any repository.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary text-base px-8 py-3">
            Get Started — Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="btn-secondary text-base px-8 py-3">
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}
